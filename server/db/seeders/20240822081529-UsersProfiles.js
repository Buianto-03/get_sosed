'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'UserProfiles',
      [
        {
          userId: 1,
          city: 'Москва',
          intent: 'Ищу соседа для совместной аренды',
          habits: JSON.stringify(['Не курю', 'Учусь']),
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
          city: 'Москва',
          intent: 'Ищу комнату',
          habits: JSON.stringify(['Не курю', 'Работаю в офисе']),
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
          city: 'Москва',
          intent: 'Ищу соседа для совместной аренды',
          habits: JSON.stringify(['Работаю из дома', 'Люблю порядок']),
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
          city: 'Москва',
          intent: 'Ищу соседей',
          habits: JSON.stringify(['Без животных', 'Рано встаю']),
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
          city: 'Москва',
          intent: 'Ищу квартиру с соседом',
          habits: JSON.stringify(['Не курю', 'Люблю тишину']),
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
