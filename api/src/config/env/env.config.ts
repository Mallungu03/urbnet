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
  };
};
