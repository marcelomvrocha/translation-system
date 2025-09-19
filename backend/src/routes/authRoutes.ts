import { Router } from 'express';
// import { AuthController } from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimiter';
import { 
  registerSchema, 
  loginSchema, 
  validate 
} from '@/utils/validation';

// Temporary simple controller for testing
const AuthController = {
  register: (req: any, res: any) => {
    res.json({ message: 'Register endpoint working', success: true });
  },
  login: (req: any, res: any) => {
    res.json({ message: 'Login endpoint working', success: true });
  },
  refreshToken: (req: any, res: any) => {
    res.json({ message: 'Refresh token endpoint working', success: true });
  },
  getCurrentUser: (req: any, res: any) => {
    res.json({ message: 'Get current user endpoint working', success: true });
  },
  updateProfile: (req: any, res: any) => {
    res.json({ message: 'Update profile endpoint working', success: true });
  },
  changePassword: (req: any, res: any) => {
    res.json({ message: 'Change password endpoint working', success: true });
  },
  deleteAccount: (req: any, res: any) => {
    res.json({ message: 'Delete account endpoint working', success: true });
  },
  logout: (req: any, res: any) => {
    res.json({ message: 'Logout endpoint working', success: true });
  }
};

const router = Router();

// Public routes
router.post('/register', AuthController.register);

router.post('/login', AuthController.login);

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
