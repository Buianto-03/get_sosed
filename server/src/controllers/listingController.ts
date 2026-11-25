import type { Request, Response } from 'express';
import type { AuthResponse } from '../types/auth';
import errorDetails = require('../utils/errorDetails');

import listingServiceInstance = require('../service/listingService');
import publishListingServiceInstance = require('../service/publishListingService');

class ListingController {
  constructor(
    private readonly listingService: typeof listingServiceInstance,
    private readonly publishListingService: typeof publishListingServiceInstance,
  ) {}

  getListings = async (req: Request, res: Response) => {
    try {
      const listings = await this.listingService.getListings();
      res.status(200).json(listings);
    } catch (error) {
      console.error('Cannot read listings:', errorDetails(error).message);
      res.status(500).json({ message: 'server error' });
    }
  };

  getListingById = async (req: Request, res: Response) => {
    try {
      const listingId = Number(req.params.listingId);
      if (!Number.isSafeInteger(listingId) || listingId <= 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      const listing = await this.listingService.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      return res.status(200).json(listing);
    } catch (error) {
      return res.status(500).json({ message: 'server error' });
    }
  };

  getMine = async (req: Request, res: AuthResponse) => {
    try {
      return res.json(
        await this.listingService.getMine(res.locals.user.id, req.query),
      );
    } catch (error) {
      const details = errorDetails(error);
      if (details.status === 400 && details.code === 'INVALID_PAGINATION') {
        return res
          .status(400)
          .json({ code: details.code, message: details.message });
      }
      console.error('Cannot load own listings:', error);
      return res.status(500).json({
        code: 'OWN_LISTINGS_LOAD_FAILED',
        message: 'Cannot load own listings',
      });
    }
  };

  createListing = async (req: Request, res: AuthResponse) => {
    try {
      const files = Array.isArray(req.files) ? req.files : undefined;
      return res
        .status(201)
        .json(
          await this.publishListingService.publishListing(
            req.body,
            files,
            res.locals.user.id,
          ),
        );
    } catch (error) {
      const details = errorDetails(error);
      const isExpectedError =
        details.status === 400 && details.code === 'INVALID_LISTING_DATA';
      const status =
        isExpectedError ||
        (details.status !== undefined &&
          details.status >= 500 &&
          details.status < 600)
          ? (details.status ?? 500)
          : 500;
      if (!isExpectedError) {
        console.error('Cannot publish listing:', error);
      }
      return res.status(status).json({
        code: isExpectedError ? details.code : 'LISTING_PUBLISH_FAILED',
        message: isExpectedError ? details.message : 'Cannot publish listing',
      });
    }
  };

  getFilteredListings = async (req: Request, res: Response) => {
    try {
      const filters = req.body;
      const filteredListings =
        await this.listingService.getFilteredListings(filters);
      res.json(filteredListings);
    } catch (error) {
      console.log('Ошибка при фильтрации объявлений:', error);
      res
        .status(500)
        .json({ error: 'Ошибка на сервере при фильтрации объявлений' });
    }
  };

  getFilteredListingsPage = async (req: Request, res: Response) => {
    try {
      const page = await this.listingService.getFilteredListingsPage(
        req.body || {},
        req.query,
      );
      return res.status(200).json(page);
    } catch (error) {
      const details = errorDetails(error);
      if (details.status === 400 && details.code === 'INVALID_PAGINATION') {
        return res
          .status(400)
          .json({ code: details.code, message: details.message });
      }
      console.error('Cannot load filtered listings:', error);
      return res.status(500).json({
        code: 'FILTERED_LISTINGS_LOAD_FAILED',
        message: 'Cannot load filtered listings',
      });
    }
  };

  getFreshListings = async (req: Request, res: Response) => {
    try {
      const listings = await this.listingService.getFreshListings(req.query);
      return res.status(200).json(listings);
    } catch (error) {
      const details = errorDetails(error);
      if (details.status === 400 && details.code === 'INVALID_PAGINATION') {
        return res
          .status(400)
          .json({ code: details.code, message: details.message });
      }
      console.error('Cannot load fresh listings:', error);
      return res.status(500).json({
        code: 'FRESH_LISTINGS_LOAD_FAILED',
        message: 'Cannot load fresh listings',
      });
    }
  };

  getTagsBySearch = async (req: Request, res: Response) => {
    const query = req.query.query ?? '';
    if (typeof query !== 'string') {
      return res.status(400).json({ error: 'query must be a string' });
    }
    try {
      const tags = await this.listingService.getTagsLikeStr(query.trim());
      return res.status(200).json(tags);
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка при поиске тегов' });
    }
  };

  likedListingsHandler = async (req: Request, res: AuthResponse) => {
    const { id } = res.locals.user;

    try {
      const likedListings = await this.listingService.likedListings(id);
      res.status(200).json(likedListings);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: 'Ошибка при получении избранных объявлений' });
    }
  };

  getTopListingsByLikes = async (req: Request, res: Response) => {
    try {
      const topListings = await this.listingService.getTopListingsByLikes();
      res.status(200).json(topListings);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка при получении топ-объявлений' });
    }
  };
}

const listingController = new ListingController(
  listingServiceInstance,
  publishListingServiceInstance,
);

export = listingController;
