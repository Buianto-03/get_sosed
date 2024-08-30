import type { AxiosInstance } from 'axios';
import axiosInstance from './client';
import type { BackendUserT } from '../types/auth';
import { userSchema } from '../types/auth';

class UserProfileService {
  constructor(private client: AxiosInstance) {}

  async editUserProfile(formData: FormData): Promise<BackendUserT> {
    try {
      const id = formData.get('id') as string;
      const res = await this.client.patch<BackendUserT>(`users/${id}`, formData);

      console.log(res);
      if (res.status !== 200) {
        throw new Error('Failed to edit profile');
      }
      return userSchema.parse(res.data);
    } catch (error) {
      console.log('unexpected error', error);
      return Promise.reject(new Error('Failed editing profile'));
    }
  }
}

const userProfileService = new UserProfileService(axiosInstance);

export default userProfileService;
