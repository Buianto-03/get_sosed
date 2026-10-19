module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'UserProfiles',
        'city',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'UserProfiles',
        'intent',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'UserProfiles',
        'habits',
        { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const field of ['city', 'intent', 'habits'])
        await queryInterface.removeColumn('UserProfiles', field, {
          transaction,
        });
    });
  },
};
