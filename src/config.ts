import type { CloudflareBindings } from './types';

export const getConfig = (env: CloudflareBindings) => {
  return {
    DB: env.DB,
    TRUSTED_ORIGINS: env.TRUSTED_ORIGINS?.includes(',')
      ? env.TRUSTED_ORIGINS.split(',').map((origin) => origin.trim())
      : env.TRUSTED_ORIGINS
        ? [env.TRUSTED_ORIGINS]
        : ['*'],
    NODE_ENV: env.NODE_ENV ?? 'development',
  };
};
