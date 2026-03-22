import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { dataStore } from '../dataStore';
import { googleCalendarService } from '../services/googleCalendar';
import axios from 'axios';
import { config } from '../config';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export const GoogleOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for errors from Google
        if (errorParam) {
          setError(`Google authentication failed: ${errorParam}`);
          setLoading(false);
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        if (!code) {
          setError('No authorization code received from Google');
          setLoading(false);
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        // Wait for auth to load before checking user
        if (authLoading) {
          console.log('Waiting for auth to load...');
          return;
        }

        // Verify state matches
        const storedState = sessionStorage.getItem('google_oauth_state');
        if (state !== storedState) {
          setError('State mismatch - possible CSRF attack');
          setLoading(false);
          sessionStorage.removeItem('google_oauth_state');
          sessionStorage.removeItem('google_oauth_nonce');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        // Extract userId from state if user is not available
        let userId = user?.id;
        if (!userId && state) {
          try {
            const stateData = JSON.parse(atob(state));
            userId = stateData.userId;
            console.log('Extracted userId from state:', userId);
          } catch (e) {
            console.log('Could not extract userId from state');
          }
        }

        if (!userId) {
          setError('User not authenticated. Please log in and try again.');
          setLoading(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        console.log('Exchanging authorization code for access token...');

        // Exchange the code for an access token
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', config.google.clientId);
        params.append('client_secret', import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '');
        params.append('redirect_uri', config.google.redirectUri);
        params.append('grant_type', 'authorization_code');

        const tokenResponse = await axios.post(GOOGLE_TOKEN_ENDPOINT, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        console.log('Token response received:', tokenResponse.data);

        const accessToken = tokenResponse.data.access_token;
        const expiresIn = tokenResponse.data.expires_in || 3600;

        if (!accessToken) {
          throw new Error('No access token received from Google');
        }

        console.log('Access token received, length:', accessToken.length);

        // Get user info
        console.log('Fetching user info with token...');
        const userInfoResponse = await axios.get(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        console.log('User info retrieved:', userInfoResponse.data.email);

        // Check if account already exists
        if (dataStore.accountExists(userId, userInfoResponse.data.email, 'google')) {
          setError('This Google account is already connected. Please use a different email or logout and try again.');
          setLoading(false);
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        // Get calendar list
        const calendars = await googleCalendarService.getCalendarList(accessToken);
        console.log('Calendars retrieved:', calendars.length);
        if (calendars.length > 0) {
          console.log('Calendar details:', calendars.map(c => ({ id: c.id, name: c.name, color: c.color })));
        }

        // Store the connection using userId
        const accountId = dataStore.connectRealCalendar(
          userId,
          'google',
          userInfoResponse.data.email,
          accessToken,
          '',
          Date.now() + (expiresIn * 1000),
          calendars
        );

        console.log('Calendar connection stored:', {
          accountId,
          userId,
          email: userInfoResponse.data.email,
          calendarsCount: calendars.length
        });

        // Verify data was stored
        const storedAccounts = dataStore.getAccountsByUserId(userId);
        console.log('Stored accounts for user:', storedAccounts);
        const storedCalendars = dataStore.getCalendarsByAccountId(accountId);
        console.log('Stored calendars for account:', storedCalendars);

        // Clean up session storage
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_nonce');

        console.log('Google Calendar connected successfully');
        setLoading(false);

        // Redirect back to dashboard with a refresh signal
        // Wait a bit to ensure data is persisted to localStorage
        setTimeout(() => {
          window.location.href = '/dashboard?refresh=true';
        }, 500);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Error message:', err.message);
        
        setError(
          err.response?.data?.error_description ||
          err.response?.data?.error ||
          err.message ||
          'Failed to complete Google authentication'
        );
        setLoading(false);
        
        // Redirect after showing error
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, user, authLoading, navigate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {loading ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
            <p className="text-center text-gray-700 font-medium">Connecting Google Calendar...</p>
          </>
        ) : error ? (
          <>
            <h3 className="text-2xl font-bold mb-4 text-red-600">Connection Failed</h3>
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
              {error}
            </div>
            <p className="text-center text-gray-600 text-sm">
              Redirecting you back to the dashboard...
            </p>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-4 text-green-600">Success!</h3>
            <p className="text-center text-gray-700 mb-4">
              Google Calendar connected successfully
            </p>
            <p className="text-center text-gray-600 text-sm">
              Redirecting you back to the dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
