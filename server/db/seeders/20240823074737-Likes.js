'use strict';

const generateRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const likes = [];
const usedCombinations = new Set();

while (likes.length < 15) {
  const userId = generateRandomInt(1, 5);
  const advertId = generateRandomInt(1, 15);
  const combination = `${userId}-${advertId}`;

  if (!usedCombinations.has(combination)) {
    usedCombinations.add(combination);
    likes.push({
      userId,
      advertId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Likes', likes, {});
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
