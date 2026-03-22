import type { Configuration } from '@azure/msal-browser';
import { config } from './config';

export const msalConfig: Configuration = {
  auth: {
    clientId: config.microsoft.clientId,
    authority: `https://login.microsoftonline.com/${config.microsoft.tenantId}`,
    redirectUri: config.microsoft.redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite'],
};
