import type { NextFunction, Request, Response } from 'express';

const { Message } = require('../../db/models');

async function checkAuthor(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const userId = res.locals.user.id;
  const targetMessage = await Message.findByPk(id);
  if (targetMessage && targetMessage?.userId === userId) {
    return next();
  }
  return res.sendStatus(403);
}

export = checkAuthor;
