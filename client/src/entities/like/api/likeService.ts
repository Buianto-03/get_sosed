import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import { deleteLikeSchema, likeSchema, type DeleteLikeResult, type LikeType } from '../model/like';

class LikeService {
  constructor(private client: AxiosInstance) {}

  async getLikesByListingId(id: LikeType['listingId'], options?: ReadOptions): Promise<LikeType[]> {
    const response = await this.client.get(`/likes/${id}`, options);
    return likeSchema.array().parse(response.data);
  }

  async setLike(listingId: LikeType['listingId']): Promise<LikeType> {
    try {
      const response = await this.client.post(`/likes/${listingId}`);
      return likeSchema.parse(response.data);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async deleteLike(listingId: LikeType['listingId']): Promise<DeleteLikeResult> {
    try {
      const response = await this.client.delete(`/likes/${listingId}`);
      return deleteLikeSchema.parse(response.data);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

const likeService = new LikeService(axiosInstance);

export default likeService;
