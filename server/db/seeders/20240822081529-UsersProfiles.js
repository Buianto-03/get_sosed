'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'UserProfiles',
      [
        {
          userId: 1,
          about: 'Я студент, ищу соседа',
          age: 20,
          gender: 'male',
          photo: '/images/users/user-1/0.webp',
          phoneNumber: "123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        {
          userId: 2,
          about: 'Недавно переехал, ищу соседа',
          age: 20,
          gender: 'male',
          photo: '/images/users/user-2/0.webp',
          phoneNumber: "123456789",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 3,
          about: 'Хочу сэкономить, ищу соседа',
          age: 20,
          gender: 'male',
          photo: '/images/users/user-3/0.webp',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 4,
          about: 'Ищу соседей',
          age: 20,
          gender: 'female',
          photo: '/images/users/user-4/0.webp',
          phoneNumber: 123456789,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 5,
          about: 'Ищу квартиру с соседом',
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
