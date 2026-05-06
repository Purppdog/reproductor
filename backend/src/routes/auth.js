import { Router } from 'express';
import { register, login, verifyEmail, getProfile, deleteAccount } from '../controllers/auth.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.get('/profile', verifyToken, getProfile);
router.delete('/account', verifyToken, deleteAccount);

export default router;