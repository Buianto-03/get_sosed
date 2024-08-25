import type { AxiosInstance } from 'axios';
import type { AdvertType } from '../types/advert';
import { likeSchema, type LikeType } from '../types/like';
import axiosInstance from './client';

class LikeService {
  constructor(private client: AxiosInstance) {}

  async getLikesByAdvertId(id: AdvertType['id']): Promise<LikeType[]> {
    try {
      const response = await this.client.get(`/likes/${id}`);
      return likeSchema.array().parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async setLike(advertId: AdvertType['id']): Promise<void> {
    try {
      await this.client.post(`/likes/${advertId}`);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const likeService = new LikeService(axiosInstance);

export default likeService;
