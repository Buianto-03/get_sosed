import type { AxiosInstance } from 'axios';
import { ZodError } from 'zod';
import axiosInstance from './client';
import type { AuthSchemaT, LoginForm } from '../types/auth';
import { authSchema } from '../types/auth';

class AuthService {
  constructor(private client: AxiosInstance) {}

  async submitLoginForm(formData: LoginForm): Promise<AuthSchemaT> {
    try {
      const res = await this.client.post('/auth/login', formData);
      console.log(res.data);
      
      return authSchema.parse(res.data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('ZOD ERROR WHILE LOGIN', error.issues);
      }
      return Promise.reject(new Error('Login error'));
    }
  }

  async submitSignUpForm(formData: FormData): Promise<AuthSchemaT> {
    try {
      const response = await this.client.post('/auth/signup', formData);
      return authSchema.parse(response.data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('ZOD EROR WHILE SIGNUP', error.issues);
      }
      return Promise.reject(new Error('Signup error'));
    }
  }

  async checkAuth(): Promise<AuthSchemaT> {
    try {
      const res = await this.client.get('/tokens/refresh');
      console.log('Response data:', res.data); 
      
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
