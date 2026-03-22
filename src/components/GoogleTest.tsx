import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

export const GoogleTest = () => {
  const [result, setResult] = useState('');

  const login = useGoogleLogin({
    onSuccess: (response) => {
      console.log('Success:', response);
      setResult('Success! Token: ' + response.access_token.substring(0, 20) + '...');
    },
    onError: (error) => {
      console.error('Error:', error);
      setResult('Error: ' + JSON.stringify(error));
    },
    onNonOAuthError: (error) => {
      console.error('Non-OAuth Error:', error);
      setResult('Non-OAuth Error: ' + JSON.stringify(error));
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Google OAuth Test</h1>
      <button
        onClick={() => {
          console.log('Button clicked');
          setResult('Attempting login...');
          login();
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Google Login
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre>{result || 'Click button to test'}</pre>
      </div>
    </div>
  );
};
