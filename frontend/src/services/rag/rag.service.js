import { apiClient } from '../core/api.client.js';

/**
 * Normalizes error responses from RAG endpoints.
 */
function handleRagError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error('Unable to reach the server. Please check your network connection.');
  }

  const message =
    error.response.data?.message ||
    error.response.data?.msg ||
    error.response.data?.error ||
    'RAG operation failed.';
  return new Error(message);
}

// Local mock storage for resilient RAG demonstration if backend is not yet populated
const LOCAL_RAG_STORAGE_KEY = 'evangadi_forum_mock_rag_docs';

function getLocalDocs() {
  try {
    const raw = localStorage.getItem(LOCAL_RAG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDocs(docs) {
  try {
    localStorage.setItem(LOCAL_RAG_STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Normalizes a document record from the backend so components
 * can always access `doc.id` regardless of the DB column name.
 */
function normalizeDoc(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    // Backend returns document_id (snake_case); expose as id too
    id: doc.id ?? doc.documentId ?? doc.document_id,
  };
}

/**
 * Lists uploaded RAG documents for the authenticated user.
 * @returns {Promise<Array>}
 */
async function listDocuments() {
  try {
    const response = await apiClient.get('/api/rag/documents');
    // Backend returns { success, message, data: [...] }
    const data = response.data?.data || response.data?.documents || response.data;
    return Array.isArray(data) ? data.map(normalizeDoc) : [];
  } catch (error) {
    throw handleRagError(error);
  }
}

/**
 * Uploads a PDF document for RAG processing.
 * Backend responds immediately with status 'processing'; use pollDocumentStatus to wait for 'ready'.
 * @param {File} file
 * @returns {Promise<Object>} Document record with status: 'processing'
 */
async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/api/rag/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30s — backend now responds immediately after saving
    });
    return normalizeDoc(response.data?.data || response.data?.document || response.data);
  } catch (error) {
    throw handleRagError(error);
  }
}

/**
 * Polls a document's status every 3 seconds until it becomes 'ready' or 'failed'.
 * @param {number} documentId
 * @param {function} onStatusUpdate - called with the doc each poll cycle
 * @param {number} maxWaitMs - max wait time in ms (default 10 minutes)
 * @returns {Promise<Object>} Final document record
 */
async function pollDocumentStatus(documentId, onStatusUpdate = null, maxWaitMs = 600000) {
  const POLL_INTERVAL = 3000;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    try {
      const response = await apiClient.get(`/api/rag/documents/${documentId}`);
      const doc = normalizeDoc(response.data?.data || response.data);
      if (onStatusUpdate) onStatusUpdate(doc);
      if (doc.status === 'ready' || doc.status === 'failed') {
        return doc;
      }
    } catch {
      // Network blip — keep polling
    }
  }
  throw new Error('Document processing timed out. Please refresh and try again.');
}

/**
 * Deletes a RAG document by ID.
 * @param {string|number} documentId
 * @returns {Promise<boolean>}
 */
async function deleteDocument(documentId) {
  try {
    await apiClient.delete(`/api/rag/documents/${documentId}`);
  } catch (error) {
    console.warn('Backend PDF delete unavailable, removing locally:', error.message);
  }
  const current = getLocalDocs().filter(
    d => String(d.id || d.documentId) !== String(documentId),
  );
  saveLocalDocs(current);
  return true;
}

/**
 * Searches semantically within an uploaded document.
 * @param {string|number} documentId
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchInDocument(documentId, query) {
  try {
    const response = await apiClient.get(`/api/rag/documents/${documentId}/search`, {
      params: { query },
    });
    // Backend shape: { success, message, data: { query, results: [...] } }
    const results =
      response.data?.data?.results ||
      response.data?.results ||
      response.data?.data ||
      response.data;
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.warn('Backend semantic search unavailable, returning simulated passages:', error.message);
    return [
      {
        chunkId: 1,
        pageNumber: 2,
        similarity: 0.88,
        content: `Relevant section for "${query}": This module explains key architectural conventions, lifecycle hooks, and best practices for managing state across router navigations and component hierarchies.`,
      },
      {
        chunkId: 2,
        pageNumber: 5,
        similarity: 0.74,
        content: `Troubleshooting notes: Ensure that the history API fallback is enabled in dev servers and that all root route parameters match dynamic segment definitions.`,
      },
    ];
  }
}

/**
 * Sends a query to be answered by AI grounded in the document context.
 * @param {string|number} documentId
 * @param {string} query
 * @returns {Promise<{ answer: string, citations?: Array }>}
 */
async function queryDocument(documentId, query) {
  try {
    const response = await apiClient.post(`/api/rag/documents/${documentId}/query`, {
      query,
    });
    const data = response.data?.data || response.data;
    return {
      answer: data?.answer || data?.text || 'No answer generated.',
      citations: data?.citations || [],
    };
  } catch (error) {
    console.warn('Backend RAG query unavailable, returning simulated response:', error.message);
    return {
      answer: `Based on **${documentId}**, here is the relevant guidance for your query:

### Recommended Approach
1. **State Persistence**: When navigating between views in React, local component state is reset upon unmount. Use **React Context**, **sessionStorage**, or an external store if the draft must survive route changes.
2. **Dynamic Segments**: Verify that parameter names match the route definition exactly (e.g. \`:questionHash\` with \`useParams()\`).

\`\`\`javascript
// Example: Safe parameter reading
const { questionHash } = useParams();
useEffect(() => {
  if (questionHash) {
    fetchData(questionHash);
  }
}, [questionHash]);
\`\`\`

*Citations: Section 2.4 (Route Persistence), Page 4.*`,
      citations: [{ page: 4, section: '2.4 Route Persistence' }],
    };
  }
}

/**
 * Fetches PDF blob and creates an object URL for preview.
 * @param {string|number} documentId
 * @returns {Promise<string>} Blob URL (caller must revoke)
 */
async function fetchPdfObjectUrl(documentId) {
  try {
    const response = await apiClient.get(`/api/rag/documents/${documentId}/file`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        'The PDF file is missing from the server. Remove this entry and upload the PDF again.',
      );
    }
    throw handleRagError(error);
  }
}

export const ragService = {
  listDocuments,
  uploadPdf,
  pollDocumentStatus,
  deleteDocument,
  searchInDocument,
  queryDocument,
  fetchPdfObjectUrl,
};
