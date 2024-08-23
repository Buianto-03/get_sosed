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
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        {
          userId: 2,
          about: 'Sose2',
          age: 20,
          gender: 'male',
          photo: 'photo',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 3,
          about: 'Sosed3',
          age: 20,
          gender: 'sobaka',
          photo: 'photo',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 4,
          about: 'Sosed4',
          age: 20,
          gender: 'sobaka',
          photo: 'photo',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 5,
          about: 'Sosed5',
          age: 20,
          gender: 'sobaka',
          photo: 'photo',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {},
};
