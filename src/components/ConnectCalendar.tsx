import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { dataStore } from '../dataStore';
import { useGoogleLogin } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../msalConfig';
import { microsoftCalendarService } from '../services/microsoftCalendar';
import { googleCalendarService } from '../services/googleCalendar';
import { eventSyncService } from '../services/eventSync';
import { config } from '../config';
import axios from 'axios';

interface Props {
  onClose: () => void;
  onConnect: () => void;
}

let msalInstance: PublicClientApplication | null = null;

const getMsalInstance = async () => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
};

export const ConnectCalendar: React.FC<Props> = ({ onClose, onConnect }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMockMicrosoft, setShowMockMicrosoft] = useState(false);
  const [showMockGoogle, setShowMockGoogle] = useState(false);
  const [mockEmail, setMockEmail] = useState('');

  const isMicrosoftConfigured =
    config.microsoft.clientId && config.microsoft.clientId !== 'your_microsoft_client_id_here';

  const handleGoogleConnect = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const email = userInfoRes.data.email;

        const calendars = await googleCalendarService.getCalendarList(tokenResponse.access_token);

        // connectRealCalendar handles both new connection and token refresh
        const accountId = dataStore.connectRealCalendar(
          user.id,
          'google',
          email,
          tokenResponse.access_token,
          '',
          Date.now() + tokenResponse.expires_in * 1000,
          calendars
        );

        await eventSyncService.syncEventsForAccount(accountId);
        onConnect();
      } catch (err: any) {
        setError(err.message || 'Failed to connect Google Calendar');
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      setError('Google authentication failed: ' + (err.error_description || err.error || 'Unknown error'));
    },
    scope:
      'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
    flow: 'implicit',
  });

  const handleMicrosoftConnect = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const instance = await getMsalInstance();
      const loginResponse = await instance.loginPopup(loginRequest);
      const email = loginResponse.account.username;

      const calendars = await microsoftCalendarService.getCalendarList(loginResponse.accessToken);

      const accountId = dataStore.connectRealCalendar(
        user.id,
        'microsoft',
        email,
        loginResponse.accessToken,
        '',
        loginResponse.expiresOn?.getTime() || Date.now() + 3600000,
        calendars
      );

      await eventSyncService.syncEventsForAccount(accountId);
      onConnect();
    } catch (err: any) {
      setError(err.message || 'Failed to connect Microsoft Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleMockConnect = (provider: 'google' | 'microsoft') => {
    if (!user || !mockEmail) return;
    setLoading(true);
    setError('');
    try {
      if (dataStore.accountExists(user.id, mockEmail, provider)) {
        setError(`This ${provider} account is already connected.`);
        setLoading(false);
        return;
      }
      dataStore.mockConnectCalendar(user.id, provider, mockEmail);
      onConnect();
    } catch {
      setError('Failed to create sandbox account');
    } finally {
      setLoading(false);
    }
  };

  if (showMockGoogle || showMockMicrosoft) {
    const provider = showMockGoogle ? 'google' : 'microsoft';
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h3 className="text-2xl font-bold mb-4">
            Connect {showMockGoogle ? 'Google' : 'Microsoft 365'} (Sandbox)
          </h3>
          <div className="mb-6 p-4 rounded-lg text-sm bg-yellow-50 border border-yellow-200 text-yellow-800">
            Sandbox mode — uses mock calendar data for testing.
          </div>
          <div className="space-y-4">
            <input
              type="email"
              value={mockEmail}
              onChange={(e) => setMockEmail(e.target.value)}
              placeholder={showMockGoogle ? 'user@gmail.com' : 'user@company.com'}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={() => handleMockConnect(provider)}
              disabled={!mockEmail || loading}
              className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Connecting...' : 'Connect (Sandbox)'}
            </button>
            <button
              onClick={() => {
                setShowMockGoogle(false);
                setShowMockMicrosoft(false);
                setError('');
              }}
              className="w-full bg-gray-100 py-3 rounded-xl hover:bg-gray-200 font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Connect Calendar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl">×</button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm text-center">
            Connecting and syncing events...
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleGoogleConnect()}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            Connect Google Calendar (Real)
          </button>

          <button
            onClick={() => { setShowMockGoogle(true); setMockEmail(''); }}
            disabled={loading}
            className="w-full bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-600 disabled:bg-gray-400 font-semibold"
          >
            Connect Google (Sandbox)
          </button>

          {isMicrosoftConfigured ? (
            <button
              onClick={handleMicrosoftConnect}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
            >
              Connect Microsoft 365 (Real)
            </button>
          ) : (
            <button
              onClick={() => { setShowMockMicrosoft(true); setMockEmail(''); }}
              disabled={loading}
              className="w-full bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-600 disabled:bg-gray-400 font-semibold"
            >
              Connect Microsoft 365 (Sandbox)
            </button>
          )}

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full bg-gray-100 py-3 rounded-xl hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
