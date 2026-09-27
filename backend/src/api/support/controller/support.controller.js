import { StatusCodes } from 'http-status-codes';
import { supportChatService, getSupportFaqsService } from '../service/support.service.js';

export const supportChatController = async (req, res) => {
  const { messages = [], message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, msg: 'message is required' });
  }

  const result = await supportChatService({ messages, userMessage: message.trim() });
  res.status(StatusCodes.OK).json({ success: true, data: result });
};

export const getSupportFaqsController = async (req, res) => {
  const result = getSupportFaqsService();
  res.status(StatusCodes.OK).json({ success: true, data: result });
};
