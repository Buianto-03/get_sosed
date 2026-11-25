import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import {
  listingPageSchema,
  listingSchema,
  collectionListingSchema,
  filteredListingPageSchema,
  tagSchema,
} from '../model/listingModel';
import type { ListingPage, Listing, ListingFilters, TagType } from '../model/listingModel';
import { likedListingSchema, type LikedListing } from '../model/likedListingsModel';

class ListingService {
  constructor(private client: AxiosInstance) {}

  async getMine(
    page: number = 1,
    limit: number = 12,
    options?: ReadOptions,
  ): Promise<ListingPage> {
    const response = await this.client.get('/adverts/mine', {
      ...options,
      params: { page, limit },
    });
    return listingPageSchema.parse(response.data);
  }

  async getLikedListings(options?: ReadOptions): Promise<LikedListing[]> {
    const response = await this.client.get('/adverts/liked', options);
    return likedListingSchema.array().parse(response.data);
  }

  async getListings(options?: ReadOptions): Promise<Listing[]> {
    const response = await this.client.get('/adverts', options);
    return listingSchema.array().parse(response.data);
  }

  async createListing(listing: FormData): Promise<Listing> {
    try {
      const response = await this.client.post('/adverts', listing, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return listingSchema.parse(response.data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getFilteredListings(
    filters: ListingFilters & { tags: TagType[] },
    options?: ReadOptions,
  ): Promise<Listing[]> {
    const response = await this.client.post('/adverts/filters', filters, options);
    return listingSchema.array().parse(response.data);
  }

  async getFilteredListingsPage(
    filters: ListingFilters & { tags: TagType[] },
    page: number = 1,
    limit: number = 8,
    options?: ReadOptions,
  ): Promise<ListingPage> {
    const response = await this.client.post('/adverts/filters/page', filters, {
      ...options,
      params: { page, limit },
    });
    return filteredListingPageSchema.parse(response.data);
  }

  async getFreshListings(limit: number = 3, options?: ReadOptions): Promise<Listing[]> {
    const response = await this.client.get('/adverts/fresh', {
      ...options,
      params: { limit },
    });
    return collectionListingSchema.array().max(3).parse(response.data);
  }

  async getListingById(id: Listing['id'], options?: ReadOptions): Promise<Listing> {
    const response = await this.client.get(`/adverts/${id}`, options);
    return listingSchema.parse(response.data);
  }

  async getTagsBySearch(query: string, options?: ReadOptions): Promise<TagType[]> {
    const response = await this.client.get('/adverts/tags', { ...options, params: { query } });
    return tagSchema.array().parse(response.data);
  }

  async getTopListings(options?: ReadOptions): Promise<Listing[]> {
    const response = await this.client.get('/adverts/top', options);
    return listingSchema.array().parse(response.data);
  }
}

export const listingService = new ListingService(axiosInstance);
