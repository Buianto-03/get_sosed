'use strict';
const { hashSync } = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Тонких Дмитрий',
        email: 'dmitriy@gmail.com',
        hashpass: hashSync('qwerty1234', 10), 
        roleId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Самигуллин Роберт',
        email: 'robert@gmail.com',
        hashpass: hashSync('qwerty1234', 10), 
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Шагдуров Буянто',
        email: 'buyanto@gmail.com',
        hashpass: hashSync('qwerty1234', 10), 
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Иванова Ивона',
        email: 'ivona@gmail.com',
        hashpass: hashSync('qwerty1234', 10), 
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Попова Анна',
        email: 'anna@gmail.com',
        hashpass: hashSync('qwerty1234', 10), 
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
