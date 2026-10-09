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

  const google = (window as any).google;
  if (!google || !google.accounts || !google.accounts.oauth2) {
    console.warn('Google Identity Services script not loaded yet.');
    return;
  }

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
};

export const requestGoogleLogin = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    alert('Google Auth is initializing. Please ensure your Client ID is configured in Settings.');
  }
};

export const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return null;

  // Check if token is expired (with 1 minute buffer)
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
