import jwtConfig = require('./jwtConfig');

const cookiesConfig = {
  httpOnly: true,
  maxAge: Number(jwtConfig.refresh.expiresIn),
};

export = cookiesConfig;
