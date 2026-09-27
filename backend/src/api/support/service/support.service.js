import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System prompt that scopes the bot to ForumStudy context
const SYSTEM_PROMPT = `You are the EvangadiForum Support Assistant — a helpful, friendly, and concise AI assistant embedded in the EvangadiForum platform (an educational Q&A forum).

Your role:
- Answer questions about how to use EvangadiForum (posting questions, answering, ratings, profiles, following users, knowledge base documents, dark mode, reporting content, etc.)
- Give study tips and general academic advice
- Help with common technical or conceptual questions students ask on the platform
- If asked something completely unrelated to studying or EvangadiForum, politely redirect the conversation

Tone: Warm, encouraging, professional, concise. Keep answers under 200 words unless the topic truly requires more. Use bullet points for step-by-step instructions.
if someone ask you anything other than EvangadiForum, politely tell them i am only able to answer questions about EvangadiForum. and i can't answer other questions.

Do NOT reveal that you are powered by Gemini or any specific AI provider. You are "EvangadiForum Assistant".`;

/**
 * Send a message to the support bot and get a reply.
 * @param {{ messages: Array<{role: string, content: string}>, userMessage: string }} param
 */
export const supportChatService = async ({ messages = [], userMessage }) => {
  // Build conversation history for the API
  const conversationHistory = messages
    .slice(-10) // Keep last 10 messages for context window efficiency
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Add the current user message
  conversationHistory.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const modelName = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash-latest';
  const response = await ai.models.generateContent({
    model: modelName,
    config: { systemInstruction: SYSTEM_PROMPT },
    contents: conversationHistory,
  });

  const reply = response.text ?? 'Sorry, I could not generate a response. Please try again.';

  return { reply };
};

/**
 * Get suggested FAQ questions for the bot's welcome state.
 */
export const getSupportFaqsService = () => {
  return {
    faqs: [
      'How do I post a new question?',
      'How do I rate an answer?',
      'How do I follow another user?',
      'What is the Knowledge Base?',
      'How do I switch to dark mode?',
      'How do I report inappropriate content?',
      'How do I update my profile?',
    ],
  };
};
