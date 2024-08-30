'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AdvertTags', [
      // Объявление 1
      {
        advertId: 1,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 1,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 2
      {
        advertId: 2,
        tagId: 3, // Трехкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 2,
        tagId: 6, // Новостройка
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 3
      {
        advertId: 3,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 3,
        tagId: 7, // Рядом с метро
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 4
      {
        advertId: 4,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 4,
        tagId: 6, // Новостройка
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 5
      {
        advertId: 5,
        tagId: 3, // Трехкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 5,
        tagId: 7, // Рядом с метро
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 6
      {
        advertId: 6,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 6,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 7
      {
        advertId: 7,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 7,
        tagId: 7, // Рядом с метро
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 8
      {
        advertId: 8,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 8,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 9
      {
        advertId: 9,
        tagId: 3, // Трехкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 9,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 10
      {
        advertId: 10,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 10,
        tagId: 7, // Рядом с метро
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 11
      {
        advertId: 11,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 11,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 12
      {
        advertId: 12,
        tagId: 3, // Трехкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 12,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 13
      {
        advertId: 13,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 13,
        tagId: 6, // Новостройка
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 14
      {
        advertId: 14,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 14,
        tagId: 7, // Рядом с метро
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    
      // Объявление 15
      {
        advertId: 15,
        tagId: 2, // Двухкомнатная
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        advertId: 15,
        tagId: 4, // С мебелью
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});  },

  async down(queryInterface, Sequelize) {},
};
