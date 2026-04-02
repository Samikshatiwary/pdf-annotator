import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '../../components/ui';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Google authentication failed');
        setTimeout(() => navigate(-1), 2000);
        return;
      }

      if (code) {
        // Store the code and token in localStorage for the component to use
        localStorage.setItem('google_auth_code', code);
        
        // Close the window if it's a popup, or navigate back
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code }, '*');
          window.close();
        } else {
          navigate(-1);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading text="Completing Google authentication..." />
    </div>
  );
};

export default GoogleCallback;