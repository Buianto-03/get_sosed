'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'AdvertPhotos',
      [
        {
          advertId: 1,
          photo: '/images/advert-18/advert18-0.webp',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          advertId: 1,
          photo: '/images/advert-18/advert18-1.webp',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          advertId: 1,
          photo: '/images/advert-18/advert18-2.webp',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );

    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
