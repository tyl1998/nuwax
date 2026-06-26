import '@umijs/max/typings';

declare global {
  interface Window {
    __NUWAX_RUNTIME_CONFIG__?: {
      BASE_URL?: string;
      WS_BASE_URL?: string;
      ROUTER_BASENAME?: string;
      PUBLIC_PATH?: string;
      ENABLE_MOBILE_REDIRECT?: string;
      WITH_CREDENTIALS?: string;
      APP_ENV?: string;
      APP_VERSION?: string;
    };
  }
}

export {};
