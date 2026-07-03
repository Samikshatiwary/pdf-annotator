import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { Input, Button } from '../../components/ui';
import { authAPI } from '../../services/api/auth';
import toast from 'react-hot-toast';
import { validatePassword, validatePasswordMatch } from '../../utils/validation';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    const matchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (!matchValidation.valid) {
      newErrors.confirmPassword = matchValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setLoading(true);
      await authAPI.resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="New Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={<Lock size={18} />}
            placeholder="Enter new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={<Lock size={18} />}
            placeholder="Confirm new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;