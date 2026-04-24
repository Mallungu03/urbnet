import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Api Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  LOG_LEVEL: Joi.string().required(),

  API_PORT: Joi.number().required(),
  API_HOST: Joi.string().required(),

  // Database (if needed in future)
  DATABASE_URL: Joi.string().optional(),

  // Security
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_IN: Joi.string().required(),
  JWT_REFRESH_IN: Joi.string().required(),

  //limit
  RATE_TTL: Joi.number().integer().min(1).required(),
  RATE_LIMIT: Joi.number().integer().min(1).required(),
  AUTH_RATE_TTL: Joi.number().integer().min(1).required(),
  AUTH_RATE_LIMIT: Joi.number().integer().min(1).required(),
  RATE_BLOCK_DURATION: Joi.number().integer().min(1).required(),

  // Mail Service
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_SECURE: Joi.boolean().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().email().required(),
});
