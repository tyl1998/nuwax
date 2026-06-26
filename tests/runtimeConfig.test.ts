import {
  getBaseUrl,
  getRuntimeConfig,
  shouldUseCredentials,
  withBaseUrl,
} from '@/utils/runtimeConfig';
import { beforeEach, describe, expect, it } from 'vitest';

describe('runtimeConfig', () => {
  beforeEach(() => {
    window.__NUWAX_RUNTIME_CONFIG__ = undefined;
  });

  it('prefers injected runtime config', () => {
    window.__NUWAX_RUNTIME_CONFIG__ = {
      BASE_URL: 'https://api.example.com/',
      APP_ENV: 'prod',
    };

    expect(getRuntimeConfig().APP_ENV).toBe('prod');
    expect(getBaseUrl()).toBe('https://api.example.com');
  });

  it('keeps absolute url untouched', () => {
    window.__NUWAX_RUNTIME_CONFIG__ = {
      BASE_URL: 'https://api.example.com',
    };

    expect(withBaseUrl('https://cdn.example.com/file.png')).toBe(
      'https://cdn.example.com/file.png',
    );
  });

  it('prefixes relative url with injected base url', () => {
    window.__NUWAX_RUNTIME_CONFIG__ = {
      BASE_URL: 'https://api.example.com/',
    };

    expect(withBaseUrl('/api/health')).toBe(
      'https://api.example.com/api/health',
    );
    expect(withBaseUrl('api/health')).toBe(
      'https://api.example.com/api/health',
    );
  });

  it('enables credentials automatically for cross-origin base url', () => {
    window.__NUWAX_RUNTIME_CONFIG__ = {
      BASE_URL: 'https://api.example.com',
      WITH_CREDENTIALS: '',
    };

    expect(shouldUseCredentials()).toBe(true);
  });

  it('keeps credentials disabled for relative base url by default', () => {
    window.__NUWAX_RUNTIME_CONFIG__ = {
      BASE_URL: '',
      WITH_CREDENTIALS: '',
    };

    expect(shouldUseCredentials()).toBe(false);
  });

  it('respects explicit credentials override', () => {
    window.__NUWAX_RUNTIME_CONFIG__ = {
      BASE_URL: 'https://api.example.com',
      WITH_CREDENTIALS: 'false',
    };

    expect(shouldUseCredentials()).toBe(false);
  });
});
