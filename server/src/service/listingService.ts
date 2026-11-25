import Sequelize = require('sequelize');
import type {
  Attributes,
  IncludeOptions,
  WhereAttributeHash,
  WhereOperators,
  WhereOptions,
} from 'sequelize';
import db = require('../../db/models');
import AppError = require('../utils/appError');

const { Op } = Sequelize;
const { Listing, Location, Tags, User, Like, ListingPhoto, ListingTags } = db;

type ListingAttributes = Attributes<InstanceType<typeof db.Listing>>;
type LocationAttributes = Attributes<InstanceType<typeof db.Location>>;

function invalidPagination() {
  return new AppError(
    400,
    'INVALID_PAGINATION',
    'Invalid pagination parameters',
  );
}

interface Filters {
  tags?: { id: unknown }[] | null;
  city?: unknown;
  district?: unknown;
  metro?: unknown;
  priceFrom?: unknown;
  priceTo?: unknown;
  roomsFrom?: unknown;
  roomsTo?: unknown;
}

function parsePageValue(value: unknown) {
  if (
    !['string', 'number'].includes(typeof value) ||
    !/^[1-9]\d*$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value))
  ) {
    throw invalidPagination();
  }
  return Number(value);
}

class ListingService {
  constructor(
    private readonly listing: typeof db.Listing,
    private readonly location: typeof db.Location,
    private readonly tags: typeof db.Tags,
    private readonly user: typeof db.User,
    private readonly like: typeof db.Like,
    private readonly listingPhoto: typeof db.ListingPhoto,
    private readonly listingTag: typeof db.ListingTags,
  ) {}

  getReadIncludes(locationWhere?: WhereOptions<LocationAttributes>): IncludeOptions[] {
    return [
      { model: this.user, as: 'user', attributes: ['id', 'name', 'email'] },
      {
        model: this.location,
        as: 'location',
        ...(locationWhere ? { where: locationWhere } : {}),
      },
      {
        model: this.listingPhoto,
        as: 'photos',
        separate: true,
        order: [['id', 'ASC']],
      },
      {
        model: this.tags,
        as: 'tags',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false,
      },
    ];
  }

  async getMine(
    userId: number,
    { page = 1, limit = 12 }: { page?: unknown; limit?: unknown } = {},
  ) {
    const currentPage = parsePageValue(page);
    const pageSize = parsePageValue(limit);
    const offset = (currentPage - 1) * pageSize;
    if (pageSize > 50 || !Number.isSafeInteger(offset)) {
      throw invalidPagination();
    }
    const { rows, count } = await this.listing.findAndCountAll({
      where: { userId },
      limit: pageSize,
      offset,
      distinct: true,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include: this.getReadIncludes(),
    });
    return { items: rows, total: count, page: currentPage, limit: pageSize };
  }

  async getListings() {
    return this.listing.findAll({
      order: [['id', 'ASC']],
      include: this.getReadIncludes(),
    });
  }

  async getListingById(id: number) {
    return this.listing.findByPk(id, {
      include: this.getReadIncludes(),
    });
  }

  async likedListings(id: number) {
    return this.like.findAll({
      where: { userId: id },
      include: [
        { model: this.listing, as: 'listing', include: this.getReadIncludes() },
      ],
    });
  }

  getSelectedTagIds(tags: Filters['tags']) {
    return [
      ...new Set(
        (tags || [])
          .map(({ id }) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
  }

  getLocationWhere(filters: Filters) {
    const locationClause: WhereAttributeHash<LocationAttributes> = {};
    if (filters.city) {
      locationClause.city = filters.city;
    }
    if (filters.district) {
      locationClause.district = filters.district;
    }
    if (filters.metro) {
      locationClause.metro = filters.metro;
    }
    return locationClause;
  }

  getListingWhere(filters: Filters) {
    const whereClause: WhereAttributeHash<ListingAttributes> = {};
    if (filters.priceFrom || filters.priceTo) {
      const priceRange: WhereOperators<number> = {};
      if (filters.priceFrom !== undefined) {
        priceRange[Op.gte] = Number(filters.priceFrom);
      }
      if (filters.priceTo && filters.priceTo !== 0) {
        priceRange[Op.lte] = Number(filters.priceTo);
      }
      whereClause.price = priceRange;
    }

    if (filters.roomsFrom || filters.roomsTo) {
      const roomsRange: WhereOperators<number> = {};
      if (filters.roomsFrom !== undefined) {
        roomsRange[Op.gte] = Number(filters.roomsFrom);
      }
      if (filters.roomsTo && filters.roomsTo !== 0) {
        roomsRange[Op.lte] = Number(filters.roomsTo);
      }
      whereClause.rooms = roomsRange;
    }
    return whereClause;
  }

  async getListingIdsByTags(tagIds: number[]) {
    const matches = await this.listingTag.findAll({
      attributes: ['listingId'],
      where: { tagId: { [Op.in]: tagIds } },
      group: ['listingId'],
      having: Sequelize.where(
        Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('tagId'))),
        tagIds.length,
      ),
    });
    return matches
      .map(({ listingId }) => listingId)
      .filter((id): id is number => id !== null);
  }

  async getFilteredListings(filters: Filters) {
    const selectedTagIds = this.getSelectedTagIds(filters.tags);
    const locationClause = this.getLocationWhere(filters);
    const whereClause = this.getListingWhere(filters);
    try {
      if (selectedTagIds.length > 0) {
        const listingIds = await this.getListingIdsByTags(selectedTagIds);
        whereClause.id = { [Op.in]: listingIds };
      }

      const listings = await this.listing.findAll({
        where: whereClause,
        include: this.getReadIncludes(
          Object.keys(locationClause).length ? locationClause : undefined,
        ),
      });
      return listings;
    } catch (error) {
      console.error('Ошибка при фильтрации объявлений:', error);
      throw error;
    }
  }

  async getFilteredListingsPage(
    filters: Filters,
    { page = 1, limit = 8 }: { page?: unknown; limit?: unknown } = {},
  ) {
    const currentPage = parsePageValue(page);
    const pageSize = parsePageValue(limit);
    const offset = (currentPage - 1) * pageSize;
    if (pageSize > 50 || !Number.isSafeInteger(offset)) {
      throw invalidPagination();
    }

    const selectedTagIds = this.getSelectedTagIds(filters.tags);
    const locationClause = this.getLocationWhere(filters);
    const whereClause = this.getListingWhere(filters);
    if (selectedTagIds.length > 0) {
      const hasOutOfRangeTagId = selectedTagIds.some((id) => id > 2147483647);
      if (hasOutOfRangeTagId) {
        return { items: [], total: 0, page: currentPage, limit: pageSize };
      } else {
        const tagIds = selectedTagIds.join(', ');
        whereClause.id = {
          [Op.in]: Sequelize.literal(
            `(SELECT "listingId" FROM "ListingTags" WHERE "tagId" IN (${tagIds}) GROUP BY "listingId" HAVING COUNT(DISTINCT "tagId") = ${selectedTagIds.length})`,
          ),
        };
      }
    }

    const include = this.getReadIncludes(
      Object.keys(locationClause).length ? locationClause : undefined,
    );
    if (Object.keys(locationClause).length) {
      const locationInclude = include.find(({ as }) => as === 'location');
      if (locationInclude) {
        locationInclude.duplicating = true;
      }
    }

    const { rows, count } = await this.listing.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset,
      distinct: true,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include,
    });
    return { items: rows, total: count, page: currentPage, limit: pageSize };
  }

  async getFreshListings({ limit = 3 }: { limit?: unknown } = {}) {
    const pageSize = parsePageValue(limit);
    if (pageSize > 3) {
      throw invalidPagination();
    }
    return this.listing.findAll({
      limit: pageSize,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include: this.getReadIncludes(),
    });
  }

  async getTagsLikeStr(str: string) {
    try {
      const tags = await this.tags.findAll({
        attributes: ['id', 'name'],
        where: str ? { name: { [Op.iLike]: `%${str}%` } } : {},
        order: [['id', 'ASC']],
      });
      return tags;
    } catch (error) {
      console.error('Ошибка при поиске тегов:', error);
      throw error;
    }
  }

  async getTopListingsByLikes() {
    try {
      const topListings = await this.listing.findAll({
        attributes: [
          'id',
          'title',
          'body',
          'price',
          'floor',
          'square',
          'rooms',
          'userId',
          'createdAt',
          'updatedAt',
          [
            Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Likes"
            WHERE "Likes"."listingId" = "Listing"."id"
          )`),
            'likeCount',
          ],
        ],
        order: [[Sequelize.literal('"likeCount"'), 'DESC']],
        limit: 4,
        include: this.getReadIncludes(),
      });
      return topListings;
    } catch (error) {
      console.error('Error fetching top listings by likes:', error);
      throw error;
    }
  }
}

const listingService = new ListingService(
  Listing,
  Location,
  Tags,
  User,
  Like,
  ListingPhoto,
  ListingTags,
);

export = listingService;
