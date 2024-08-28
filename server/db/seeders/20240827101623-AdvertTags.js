'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AdvertTags', [
      {advertId: 1, tagId: 1, createdAt: new Date(), updatedAt: new Date()},
      {advertId: 1, tagId: 2, createdAt: new Date(), updatedAt: new Date()},
      {advertId: 2, tagId: 3, createdAt: new Date(), updatedAt: new Date()},
      {advertId: 1, tagId: 4, createdAt: new Date(), updatedAt: new Date()},
      {advertId: 2, tagId: 1, createdAt: new Date(), updatedAt: new Date()},
    ]);
  },

  async down (queryInterface, Sequelize) {

  }
};
