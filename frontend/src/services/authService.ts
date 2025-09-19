import apiService from './api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  ApiResponse 
} from '@/types';

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiService.post('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store tokens
      apiService.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response.data!;
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: ApiResponse<AuthResponse> = await apiService.post('/auth/register', userData);
    
    if (response.success && response.data) {
      // Store tokens
      apiService.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response.data!;
  }

  static async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      // Clear tokens regardless of API call success
      apiService.clearAuthTokens();
    }
  }

  static async getCurrentUser(): Promise<User> {
    const response: ApiResponse<User> = await apiService.get('/auth/me');
    return response.data!;
  }

  static async updateProfile(data: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User> {
    const response: ApiResponse<User> = await apiService.put('/auth/profile', data);
    return response.data!;
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  static async deleteAccount(password: string): Promise<void> {
    await apiService.delete('/auth/account', {
      data: { password }
    });
    
    // Clear tokens after account deletion
    apiService.clearAuthTokens();
  }

  static async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: ApiResponse<{ accessToken: string }> = await apiService.post('/auth/refresh-token', {
      refreshToken,
    });

    if (response.success && response.data) {
      // Update access token
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data!;
  }

  static isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }

  static getAccessToken(): string | null {
    return apiService.getAccessToken();
  }
}
