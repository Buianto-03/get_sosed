// Remove only the synthetic accounts recorded by redesign-live.cjs and their own records.
const fs = require('node:fs/promises');
const { Op } = require('sequelize');
const db = require('../build/db/models');
async function cleanup() {
  const saved = JSON.parse(
    await fs.readFile('/tmp/get-sosed-redesign-smoke.json', 'utf8'),
  );
  const users = await db.User.findAll({
    where: {
      id: { [Op.in]: saved.users },
      email: { [Op.like]: 'redesign-smoke-%@example.invalid' },
    },
    attributes: ['id'],
  });
  const ids = users.map((user) => user.id);
  if (ids.length !== saved.users.length)
    throw new Error('Smoke account identity check failed; cleanup stopped');
  const adverts = await db.Advert.findAll({
    where: { userId: { [Op.in]: ids } },
    attributes: ['id'],
  });
  const advertIds = adverts.map((advert) => advert.id);
  await db.sequelize.transaction(async (transaction) => {
    await db.Chat.destroy({
      where: {
        [Op.or]: [
          { senderId: { [Op.in]: ids } },
          { receiverId: { [Op.in]: ids } },
        ],
      },
      transaction,
    });
    await db.Like.destroy({
      where: {
        [Op.or]: [
          { userId: { [Op.in]: ids } },
          { advertId: { [Op.in]: advertIds } },
        ],
      },
      transaction,
    });
    for (const model of [db.AdvertTags, db.AdvertPhoto, db.Location])
      await model.destroy({
        where: { advertId: { [Op.in]: advertIds } },
        transaction,
      });
    await db.Advert.destroy({
      where: { id: { [Op.in]: advertIds } },
      transaction,
    });
    await db.UserPhoto.destroy({
      where: { userId: { [Op.in]: ids } },
      transaction,
    });
    await db.UserProfile.destroy({
      where: { userId: { [Op.in]: ids } },
      transaction,
    });
    await db.User.destroy({ where: { id: { [Op.in]: ids } }, transaction });
  });
  for (const id of ids)
    await fs.rm(`./public/images/users/user-${id}`, {
      recursive: true,
      force: true,
    });
  for (const id of advertIds)
    await fs.rm(`./public/images/adverts/advert-${id}`, {
      recursive: true,
      force: true,
    });
  await fs.rm('/tmp/get-sosed-redesign-smoke.json');
  console.log(
    `Removed ${ids.length} synthetic accounts and ${advertIds.length} own test adverts`,
  );
}
cleanup()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
