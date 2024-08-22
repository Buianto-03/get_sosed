'use strict';

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
        name: 'Sosed',
        email: 'sosed@2.com',
        hashpass:
          '$2a$10$lB7UxnUAIPxd0wCxJM4Hs.be.gha36fFFvKQs3Bu/.V4dkhpkB/re',
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
