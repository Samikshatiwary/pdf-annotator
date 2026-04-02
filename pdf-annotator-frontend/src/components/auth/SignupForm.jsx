import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Input, Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validatePasswordMatch, validateRequired } from '../../utils/validation';

const SignupForm = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    const nameValidation = validateRequired(formData.name, 'Name');
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    const passwordMatchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (!passwordMatchValidation.valid) {
      newErrors.confirmPassword = passwordMatchValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const result = await register(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        icon={<User size={18} />}
        placeholder="Enter your name"
        required
      />

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
          placeholder="Create a password"
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
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<Lock size={18} />}
          placeholder="Confirm your password"
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

      <div className="flex items-start gap-2">
        <input type="checkbox" className="checkbox mt-1" required />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <Link to="/terms" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </Link>
        </span>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default SignupForm;