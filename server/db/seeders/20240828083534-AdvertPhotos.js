'use strict';

const likes = [];

for (let i = 1; i < 16; i++) {
  for (let j = 0; j < 3; j++) {
    likes.push({
      photo: `/images/advert-18/advert18-${j}.webp`,
      advertId: i,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AdvertPhotos', likes, {});

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
