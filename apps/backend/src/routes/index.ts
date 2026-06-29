import express from 'express';
import authRouter from './auth.routes';
import profileRouter from './profile.route';

const router = express.Router();

router.use('/auth',authRouter);
router.use('/user',profileRouter);

export default router;