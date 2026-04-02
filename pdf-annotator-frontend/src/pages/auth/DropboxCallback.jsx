import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '../../components/ui';
import { cloudAPI } from '../../services/api/cloud';
import toast from 'react-hot-toast';

const DropboxCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Dropbox authorization failed');
        navigate('/dashboard');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/dashboard');
        return;
      }

      try {
        const response = await cloudAPI.dropboxCallback(code);
        
        if (response.success) {
          localStorage.setItem('dropbox_access_token', response.data.accessToken);
          toast.success('Dropbox connected successfully!');
          navigate('/dashboard');
        } else {
          toast.error('Failed to connect Dropbox');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Dropbox callback error:', error);
        toast.error(error.response?.data?.message || 'Failed to connect Dropbox');
        navigate('/dashboard');
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading text="Connecting to Dropbox..." />
        <p className="mt-4 text-gray-600">Please wait...</p>
      </div>
    </div>
  );
};

export default DropboxCallback;