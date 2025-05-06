declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ROLLBAR_ACCESS_TOKEN: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
