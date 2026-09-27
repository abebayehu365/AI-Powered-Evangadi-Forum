import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  NotFoundError,
} from '../../../utils/errors/index.js';

const RAG_MAX_PDFS_PER_USER = parseInt(process.env.RAG_MAX_PDFS_PER_USER || '20', 10);
const RAG_CHUNK_CHARS = parseInt(process.env.RAG_CHUNK_CHARS || '900', 10);
const RAG_CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP || '120', 10);
const RAG_MIN_TEXT_CHARS = parseInt(process.env.RAG_MIN_TEXT_CHARS || '50', 10);
const RAG_MAX_CHUNKS_PER_DOC = parseInt(process.env.RAG_MAX_CHUNKS_PER_DOC || '1000', 10);
const RAG_SEARCH_THRESHOLD = parseFloat(process.env.RAG_SEARCH_THRESHOLD || '0.45');
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash-latest';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (e) {
    console.warn('Failed to initialize GoogleGenAI for RAG:', e.message);
  }
}

function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

async function generateEmbedding(text, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!genAI) return null;
  try {
    const response = await genAI.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: {
        taskType,
        outputDimensionality: 1536,
      },
    });
    return response.embedding?.values || response.embeddings?.[0]?.values || null;
  } catch (error) {
    console.warn('RAG embedding error:', error.message);
    return null;
  }
}

async function extractTextFromPdfBuffer(buffer) {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
    return {
      text: textResult?.text || '',
      pages: textResult?.pages || [],
    };
  } catch (err) {
    console.error('PDF parsing error:', err.message);
    throw new BadRequestError(`Failed to parse PDF file: ${err.message}`);
  }
}

function chunkText(text, chunkSize = RAG_CHUNK_CHARS, overlap = RAG_CHUNK_OVERLAP, maxChunks = RAG_MAX_CHUNKS_PER_DOC) {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (cleaned.length < RAG_MIN_TEXT_CHARS) {
    return [];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleaned.length && chunkIndex < maxChunks) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < cleaned.length) {
      const nextSpace = cleaned.indexOf(' ', endIndex - 40);
      if (nextSpace !== -1 && nextSpace < endIndex + 40) {
        endIndex = nextSpace;
      }
    } else {
      endIndex = cleaned.length;
    }

    const chunkContent = cleaned.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        chunkIndex,
        content: chunkContent,
        pageStart: null,
        pageEnd: null,
      });
      chunkIndex++;
    }

    if (endIndex >= cleaned.length) break;
    startIndex = endIndex - overlap;
    if (startIndex <= 0 || startIndex >= endIndex) {
      startIndex = endIndex;
    }
  }

  return chunks;
}

export const assertOwnedDocument = async ({ documentId, userId }) => {
  const sql = `
    SELECT 
      document_id,
      user_id,
      title,
      mime_type,
      storage_path,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE document_id = ? AND user_id = ?
    LIMIT 1
  `;
  const rows = await safeExecute(sql, [documentId, userId]);
  if (!rows || rows.length === 0) {
    throw new NotFoundError('Document not found');
  }
  return rows[0];
};

export const listDocumentsForUserService = async userId => {
  const sql = `
    SELECT 
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  const rows = await safeExecute(sql, [userId]);
  return rows;
};

export const getDocumentMetaService = async ({ documentId, userId }) => {
  const doc = await assertOwnedDocument({ documentId, userId });
  return doc;
};

export const deleteDocumentService = async ({ documentId, userId }) => {
  const doc = await assertOwnedDocument({ documentId, userId });

  // Delete physical file
  const fullPath = path.isAbsolute(doc.storage_path)
    ? doc.storage_path
    : path.resolve(process.cwd(), doc.storage_path);

  try {
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (err) {
    console.warn('Could not delete PDF file from disk:', err.message);
  }

  await safeExecute(`DELETE FROM documents WHERE document_id = ?`, [documentId]);
  return { id: documentId };
};

/**
 * Runs the heavy PDF processing (text extraction + embedding) in the background.
 * Called after the HTTP response has already been sent.
 */
async function processDocumentInBackground(documentId, filePath) {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    const { text } = await extractTextFromPdfBuffer(fileBuffer);

    if (!text || text.trim().length < RAG_MIN_TEXT_CHARS) {
      await safeExecute(
        `UPDATE documents SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE document_id = ?`,
        ['PDF contains insufficient readable text.', documentId],
      );
      return;
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      await safeExecute(
        `UPDATE documents SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE document_id = ?`,
        ['No extractable text segments found in PDF.', documentId],
      );
      return;
    }

    for (const chunk of chunks) {
      const chunkRes = await safeExecute(
        `INSERT INTO document_chunks (document_id, chunk_index, content, page_start, page_end) VALUES (?, ?, ?, ?, ?)`,
        [documentId, chunk.chunkIndex, chunk.content, chunk.pageStart, chunk.pageEnd],
      );
      const chunkId = chunkRes.insertId;

      const embedding = await generateEmbedding(chunk.content, 'RETRIEVAL_DOCUMENT');
      await safeExecute(
        `INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding, status) VALUES (?, ?, ?, ?)`,
        [chunkId, chunk.content, JSON.stringify(embedding || []), embedding ? 'ready' : 'failed'],
      );
    }

    await safeExecute(
      `UPDATE documents SET status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE document_id = ?`,
      [documentId],
    );
    console.log(`[RAG] Document ${documentId} ready (${chunks.length} chunks).`);
  } catch (error) {
    console.error(`[RAG] Background processing failed for doc ${documentId}:`, error.message);
    await safeExecute(
      `UPDATE documents SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE document_id = ?`,
      [error.message.slice(0, 500), documentId],
    ).catch(() => {});
  }
}

export const createDocumentFromUploadService = async ({ file, userId }) => {
  if (!file) {
    throw new BadRequestError('PDF file is required');
  }

  // Check user premium membership status
  const userRows = await safeExecute(
    `SELECT is_premium FROM users WHERE user_id = ?`,
    [userId],
  );
  const isPremium = Boolean(userRows[0]?.is_premium);

  // Check document limit: Free tier allows up to 3 documents, Premium has unlimited
  const countRows = await safeExecute(
    `SELECT COUNT(*) AS count FROM documents WHERE user_id = ?`,
    [userId],
  );
  const currentCount = Number(countRows[0]?.count || 0);

  if (!isPremium && currentCount >= 3) {
    throw new BadRequestError(
      'Free tier limit reached (maximum 3 documents in knowledge base). Upgrade to Premium for 5 Birr for unlimited document uploads.',
    );
  }

  const relativeStoragePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');

  // Insert record immediately with status 'processing'
  const insertRes = await safeExecute(
    `INSERT INTO documents (user_id, title, mime_type, storage_path, byte_size, status) VALUES (?, ?, ?, ?, ?, 'processing')`,
    [userId, file.originalname, file.mimetype || 'application/pdf', relativeStoragePath, file.size],
  );
  const documentId = insertRes.insertId;

  // Fire-and-forget: process PDF in background, do NOT await
  setImmediate(() => processDocumentInBackground(documentId, file.path));

  // Return immediately — controller sends 202 so frontend can start polling
  return {
    document_id: documentId,
    title: file.originalname,
    mime_type: file.mimetype || 'application/pdf',
    byte_size: file.size,
    status: 'processing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const searchInDocumentService = async ({ documentId, userId, query, k = 5 }) => {
  const doc = await assertOwnedDocument({ documentId, userId });
  if (doc.status !== 'ready') {
    throw new BadRequestError(`Document is currently ${doc.status}. Please wait for processing.`);
  }

  const normalizedK = k > 0 ? Math.min(k, 20) : 5;
  const queryEmbedding = await generateEmbedding(query, 'RETRIEVAL_QUERY');

  const chunkSql = `
    SELECT 
      c.chunk_id AS chunkId,
      c.chunk_index AS chunkIndex,
      c.content AS excerpt,
      v.embedding,
      v.status AS vectorStatus
    FROM document_chunks c
    LEFT JOIN document_chunk_vectors v ON v.chunk_id = c.chunk_id
    WHERE c.document_id = ?
  `;
  const rows = await safeExecute(chunkSql, [documentId]);

  let results = [];

  if (queryEmbedding && Array.isArray(queryEmbedding)) {
    const scored = [];
    for (const row of rows) {
      let vec = null;
      try {
        vec = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
      } catch (e) {
        vec = null;
      }

      if (Array.isArray(vec) && vec.length > 0) {
        const score = calculateCosineSimilarity(queryEmbedding, vec);
        scored.push({
          chunkId: row.chunkId,
          chunkIndex: row.chunkIndex,
          score,
          excerpt: row.excerpt,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    results = scored
      .filter(r => r.score >= RAG_SEARCH_THRESHOLD)
      .slice(0, normalizedK);

    // If threshold filtered everything, fallback to top scores
    if (results.length === 0 && scored.length > 0) {
      results = scored.slice(0, normalizedK);
    }
  } else {
    // Text search fallback if embedding unavailable
    const qLower = query.toLowerCase();
    const matched = rows
      .map(r => {
        const occurrences = (r.excerpt.toLowerCase().match(new RegExp(qLower.replace(/[^a-z0-9]/gi, ''), 'g')) || []).length;
        return {
          chunkId: r.chunkId,
          chunkIndex: r.chunkIndex,
          score: occurrences > 0 ? 0.5 + Math.min(occurrences * 0.1, 0.45) : 0.1,
          excerpt: r.excerpt,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, normalizedK);

    results = matched;
  }

  return {
    query,
    results: results.map(r => ({
      chunkId: r.chunkId,
      chunkIndex: r.chunkIndex,
      score: Number(r.score.toFixed(4)),
      excerpt: r.excerpt,
    })),
  };
};

export const queryDocumentService = async ({ documentId, userId, query }) => {
  const searchResult = await searchInDocumentService({
    documentId,
    userId,
    query,
    k: 5,
  });

  const topChunks = searchResult.results || [];
  if (topChunks.length === 0) {
    return {
      answer: 'No relevant text found in the document to answer this query.',
      citations: [],
      chunksUsed: [],
    };
  }

  const contextText = topChunks
    .map((c, i) => `[Excerpt ${i + 1} | Chunk ${c.chunkIndex}]:\n${c.excerpt}`)
    .join('\n\n');

  const prompt = `You are a helpful AI assistant. Answer the user's question grounded strictly on the provided DOCUMENT EXCERPTS below.
If the excerpts do not contain sufficient information to answer, state so honestly.
Format your answer clearly with markdown formatting.

DOCUMENT EXCERPTS:
${contextText}

QUESTION:
${query}

Answer:`;

  let answerText = '';

  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: { maxOutputTokens: 800 },
      });
      answerText = response?.text || '';
    } catch (e) {
      console.warn('Gemini text generation error for RAG query:', e.message);
    }
  }

  if (!answerText) {
    // Fallback grounded answer
    answerText = `Based on the document excerpts, here is the most relevant information:\n\n${topChunks[0]?.excerpt}\n\n*(Summary derived directly from source document)*`;
  }

  const citations = topChunks.map(c => ({
    ref: c.chunkId,
    chunkIndex: c.chunkIndex,
  }));

  return {
    answer: answerText,
    citations,
    chunksUsed: topChunks.map(c => c.chunkId),
  };
};
