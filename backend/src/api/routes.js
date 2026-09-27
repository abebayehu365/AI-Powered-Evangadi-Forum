import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from './question/routes/question.routes.js';
import answerRoutes from './answer/routes/answer.routes.js';
import ragRoutes from './rag/routes/rag.routes.js';
import paymentRoutes from './payment/routes/payment.routes.js';
import likeRoutes from './like/routes/like.routes.js';
import ratingRoutes from './rating/routes/rating.routes.js';
import reportRoutes from './report/routes/report.routes.js';
import adminRoutes from './admin/routes/admin.routes.js';

// Addon routes for profile, follow, support bot
import supportRoutes from './support/routes/support.routes.js';
import profileRoutes from './profile/routes/profile.routes.js';
import followRoutes from './follow/routes/follow.routes.js';

export const mainRouter = express.Router();

// Authentication routes (/api/auth)
mainRouter.use('/auth', authRoutes);

// Question routes (/api/questions)
mainRouter.use('/questions', questionRoutes);

// Answer routes (/api/answers)
mainRouter.use('/answers', answerRoutes);

// RAG routes (/api/rag/documents)
mainRouter.use('/rag/documents', ragRoutes);

// Telebirr Payment routes (/api/payment)
mainRouter.use('/payment', paymentRoutes);

// Like & Unlike routes (/api/likes)
mainRouter.use('/likes', likeRoutes);

// Star Ratings routes (/api/ratings)
mainRouter.use('/ratings', ratingRoutes);

// Reports routes (/api/reports)
mainRouter.use('/reports', reportRoutes);

// Admin routes (/api/admin)
mainRouter.use('/admin', adminRoutes);

// Addon compatibility routes (/api/addon/...)
mainRouter.use('/addon/ratings', ratingRoutes);
mainRouter.use('/addon/reports', reportRoutes);
mainRouter.use('/addon/support', supportRoutes);
mainRouter.use('/addon/profiles', profileRoutes);
mainRouter.use('/addon/follows', followRoutes);