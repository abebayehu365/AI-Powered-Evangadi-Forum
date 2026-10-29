import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { ServiceUnavailableError } from '../../../utils/errors/index.js';

const readEnv = key => (process.env[key] || '').trim();
const GOOGLE_API_KEY = readEnv('GEMINI_API_KEY');
const GEMINI_TEXT_MODEL = readEnv('GEMINI_TEXT_MODEL') || 'gemini-2.5-flash-lite';
const GEMINI_MAX_ATTEMPTS = 3;

let genAI = null;
if (GOOGLE_API_KEY && GOOGLE_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI for text coach:', err.message);
  }
}

function parseJsonObjectFromGeminiText(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }

  try {
    const v = JSON.parse(t);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

async function withGeminiNetworkRetry(request) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (error.message !== 'fetch failed' || attempt >= GEMINI_MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
}

async function fetchGeminiJsonTextResponse(userPrompt) {
  if (!genAI) {
    return null;
  }

  const response = await withGeminiNetworkRetry(() =>
    genAI.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: userPrompt,
      config: {
        maxOutputTokens: 300,
      },
    }),
  );

  const text = response?.text;
  return typeof text === 'string' ? text : '';
}

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const userPrompt = `You help learners write clearer technical forum posts.
Question Title:
${title || ''}
Question Body (markdown allowed):
${content}
Reply with only valid JSON (no markdown fences), exactly this shape: {"tips": ["...", "..."]}
Rules:
- tips: array of 3 to 5 short strings (each under 120 characters).
- Focus on: missing context (error message, expected vs actual), reproducibility, a sharper title idea if needed, tone for peers.
- Do not claim the question is "correct" or grade homework; give constructive checklist-style tips only.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);
    const parsed = parseJsonObjectFromGeminiText(raw);
    let tips = Array.isArray(parsed?.tips)
      ? parsed.tips.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim())
      : [];

    tips = tips.slice(0, 5);
    if (tips.length === 0) {
      tips = [
        'Add any error messages or exact behavior you are experiencing',
        'State what you have already attempted and what you expected instead',
        'Include a code snippet demonstrating the problem if applicable',
      ];
    }
    return { tips };
  } catch (error) {
    console.error(
      'generateQuestionDraftCoachService error:',
      error.message,
      error.cause?.code ? `(${error.cause.code})` : '',
    );
    return {
      tips: [
        'Add any error messages or exact behavior you are experiencing',
        'State what you have already attempted and what you expected instead',
        'Include a code snippet demonstrating the problem if applicable',
      ],
    };
  }
};

export const assessAnswerAgainstQuestionService = async ({
  questionTitle,
  questionContent,
  answerText,
}) => {
  const userPrompt = `You review whether a forum Answer accurately addresses the QUESTION (relevance and completeness of engagement - not whether the answer is factually correct.)
QUESTION TITLE: ${questionTitle}
QUESTION BODY: ${questionContent}
ANSWER DRAFT: ${answerText}
Reply with only valid JSON (no markdown fences), exactly this shape: {
  "level": "strong"|"partial"|"weak",
  "note": "one short sentence"
}
RULES:
- level: "strong" if the draft clearly engages with the question; "partial" if somewhat related but missing key parts of the ask; "weak" if mostly off-topic or too vague.
- note: one sentence, plain language, no markdown, under 200 characters. Frame as fit/relevance, not grading.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);
    const parsed = parseJsonObjectFromGeminiText(raw);
    const levelRow = parsed?.level;
    const noteRow = parsed?.note;
    const level =
      levelRow === 'strong' || levelRow === 'partial' || levelRow === 'weak'
        ? levelRow
        : 'partial';
    const note =
      typeof noteRow === 'string' && noteRow.trim()
        ? noteRow.trim().slice(0, 200)
        : 'Answer addresses aspects of the question and provides relevant direction.';

    return { level, note };
  } catch (error) {
    console.error(
      'assessAnswerAgainstQuestionService error:',
      error.message,
      error.cause?.code ? `(${error.cause.code})` : '',
    );
    return {
      level: 'partial',
      note: 'Answer addresses aspects of the question and provides relevant direction.',
    };
  }
};
