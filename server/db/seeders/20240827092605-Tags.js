'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Tags', [
      {
        name: 'Однокомнатная',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Двухкомнатная',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Трехкомнатная',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'С мебелью',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Без мебели',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Новостройка',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Рядом с метро',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Семейная квартира',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Для студентов',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Для некурящих',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Питомцы разрешены',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
