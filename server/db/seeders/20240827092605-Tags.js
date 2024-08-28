'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Tags', [
      {
        name: '1 Этаж',
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      {
        name: 'Квартира',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Дом Буяна',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Хата Димы',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Печенюга Роба',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
