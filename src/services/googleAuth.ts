// Google Identity Services (GIS) OAuth 2.0 Token Manager

const TOKEN_KEY = 'life_logger_google_token';
const TOKEN_EXPIRY_KEY = 'life_logger_token_expiry';

export interface OAuthToken {
  access_token: string;
  expires_in: number;
}

let tokenClient: any = null;

export const initGoogleAuth = (clientId: string, onTokenReceived: (token: string) => void) => {
  if (typeof window === 'undefined') return;

  const tryInit = () => {
    const google = (window as any).google;
    if (google && google.accounts && google.accounts.oauth2) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth Error:', response.error);
            return;
          }
          if (response.access_token) {
            const expiresIn = response.expires_in || 3600;
            const expiryTime = Date.now() + expiresIn * 1000;
            localStorage.setItem(TOKEN_KEY, response.access_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
            onTokenReceived(response.access_token);
          }
        },
      });
      return true;
    }
    return false;
  };

  if (!tryInit()) {
    // Retry initialization if Google GIS script is still downloading in background
    const interval = setInterval(() => {
      if (tryInit()) {
        clearInterval(interval);
      }
    }, 300);
    setTimeout(() => clearInterval(interval), 10000);
  }
};

export const requestGoogleLogin = (clientId?: string, onTokenReceived?: (token: string) => void) => {
  if (!tokenClient && clientId && onTokenReceived) {
    initGoogleAuth(clientId, onTokenReceived);
  }

  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Attempt fallback init
    const google = (window as any).google;
    if (google && google.accounts && google.accounts.oauth2 && clientId) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response: any) => {
          if (response.access_token) {
            const expiresIn = response.expires_in || 3600;
            const expiryTime = Date.now() + expiresIn * 1000;
            localStorage.setItem(TOKEN_KEY, response.access_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
            if (onTokenReceived) onTokenReceived(response.access_token);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.warn('Google Identity Services script still loading. Retrying in 1 second...');
      setTimeout(() => {
        if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' });
      }, 1000);
    }
  }
};

export const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return null;

  if (Date.now() > parseInt(expiry, 10) - 60000) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }

  return token;
};

export const logoutGoogle = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && (window as any).google?.accounts?.oauth2) {
    (window as any).google.accounts.oauth2.revoke(token, () => {
      console.log('Token revoked.');
    });
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};
