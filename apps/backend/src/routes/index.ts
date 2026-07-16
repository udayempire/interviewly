import express from 'express';
import authRouter from './auth.routes';
import profileRouter from './profile.route';
import interviewRouter from './interview.route';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/user', profileRouter);
router.use('/interview', interviewRouter);

export default router;