'use strict';
const fs = require('fs');
const path = require('path');

const photos = [];

for (let i = 1; i < 6; i++) {
  const dirPath = path.resolve(__dirname, `../../public/images/users/user-${i}`);
  
  if (fs.existsSync(dirPath)) {
    const dir = fs.readdirSync(dirPath);

    for (let j = 0; j < dir.length; j++) {
      photos.push({
        photo: `/images/users/user-${i}/${dir[j]}`,
        userId: i,
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
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('UserPhotos', photos, {});

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

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
