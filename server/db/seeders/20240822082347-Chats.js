'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Chats', [
      {
        senderId: 1,
        receiverId: 2,
        message: 'Hello, how are you?',
      },
      {
        senderId: 2,
        receiverId: 1,
        message: 'I am doing great, thanks for asking!',
      },
      {
        senderId: 1,
        receiverId: 2,
        message: 'What are you up to today?',
      },
      {
        senderId: 2,
        receiverId: 1,
        message: 'Not much, just working on some projects.',
      },
      {
        senderId: 1,
        receiverId: 2,
        message: "That's interesting! Do you want to meet up?",
      },
      {
        senderId: 2,
        receiverId: 1,
        message: "Yeah, let's schedule a meeting.",
      },
      {
        senderId: 1,
        receiverId: 2,
        message: 'Sounds good! See you then.',
      },
      {
        senderId: 2,
        receiverId: 1,
        message: 'Bye!',
      },
      {
        senderId: 1,
        receiverId: 2,
        message: 'See you later!',
      },
      {
        senderId: 2,
        receiverId: 1,
        message: 'Bye bye!',
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
