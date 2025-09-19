import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { handleAsync } from '@/utils/errorHandler';
import { ApiResponse } from '@/types';

export class AuthController {
  static register = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.register(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User registered successfully',
    };

    res.status(201).json(response);
  });

  static login = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    res.status(200).json(response);
  });

  static refreshToken = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    };

    res.status(200).json(response);
  });

  static getCurrentUser = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const user = await AuthService.getCurrentUser(userId);

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    };

    res.status(200).json(response);
  });

  static updateProfile = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { name, avatarUrl } = req.body;

    const user = await AuthService.updateProfile(userId, { name, avatarUrl });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'Profile updated successfully',
    };

    res.status(200).json(response);
  });

  static changePassword = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(userId, currentPassword, newPassword);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    res.status(200).json(response);
  });

  static deleteAccount = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { password } = req.body;

    await AuthService.deleteAccount(userId, password);

    const response: ApiResponse = {
      success: true,
      message: 'Account deleted successfully',
    };

    res.status(200).json(response);
  });

  static logout = (req: Request, res: Response, next: NextFunction) => {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    // For enhanced security, you could implement a token blacklist
    
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  };
}
