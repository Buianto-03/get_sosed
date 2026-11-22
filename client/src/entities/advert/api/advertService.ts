import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import { advertPageSchema, advertSchema, tagSchema } from '../model/advertsModel';
import type { AdvertPageType, AdvertType, FilterType, TagType } from '../model/advertsModel';
import { likedAdvertSchema, type LikedAdvert } from '../model/likedAdvertsModel';

class AdvertService {
  constructor(private client: AxiosInstance) {}

  async getMine(
    page: number = 1,
    limit: number = 12,
    options?: ReadOptions,
  ): Promise<AdvertPageType> {
    const response = await this.client.get('/adverts/mine', {
      ...options,
      params: { page, limit },
    });
    return advertPageSchema.parse(response.data);
  }

  async getLikedAdverts(options?: ReadOptions): Promise<LikedAdvert[]> {
    const response = await this.client.get('/adverts/liked', options);
    return likedAdvertSchema.array().parse(response.data);
  }

  async getAdverts(options?: ReadOptions): Promise<AdvertType[]> {
    const response = await this.client.get('/adverts', options);
    return advertSchema.array().parse(response.data);
  }

  async createAdvert(advert: FormData): Promise<AdvertType> {
    try {
      const response = await this.client.post('/adverts', advert, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return advertSchema.parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getFilteredAdverts(
    filters: FilterType & { tags: TagType[] },
    options?: ReadOptions,
  ): Promise<AdvertType[]> {
    const response = await this.client.post('/adverts/filters', filters, options);
    return advertSchema.array().parse(response.data);
  }

  async getAdvertById(id: AdvertType['id'], options?: ReadOptions): Promise<AdvertType> {
    const response = await this.client.get(`/adverts/${id}`, options);
    return advertSchema.parse(response.data);
  }

  async getTagsBySearch(query: string, options?: ReadOptions): Promise<TagType[]> {
    const response = await this.client.get('/adverts/tags', { ...options, params: { query } });
    return tagSchema.array().parse(response.data);
  }

  async getTopAdverts(options?: ReadOptions): Promise<AdvertType[]> {
    const response = await this.client.get('/adverts/top', options);
    return advertSchema.array().parse(response.data);
  }
}

const advertService = new AdvertService(axiosInstance);

export default advertService;
