import type { AxiosInstance } from 'axios';
import { advertSchema } from '../types/advert';
import type { AdvertType, FilterType, PostAdvertType } from '../types/advert';
import axiosInstance from './client';

class AdvertService {
  constructor(private client: AxiosInstance) {}

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

  async getFilteredAdverts(filters: FilterType): Promise<AdvertType[]> {
    try {
      // const response = await this.client.post('/adverts/filters',filters )
      const response = await this.client.get('/adverts/filters', { params: filters });
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

  async getTagsBySearch(query: string): Promise<string[]> {
    try {
      const response = await this.client.get('/adverts/tags', {
        params: { query },
      });
      return response.data as string[];
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }
}

const advertService = new AdvertService(axiosInstance);

export default advertService;
