import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { Input, Button } from '../../components/ui';
import { authAPI } from '../../services/api/auth';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link"
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            placeholder="Enter your email"
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Send Reset Link
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="text-green-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
          <p className="text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;