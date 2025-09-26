import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimiter';
import { 
  registerSchema, 
  loginSchema, 
  validate 
} from '@/utils/validation';

const router = Router();

// Public routes
router.post('/register', 
  authLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post('/login', 
  authLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post('/refresh-token', 
  authLimiter,
  AuthController.refreshToken
);

// Protected routes
router.get('/me', 
  authenticate,
  AuthController.getCurrentUser
);

router.put('/profile', 
  authenticate,
  AuthController.updateProfile
);

router.put('/change-password', 
  authenticate,
  AuthController.changePassword
);

router.delete('/account', 
  authenticate,
  AuthController.deleteAccount
);

router.post('/logout', 
  authenticate,
  AuthController.logout
);

export default router;
