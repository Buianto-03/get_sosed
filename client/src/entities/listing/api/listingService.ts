import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import { normalizeListingWireData } from '@shared/api/listing-wire';
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
    const response = await this.client.get('/listings/mine', {
      ...options,
      params: { page, limit },
    });
    return listingPageSchema.parse(normalizeListingWireData(response.data));
  }

  async getLikedListings(options?: ReadOptions): Promise<LikedListing[]> {
    const response = await this.client.get('/listings/liked', options);
    return likedListingSchema.array().parse(normalizeListingWireData(response.data));
  }

  async getListings(options?: ReadOptions): Promise<Listing[]> {
    const response = await this.client.get('/listings', options);
    return listingSchema.array().parse(normalizeListingWireData(response.data));
  }

  async createListing(listing: FormData): Promise<Listing> {
    try {
      const response = await this.client.post('/listings', listing, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return listingSchema.parse(normalizeListingWireData(response.data));
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getFilteredListings(
    filters: ListingFilters & { tags: TagType[] },
    options?: ReadOptions,
  ): Promise<Listing[]> {
    const response = await this.client.post('/listings/filters', filters, options);
    return listingSchema.array().parse(normalizeListingWireData(response.data));
  }

  async getFilteredListingsPage(
    filters: ListingFilters & { tags: TagType[] },
    page: number = 1,
    limit: number = 8,
    options?: ReadOptions,
  ): Promise<ListingPage> {
    const response = await this.client.post('/listings/filters/page', filters, {
      ...options,
      params: { page, limit },
    });
    return filteredListingPageSchema.parse(normalizeListingWireData(response.data));
  }

  async getFreshListings(limit: number = 3, options?: ReadOptions): Promise<Listing[]> {
    const response = await this.client.get('/listings/fresh', {
      ...options,
      params: { limit },
    });
    return collectionListingSchema.array().max(3).parse(normalizeListingWireData(response.data));
  }

  async getListingById(id: Listing['id'], options?: ReadOptions): Promise<Listing> {
    const response = await this.client.get(`/listings/${id}`, options);
    return listingSchema.parse(normalizeListingWireData(response.data));
  }

  async getTagsBySearch(query: string, options?: ReadOptions): Promise<TagType[]> {
    const response = await this.client.get('/listings/tags', { ...options, params: { query } });
    return tagSchema.array().parse(response.data);
  }

  async getTopListings(options?: ReadOptions): Promise<Listing[]> {
    const response = await this.client.get('/listings/top', options);
    return listingSchema.array().parse(normalizeListingWireData(response.data));
  }
}

export const listingService = new ListingService(axiosInstance);
