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
          photo: '/images/users/user-1/0.webp',
          phoneNumber: "123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        {
          userId: 2,
          about: 'Sose2',
          age: 20,
          gender: 'male',
          photo: '/images/users/user-2/0.webp',
          phoneNumber: "123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 3,
          about: 'Sosed3',
          age: 20,
          gender: 'sobaka',
          photo: '/images/users/user-3/0.webp',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 4,
          about: 'Sosed4',
          age: 20,
          gender: 'sobaka',
          photo: '/images/users/user-4/0.webp',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 5,
          about: 'Sosed5',
          age: 20,
          gender: 'female',
          photo: '/images/users/user-5/0.webp',
          phoneNumber: "123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {},
};
