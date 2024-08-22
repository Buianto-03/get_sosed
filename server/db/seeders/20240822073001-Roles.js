'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Roles', [{ name: 'Admin' }, { name: 'User' }]);
  },

  async down(queryInterface, Sequelize) {},
};
