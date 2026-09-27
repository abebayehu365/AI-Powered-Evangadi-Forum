import { StatusCodes } from 'http-status-codes';
import {
  createQuestionWithVectorService,
  getQuestionService,
  getSingleQuestionService,
  searchQuestionsSemanticService,
  getSimilarQuestionsService,
} from '../service/question.service.js';
import {
  generateQuestionDraftCoachService,
  assessAnswerAgainstQuestionService,
} from '../service/geminiTextCoach.service.js';

export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const result = await createQuestionWithVectorService({
      userId: req.user.id,
      title,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Question posted successfully.',
      data: result.question,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionController = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      mine: req.query.mine,
      userId: req.user.id,
    };
    const result = await getQuestionService(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Questions fetched successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const result = await getSingleQuestionService({ questionHash });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Question fetched successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const result = await searchQuestionsSemanticService({
      query: req.query.query,
      k: req.query.k ? Number(req.query.k) : 5,
      threshold:
        req.query.threshold !== undefined ? Number(req.query.threshold) : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Semantic search completed successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const result = await getSimilarQuestionsService({
      questionHash,
      k: req.query.k ? Number(req.query.k) : 5,
      threshold:
        req.query.threshold !== undefined ? Number(req.query.threshold) : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Similar questions fetched successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await generateQuestionDraftCoachService({
      title,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Draft suggestions generated',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;

    const { question } = await getSingleQuestionService({
      questionHash,
      includeAnswers: false,
    });

    const data = await assessAnswerAgainstQuestionService({
      questionTitle: question.title,
      questionContent: question.content,
      answerText,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer fit assessed',
      data,
    });
  } catch (error) {
    next(error);
  }
};
