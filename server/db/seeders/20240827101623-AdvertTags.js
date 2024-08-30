'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AdvertTags', [
      { advertId: 1, tagId: 1, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 1, tagId: 2, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 2, tagId: 3, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 2, tagId: 4, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 3, tagId: 5, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 3, tagId: 6, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 4, tagId: 7, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 4, tagId: 8, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 5, tagId: 9, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 5, tagId: 10, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 6, tagId: 11, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 6, tagId: 12, createdAt: new Date(), updatedAt: new Date() },
  
      { advertId: 8, tagId: 1, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 9, tagId: 2, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 9, tagId: 3, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 10, tagId: 4, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 10, tagId: 5, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 11, tagId: 6, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 11, tagId: 7, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 12, tagId: 8, createdAt: new Date(), updatedAt: new Date() },
      { advertId: 12, tagId: 9, createdAt: new Date(), updatedAt: new Date() },
    
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
