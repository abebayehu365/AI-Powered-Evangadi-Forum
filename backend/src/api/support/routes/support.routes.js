import express from 'express';
import { supportChatController, getSupportFaqsController } from '../controller/support.controller.js';

const router = express.Router();

// POST /api/addon/support/chat — send message to support bot
router.post('/chat', supportChatController);

// GET /api/addon/support/faqs — get suggested FAQ questions
router.get('/faqs', getSupportFaqsController);

export default router;
