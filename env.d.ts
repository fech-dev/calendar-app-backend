declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_PORT: number;
      DATABASE_PORT: number;
      DATABASE_HOST: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;
      DATABASE_URI: string;
    }
  }
}

export {};
