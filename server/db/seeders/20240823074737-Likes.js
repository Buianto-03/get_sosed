'use strict';

const generateRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const objects = [];

for (let i = 0; i < 30; i++) {
  objects.push({
    userId: generateRandomInt(1, 5),
    advertId: generateRandomInt(1, 15),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Likes', objects);
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
