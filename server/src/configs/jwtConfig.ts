interface TokenConfig {
  access: { expiresIn: `${number}` };
  refresh: { expiresIn: `${number}` };
}

const jwtConfig: TokenConfig = {
  access: {
    expiresIn: `${5 * 1000}`,
  },
  refresh: {
    expiresIn: `${12 * 60 * 60 * 1000}`,
  },
};

export = jwtConfig;
