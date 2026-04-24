export default () => {
  const isDev = process.env.NODE_ENV === 'development';
  const localIp = isDev ? 'localhost' : null;

  const apiPort = parseInt(process.env.API_PORT!);
  const apiHost = process.env.API_HOST;

  return {
    api: {
      env: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL,
      port: apiPort,
      host: apiHost,
      url: isDev
        ? `http://${localIp}:${apiPort}`
        : `https://${apiHost}:${apiPort}`,
      isDev: isDev,
    },

    database: {
      url: process.env.DATABASE_URL,
    },

    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
    },

    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessExpiresIn: process.env.JWT_ACCESS_IN,
      refreshExpiresIn: process.env.JWT_REFRESH_IN,
    },

    limit: {
      rateTtl: process.env.RATE_TTL,
      rateLimit: process.env.RATE_LIMIT,
      uthRateTtl: process.env.AUTH_RATE_TTL,
      authRateLimit: process.env.AUTH_RATE_LIMIT,
      rateBlockDuration: process.env.RATE_BLOCK_DURATION,
    },

    throttler: {
      ttl: parseInt(process.env.RATE_TTL ?? '60', 10),
      limit: parseInt(process.env.RATE_LIMIT ?? '100', 10),
      authTtl: parseInt(process.env.AUTH_RATE_TTL ?? '60', 10),
      authLimit: parseInt(process.env.AUTH_RATE_LIMIT ?? '5', 10),
      blockDuration:
        parseInt(process.env.RATE_BLOCK_DURATION ?? '180', 10) * 1000,
    },
  };
};
