import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import { advertSchema, tagSchema } from '../model/advertsModel';
import type { AdvertType, FilterType, TagType } from '../model/advertsModel';
import { likedAdvertSchema, type LikedAdvert } from '../model/likedAdvertsModel';

class AdvertService {
  constructor(private client: AxiosInstance) {}

  async getMine(): Promise<AdvertType[]> {
    const response = await this.client.get('/adverts/mine');
    return advertSchema.array().parse(response.data);
  }

  async getLikedAdverts(): Promise<LikedAdvert[]> {
    const response = await this.client.get('/adverts/liked');
    return likedAdvertSchema.array().parse(response.data);
  }

  async getAdverts(): Promise<AdvertType[]> {
    try {
      const response = await this.client.get('/adverts');
      return advertSchema.array().parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
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

  async getFilteredAdverts(filters: FilterType & { tags: TagType[] }): Promise<AdvertType[]> {
    try {
      // const response = await this.client.post('/adverts/filters',filters )
      const response = await this.client.post('/adverts/filters', filters);
      return advertSchema.array().parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getAdvertById(id: AdvertType['id']): Promise<AdvertType> {
    try {
      const response = await this.client.get(`/adverts/${id}`);
      return advertSchema.parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getTagsBySearch(query: string): Promise<TagType[]> {
    try {
      const response = await this.client.get('/adverts/tags', {
        params: { query },
      });
      return tagSchema.array().parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getTopAdverts(): Promise<AdvertType[]> {
    try {
      const response = await this.client.get('/adverts/top');
      return advertSchema.array().parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }
}

const advertService = new AdvertService(axiosInstance);

export default advertService;
