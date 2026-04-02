import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input, Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validateRequired } from '../../utils/validation';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation) {
      newErrors.email = 'Please enter a valid email';
    }

    const passwordValidation = validateRequired(formData.password, 'Password');
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        icon={<Mail size={18} />}
        placeholder="Enter your email"
        required
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={<Lock size={18} />}
          placeholder="Enter your password"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="checkbox" />
          <span className="text-sm text-gray-600">Remember me</span>
        </label>
        <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Sign In
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;