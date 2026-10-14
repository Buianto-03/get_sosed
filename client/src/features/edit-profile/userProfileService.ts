import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';

class UserProfileService {
  constructor(private client: AxiosInstance) {}

  async editUserProfile(formData: FormData): Promise<void> {
    const id = formData.get('id');
    if (typeof id !== 'string') throw new Error('Missing user ID');
    await this.client.patch(`/users/${id}`, formData);
  }
}

const userProfileService = new UserProfileService(axiosInstance);

export default userProfileService;
