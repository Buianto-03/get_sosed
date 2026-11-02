import type { AxiosInstance } from 'axios';
import { ZodError } from 'zod';
import axiosInstance from '@shared/api/client';
import type { AuthSchemaT, LoginForm } from '../model/authModel';
import { authSchema } from '../model/authModel';

class AuthService {
  constructor(private client: AxiosInstance) {}

  async submitLoginForm(formData: LoginForm): Promise<AuthSchemaT> {
    try {
      const res = await this.client.post('/auth/login', formData);

      return authSchema.parse(res.data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('ZOD ERROR WHILE LOGIN', error.issues);
      }
      return Promise.reject(new Error('Login error'));
    }
  }

  async submitSignUpForm(formData: FormData): Promise<AuthSchemaT> {
    const response = await this.client.post('/auth/signup', formData);
    return authSchema.parse(response.data);
  }

  async checkAuth(): Promise<AuthSchemaT> {
    try {
      const res = await this.client.get('/tokens/refresh');

      return authSchema.parse(res.data);
    } catch (error) {
      return Promise.reject(new Error('Check auth error'));
    }
  }

  async logout(): Promise<void> {
    await this.client.get('/auth/logout');
  }
}

const authService = new AuthService(axiosInstance);

export default authService;
