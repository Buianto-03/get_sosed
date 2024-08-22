'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      'Adverts',
      [
        {
          title: 'Уютная квартира в центре',
          body: 'Современная квартира с одной спальней и балконом.',
          userId: 1,
          price: 50000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Студия на окраине',
          body: 'Компактная студия в тихом районе.',
          userId: 2,
          price: 30000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Квартира с видом на море',
          body: 'Трехкомнатная квартира с панорамным видом на море.',
          userId: 1,
          price: 75000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Апартаменты в элитном комплексе',
          body: 'Просторные апартаменты с двумя спальнями и бассейном.',
          userId: 2,
          price: 120000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Квартира рядом с метро',
          body: 'Двухкомнатная квартира в пяти минутах от станции метро.',
          userId: 1,
          price: 55000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Лофт в центре города',
          body: 'Стильный лофт с высокими потолками и большими окнами.',
          userId: 2,
          price: 80000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Тихая квартира в парковой зоне',
          body: 'Однокомнатная квартира рядом с парком.',
          userId: 1,
          price: 45000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Современная студия в новом доме',
          body: 'Студия с дизайнерским ремонтом и новой мебелью.',
          userId: 2,
          price: 60000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Квартира с большой кухней',
          body: 'Двухкомнатная квартира с просторной кухней и лоджией.',
          userId: 1,
          price: 70000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Апартаменты в историческом центре',
          body: 'Квартира в старинном доме с современным ремонтом.',
          userId: 2,
          price: 95000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Уютная студия для одного человека',
          body: 'Компактная студия в тихом районе, идеальна для одного человека.',
          userId: 1,
          price: 35000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Квартира рядом с университетом',
          body: 'Однокомнатная квартира, удобная для студентов.',
          userId: 2,
          price: 40000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Просторная квартира для семьи',
          body: 'Трехкомнатная квартира с детской площадкой во дворе.',
          userId: 1,
          price: 85000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Элитные апартаменты в центре',
          body: 'Роскошные апартаменты с видом на город.',
          userId: 2,
          price: 150000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Квартира на последнем этаже',
          body: 'Двухуровневая квартира с террасой и видом на город.',
          userId: 1,
          price: 100000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ],
      {},
    );
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
