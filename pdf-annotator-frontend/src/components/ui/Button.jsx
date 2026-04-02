import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseStyles = 'btn inline-flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    outline: 'btn-outline',
  };

  const sizes = {
    sm: 'btn-sm',
    md: 'px-4 py-2',
    lg: 'btn-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${disabled || loading ? 'disabled' : ''}`}
      {...props}
    >
      {loading && <span className="spinner spinner-sm" />}
      {icon && !loading && icon}
      {children}
    </button>
  );
};

export default Button;