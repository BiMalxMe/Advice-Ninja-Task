export const config = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback',
  },
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:5173/auth/microsoft/callback',
    tenantId: import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common',
  },
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
};
