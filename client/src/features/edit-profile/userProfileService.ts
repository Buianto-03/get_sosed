import type { AxiosInstance } from 'axios';
import { userSchema, type BackendUserT } from '@entities/session/model/authModel';
import axiosInstance from '@shared/api/client';

class UserProfileService {
  constructor(private client: AxiosInstance) {}

  async editUserProfile(formData: FormData): Promise<BackendUserT> {
    const id = formData.get('id');
    if (typeof id !== 'string') throw new Error('Missing user ID');
    const response = await this.client.patch(`/users/${id}`, formData);
    return userSchema.parse(response.data);
  }
}

const userProfileService = new UserProfileService(axiosInstance);

export default userProfileService;
