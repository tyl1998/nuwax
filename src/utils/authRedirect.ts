const EXTERNAL_LOGIN_REDIRECT_GUARD_KEY = '__nuwax_external_login_redirect__';
const EXTERNAL_LOGIN_REDIRECT_GUARD_TTL = 5000;

type ExternalLoginRedirectRecord = {
  url: string;
  timestamp: number;
};

const resolveTargetUrl = (url: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const canResolveTarget =
    url.startsWith('/') ||
    url.startsWith('http://') ||
    url.startsWith('https://');

  if (!canResolveTarget) {
    return url;
  }

  const targetUrl = new URL(url, window.location.origin);
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const targetPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;

  if (targetPath === currentPath) {
    return null;
  }

  return targetUrl.toString();
};

const readRedirectRecord = (): ExternalLoginRedirectRecord | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(EXTERNAL_LOGIN_REDIRECT_GUARD_KEY);
    return raw ? (JSON.parse(raw) as ExternalLoginRedirectRecord) : null;
  } catch (error) {
    console.warn(
      '[authRedirect] Failed to parse redirect guard record:',
      error,
    );
    sessionStorage.removeItem(EXTERNAL_LOGIN_REDIRECT_GUARD_KEY);
    return null;
  }
};

const writeRedirectRecord = (url: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(
    EXTERNAL_LOGIN_REDIRECT_GUARD_KEY,
    JSON.stringify({
      url,
      timestamp: Date.now(),
    }),
  );
};

export const redirectToExternalLogin = (url: string): boolean => {
  if (!url || typeof window === 'undefined') {
    return false;
  }

  const resolvedTarget = resolveTargetUrl(url);
  if (!resolvedTarget) {
    return false;
  }

  const existingRecord = readRedirectRecord();
  const now = Date.now();
  if (
    existingRecord?.url === resolvedTarget &&
    now - existingRecord.timestamp < EXTERNAL_LOGIN_REDIRECT_GUARD_TTL
  ) {
    console.warn(
      '[authRedirect] Duplicate external login redirect suppressed:',
      resolvedTarget,
    );
    return false;
  }

  writeRedirectRecord(resolvedTarget);
  window.location.href = resolvedTarget;
  return true;
};
