export interface NuwaxRuntimeConfig {
  BASE_URL?: string;
  WS_BASE_URL?: string;
  ROUTER_BASENAME?: string;
  PUBLIC_PATH?: string;
  ENABLE_MOBILE_REDIRECT?: string;
  WITH_CREDENTIALS?: string;
  APP_ENV?: string;
  APP_VERSION?: string;
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const TRUE_VALUES = ['1', 'true', 'yes', 'on'];
const FALSE_VALUES = ['0', 'false', 'no', 'off'];

const parseBooleanString = (value: string | undefined): boolean | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = value.toLowerCase();
  if (TRUE_VALUES.includes(normalized)) {
    return true;
  }

  if (FALSE_VALUES.includes(normalized)) {
    return false;
  }

  return null;
};

const getInjectedRuntimeConfig = (): NuwaxRuntimeConfig => {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__NUWAX_RUNTIME_CONFIG__ || {};
};

export const getRuntimeConfig = (): NuwaxRuntimeConfig => {
  const injected = getInjectedRuntimeConfig();

  return {
    BASE_URL: injected.BASE_URL ?? process.env.BASE_URL ?? '',
    WS_BASE_URL: injected.WS_BASE_URL ?? process.env.WS_BASE_URL ?? '',
    ROUTER_BASENAME:
      injected.ROUTER_BASENAME ?? process.env.ROUTER_BASENAME ?? '',
    PUBLIC_PATH: injected.PUBLIC_PATH ?? process.env.PUBLIC_PATH ?? '/',
    ENABLE_MOBILE_REDIRECT:
      injected.ENABLE_MOBILE_REDIRECT ??
      process.env.ENABLE_MOBILE_REDIRECT ??
      'true',
    WITH_CREDENTIALS:
      injected.WITH_CREDENTIALS ?? process.env.WITH_CREDENTIALS ?? '',
    APP_ENV: injected.APP_ENV ?? process.env.APP_ENV ?? '',
    APP_VERSION: injected.APP_VERSION ?? process.env.APP_VERSION ?? '',
  };
};

export const getBaseUrl = () =>
  trimTrailingSlash(getRuntimeConfig().BASE_URL || '');

export const isAbsoluteUrl = (url: string) => /^(https?:)?\/\//i.test(url);

const shouldUseCredentialsByBaseUrl = (baseUrl: string): boolean => {
  if (!baseUrl || typeof window === 'undefined' || !isAbsoluteUrl(baseUrl)) {
    return false;
  }

  try {
    return (
      new URL(baseUrl, window.location.origin).origin !== window.location.origin
    );
  } catch (error) {
    console.warn(
      '[runtimeConfig] Failed to resolve base url for credentials policy:',
      error,
    );
    return false;
  }
};

export const shouldUseCredentials = () => {
  const runtimeConfig = getRuntimeConfig();
  const explicitValue = parseBooleanString(runtimeConfig.WITH_CREDENTIALS);

  if (explicitValue !== null && explicitValue !== undefined) {
    return explicitValue;
  }

  return shouldUseCredentialsByBaseUrl(getBaseUrl());
};

export const withBaseUrl = (url: string) => {
  if (!url) {
    return getBaseUrl();
  }

  if (isAbsoluteUrl(url)) {
    return url;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return url;
  }

  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * 将绝对 URL 转为当前源的相对路径，确保请求走同源代理，避免跨域导致 Cookie 丢失
 * 例: "http://localhost:8080/api/f/xxx" → "/api/f/xxx"
 */
export const toSameOriginUrl = (url: string): string => {
  if (!url) return url;
  if (!isAbsoluteUrl(url)) {
    return withBaseUrl(url);
  }
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
};
