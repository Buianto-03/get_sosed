const { Message } = require('../../db/models');

async function checkAuthor(req, res, next) {
  const { id } = req.params;
  const userId = res.locals.user.id;
  const targetMessage = await Message.findByPk(id);
  if (targetMessage && targetMessage?.userId === userId) return next();
  return res.sendStatus(403);
}

module.exports = checkAuthor;
