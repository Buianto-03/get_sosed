'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'UserProfiles',
      [
        {
          userId: 1,
          about: 'Admin',
          age: 20,
          gender: 'male',
          photo: 'photo',
          phoneNumber: 123456789,
        },

        {
          userId: 2,
          about: 'Sosed',
          age: 20,
          gender: 'male',
          photo: 'photo',
          phoneNumber: 123456789,
        },
        {
          userId: 3,
          about: 'Sosedi',
          age: 20,
          gender: 'sobaka',
          photo: 'photo',
          phoneNumber: 123456789,
        }
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {},
};
