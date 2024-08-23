'use strict';
const { hashSync } = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Admin',
        email: 'admin@1.com',
        hashpass:
          '$2a$10$fk8TN.J39nJVeqCi9TvLAOFw.AnHLg7aBA8aoZg5AvAaQ//kinbwG',
        roleId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Sosed1',
        email: 'sosed@1.com',
        hashpass:
          '$2a$10$lB7UxnUAIPxd0wCxJM4Hs.be.gha36fFFvKQs3Bu/.V4dkhpkB/re',
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Sosed2',
        email: 'sosed@2.com',
        hashpass: hashSync('123', 10),
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Sosed3',
        email: 'sosed@3.com',
        hashpass: hashSync('123', 10),
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Sosed4',
        email: 'sosed@4.com',
        hashpass: hashSync('123', 10),
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
