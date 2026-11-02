import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import { deleteLikeSchema, likeSchema, type DeleteLikeResult, type LikeType } from '../model/like';

class LikeService {
  constructor(private client: AxiosInstance) {}

  async getLikesByAdvertId(id: LikeType['advertId']): Promise<LikeType[]> {
    try {
      const response = await this.client.get(`/likes/${id}`);
      return likeSchema.array().parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async setLike(advertId: LikeType['advertId']): Promise<LikeType> {
    try {
      const response = await this.client.post(`/likes/${advertId}`);
      return likeSchema.parse(response.data);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async deleteLike(advertId: LikeType['advertId']): Promise<DeleteLikeResult> {
    try {
      const response = await this.client.delete(`/likes/${advertId}`);
      return deleteLikeSchema.parse(response.data);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const likeService = new LikeService(axiosInstance);

export default likeService;
