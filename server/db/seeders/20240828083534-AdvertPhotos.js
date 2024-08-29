'use strict';
const fs = require('fs');
const path = require('path');

const photos = [];

for (let i = 1; i < 16; i++) {
  const dirPath = path.resolve(__dirname, `../../public/images/adverts/advert-${i}`);
  
  if (fs.existsSync(dirPath)) {
    const dir = fs.readdirSync(dirPath);

    for (let j = 0; j < dir.length; j++) {
      photos.push({
        photo: `/images/adverts/advert-${i}/${dir[j]}`,
        advertId: i,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } else {
    console.error(`Directory ${dirPath} does not exist`);
  }
}


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AdvertPhotos', photos, {});

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
