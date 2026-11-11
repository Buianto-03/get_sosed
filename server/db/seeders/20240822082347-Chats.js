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
      {
        senderId: 6,
        receiverId: 7,
        message: 'Здравствуйте! Объявление об аренде ещё актуально?',
      },
      {
        senderId: 7,
        receiverId: 6,
        message: 'Здравствуйте! Да, квартира пока свободна.',
      },
      {
        senderId: 6,
        receiverId: 7,
        message: 'Можно договориться о просмотре на выходных?',
      },
      {
        senderId: 7,
        receiverId: 6,
        message: 'Да, в субботу после обеда будет удобно.',
      },
      {
        senderId: 6,
        receiverId: 7,
        message: 'Отлично, тогда напишу ближе к субботе.',
      },
      {
        senderId: 8,
        receiverId: 9,
        message: 'Привет! Ты ещё ищешь соседа для совместной аренды?',
      },
      {
        senderId: 9,
        receiverId: 8,
        message: 'Привет! Да, поиск пока продолжается.',
      },
      {
        senderId: 8,
        receiverId: 9,
        message: 'Расскажи, пожалуйста, какой район рассматриваешь?',
      },
      {
        senderId: 9,
        receiverId: 8,
        message: 'Хотелось бы поближе к метро и зелёной зоне.',
      },
      {
        senderId: 8,
        receiverId: 9,
        message: 'Мне тоже подходит такой вариант, давай обсудим.',
      },
      {
        senderId: 10,
        receiverId: 11,
        message: 'Добрый день! Подскажите, какая стоимость аренды?',
      },
      {
        senderId: 11,
        receiverId: 10,
        message: 'Добрый день! Стоимость указана в объявлении за месяц.',
      },
      {
        senderId: 10,
        receiverId: 11,
        message: 'Коммунальные платежи входят в эту сумму?',
      },
      {
        senderId: 11,
        receiverId: 10,
        message: 'Нет, коммунальные услуги оплачиваются отдельно.',
      },
      {
        senderId: 10,
        receiverId: 11,
        message: 'Спасибо за ответ! Можно будет посмотреть квартиру?',
      },
      {
        senderId: 12,
        receiverId: 13,
        message: 'Здравствуйте! Можно уточнить условия проживания?',
      },
      {
        senderId: 13,
        receiverId: 12,
        message: 'Здравствуйте! Конечно, что вас интересует?',
      },
      {
        senderId: 12,
        receiverId: 13,
        message: 'Подойдёт ли сосед, который работает из дома?',
      },
      {
        senderId: 13,
        receiverId: 12,
        message: 'Да, главное, чтобы всем было комфортно.',
      },
      {
        senderId: 12,
        receiverId: 13,
        message: 'Спасибо, предлагаю встретиться и всё обсудить.',
      },
      {
        senderId: 14,
        receiverId: 15,
        message: 'Привет! Мне понравилась квартира из объявления.',
      },
      {
        senderId: 15,
        receiverId: 14,
        message: 'Привет! Здорово, она ещё доступна.',
      },
      {
        senderId: 14,
        receiverId: 15,
        message: 'Рядом есть магазины и общественный транспорт?',
      },
      {
        senderId: 15,
        receiverId: 14,
        message: 'Да, остановка и магазины находятся недалеко.',
      },
      {
        senderId: 14,
        receiverId: 15,
        message: 'Отлично, когда можно прийти на просмотр?',
      },
      {
        senderId: 16,
        receiverId: 17,
        message: 'Здравствуйте! Объявление об аренде ещё актуально?',
      },
      {
        senderId: 17,
        receiverId: 16,
        message: 'Здравствуйте! Да, квартира пока свободна.',
      },
      {
        senderId: 16,
        receiverId: 17,
        message: 'Можно договориться о просмотре на выходных?',
      },
      {
        senderId: 17,
        receiverId: 16,
        message: 'Да, в субботу после обеда будет удобно.',
      },
      {
        senderId: 16,
        receiverId: 17,
        message: 'Отлично, тогда напишу ближе к субботе.',
      },
      {
        senderId: 18,
        receiverId: 19,
        message: 'Привет! Ты ещё ищешь соседа для совместной аренды?',
      },
      {
        senderId: 19,
        receiverId: 18,
        message: 'Привет! Да, поиск пока продолжается.',
      },
      {
        senderId: 18,
        receiverId: 19,
        message: 'Расскажи, пожалуйста, какой район рассматриваешь?',
      },
      {
        senderId: 19,
        receiverId: 18,
        message: 'Хотелось бы поближе к метро и зелёной зоне.',
      },
      {
        senderId: 18,
        receiverId: 19,
        message: 'Мне тоже подходит такой вариант, давай обсудим.',
      },
      {
        senderId: 20,
        receiverId: 21,
        message: 'Добрый день! Подскажите, какая стоимость аренды?',
      },
      {
        senderId: 21,
        receiverId: 20,
        message: 'Добрый день! Стоимость указана в объявлении за месяц.',
      },
      {
        senderId: 20,
        receiverId: 21,
        message: 'Коммунальные платежи входят в эту сумму?',
      },
      {
        senderId: 21,
        receiverId: 20,
        message: 'Нет, коммунальные услуги оплачиваются отдельно.',
      },
      {
        senderId: 20,
        receiverId: 21,
        message: 'Спасибо за ответ! Можно будет посмотреть квартиру?',
      },
      {
        senderId: 22,
        receiverId: 23,
        message: 'Здравствуйте! Можно уточнить условия проживания?',
      },
      {
        senderId: 23,
        receiverId: 22,
        message: 'Здравствуйте! Конечно, что вас интересует?',
      },
      {
        senderId: 22,
        receiverId: 23,
        message: 'Подойдёт ли сосед, который работает из дома?',
      },
      {
        senderId: 23,
        receiverId: 22,
        message: 'Да, главное, чтобы всем было комфортно.',
      },
      {
        senderId: 22,
        receiverId: 23,
        message: 'Спасибо, предлагаю встретиться и всё обсудить.',
      },
      {
        senderId: 24,
        receiverId: 25,
        message: 'Привет! Мне понравилась квартира из объявления.',
      },
      {
        senderId: 25,
        receiverId: 24,
        message: 'Привет! Здорово, она ещё доступна.',
      },
      {
        senderId: 24,
        receiverId: 25,
        message: 'Рядом есть магазины и общественный транспорт?',
      },
      {
        senderId: 25,
        receiverId: 24,
        message: 'Да, остановка и магазины находятся недалеко.',
      },
      {
        senderId: 24,
        receiverId: 25,
        message: 'Отлично, когда можно прийти на просмотр?',
      },
      {
        senderId: 2,
        receiverId: 6,
        message: 'Здравствуйте! Объявление об аренде ещё актуально?',
      },
      {
        senderId: 6,
        receiverId: 2,
        message: 'Здравствуйте! Да, квартира пока свободна.',
      },
      {
        senderId: 2,
        receiverId: 6,
        message: 'Можно договориться о просмотре на выходных?',
      },
      {
        senderId: 6,
        receiverId: 2,
        message: 'Да, в субботу после обеда будет удобно.',
      },
      {
        senderId: 2,
        receiverId: 6,
        message: 'Отлично, тогда напишу ближе к субботе.',
      },
      {
        senderId: 3,
        receiverId: 8,
        message: 'Привет! Ты ещё ищешь соседа для совместной аренды?',
      },
      {
        senderId: 8,
        receiverId: 3,
        message: 'Привет! Да, поиск пока продолжается.',
      },
      {
        senderId: 3,
        receiverId: 8,
        message: 'Расскажи, пожалуйста, какой район рассматриваешь?',
      },
      {
        senderId: 8,
        receiverId: 3,
        message: 'Хотелось бы поближе к метро и зелёной зоне.',
      },
      {
        senderId: 3,
        receiverId: 8,
        message: 'Мне тоже подходит такой вариант, давай обсудим.',
      },
      {
        senderId: 4,
        receiverId: 10,
        message: 'Добрый день! Подскажите, какая стоимость аренды?',
      },
      {
        senderId: 10,
        receiverId: 4,
        message: 'Добрый день! Стоимость указана в объявлении за месяц.',
      },
      {
        senderId: 4,
        receiverId: 10,
        message: 'Коммунальные платежи входят в эту сумму?',
      },
      {
        senderId: 10,
        receiverId: 4,
        message: 'Нет, коммунальные услуги оплачиваются отдельно.',
      },
      {
        senderId: 4,
        receiverId: 10,
        message: 'Спасибо за ответ! Можно будет посмотреть квартиру?',
      },
      {
        senderId: 5,
        receiverId: 12,
        message: 'Здравствуйте! Можно уточнить условия проживания?',
      },
      {
        senderId: 12,
        receiverId: 5,
        message: 'Здравствуйте! Конечно, что вас интересует?',
      },
      {
        senderId: 5,
        receiverId: 12,
        message: 'Подойдёт ли сосед, который работает из дома?',
      },
      {
        senderId: 12,
        receiverId: 5,
        message: 'Да, главное, чтобы всем было комфортно.',
      },
      {
        senderId: 5,
        receiverId: 12,
        message: 'Спасибо, предлагаю встретиться и всё обсудить.',
      },
      {
        senderId: 7,
        receiverId: 14,
        message: 'Привет! Мне понравилась квартира из объявления.',
      },
      {
        senderId: 14,
        receiverId: 7,
        message: 'Привет! Здорово, она ещё доступна.',
      },
      {
        senderId: 7,
        receiverId: 14,
        message: 'Рядом есть магазины и общественный транспорт?',
      },
      {
        senderId: 14,
        receiverId: 7,
        message: 'Да, остановка и магазины находятся недалеко.',
      },
      {
        senderId: 7,
        receiverId: 14,
        message: 'Отлично, когда можно прийти на просмотр?',
      },
      {
        senderId: 9,
        receiverId: 16,
        message: 'Здравствуйте! Объявление об аренде ещё актуально?',
      },
      {
        senderId: 16,
        receiverId: 9,
        message: 'Здравствуйте! Да, квартира пока свободна.',
      },
      {
        senderId: 9,
        receiverId: 16,
        message: 'Можно договориться о просмотре на выходных?',
      },
      {
        senderId: 16,
        receiverId: 9,
        message: 'Да, в субботу после обеда будет удобно.',
      },
      {
        senderId: 9,
        receiverId: 16,
        message: 'Отлично, тогда напишу ближе к субботе.',
      },
      {
        senderId: 11,
        receiverId: 18,
        message: 'Привет! Ты ещё ищешь соседа для совместной аренды?',
      },
      {
        senderId: 18,
        receiverId: 11,
        message: 'Привет! Да, поиск пока продолжается.',
      },
      {
        senderId: 11,
        receiverId: 18,
        message: 'Расскажи, пожалуйста, какой район рассматриваешь?',
      },
      {
        senderId: 18,
        receiverId: 11,
        message: 'Хотелось бы поближе к метро и зелёной зоне.',
      },
      {
        senderId: 11,
        receiverId: 18,
        message: 'Мне тоже подходит такой вариант, давай обсудим.',
      },
      {
        senderId: 13,
        receiverId: 20,
        message: 'Добрый день! Подскажите, какая стоимость аренды?',
      },
      {
        senderId: 20,
        receiverId: 13,
        message: 'Добрый день! Стоимость указана в объявлении за месяц.',
      },
      {
        senderId: 13,
        receiverId: 20,
        message: 'Коммунальные платежи входят в эту сумму?',
      },
      {
        senderId: 20,
        receiverId: 13,
        message: 'Нет, коммунальные услуги оплачиваются отдельно.',
      },
      {
        senderId: 13,
        receiverId: 20,
        message: 'Спасибо за ответ! Можно будет посмотреть квартиру?',
      },
      {
        senderId: 15,
        receiverId: 22,
        message: 'Здравствуйте! Можно уточнить условия проживания?',
      },
      {
        senderId: 22,
        receiverId: 15,
        message: 'Здравствуйте! Конечно, что вас интересует?',
      },
      {
        senderId: 15,
        receiverId: 22,
        message: 'Подойдёт ли сосед, который работает из дома?',
      },
      {
        senderId: 22,
        receiverId: 15,
        message: 'Да, главное, чтобы всем было комфортно.',
      },
      {
        senderId: 15,
        receiverId: 22,
        message: 'Спасибо, предлагаю встретиться и всё обсудить.',
      },
      {
        senderId: 17,
        receiverId: 24,
        message: 'Привет! Мне понравилась квартира из объявления.',
      },
      {
        senderId: 24,
        receiverId: 17,
        message: 'Привет! Здорово, она ещё доступна.',
      },
      {
        senderId: 17,
        receiverId: 24,
        message: 'Рядом есть магазины и общественный транспорт?',
      },
      {
        senderId: 24,
        receiverId: 17,
        message: 'Да, остановка и магазины находятся недалеко.',
      },
      {
        senderId: 17,
        receiverId: 24,
        message: 'Отлично, когда можно прийти на просмотр?',
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
