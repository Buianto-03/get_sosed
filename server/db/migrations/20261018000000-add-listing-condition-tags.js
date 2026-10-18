'use strict';

const conditionNames = [
  'Для некурящих',
  'Питомцы разрешены',
  'Тихие вечера',
  'С рабочим местом',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Tags.name has no unique constraint. Serialize this migration's check/insert.
      await queryInterface.sequelize.query('LOCK TABLE "Tags" IN SHARE ROW EXCLUSIVE MODE', {
        transaction,
      });
      const existing = await queryInterface.sequelize.query(
        'SELECT "name" FROM "Tags" WHERE "name" IN (:names)',
        { replacements: { names: conditionNames }, type: Sequelize.QueryTypes.SELECT, transaction },
      );
      const now = new Date();
      const missing = conditionNames
        .filter((name) => !existing.some((tag) => tag.name === name))
        .map((name) => ({ name, createdAt: now, updatedAt: now }));
      if (missing.length > 0) await queryInterface.bulkInsert('Tags', missing, { transaction });
    });
  },

  async down() {
    // Keep catalog entries: they may already be linked to user adverts.
    // Undoing and reapplying this migration must preserve their IDs and AdvertTags.
  },
};
