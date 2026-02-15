
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  leftIcon,
  rightIcon,
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alphabag-yellow focus:ring-offset-alphabag-black disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider rounded-lg";
  
  const variants = {
    primary: "bg-alphabag-yellow text-alphabag-black hover:bg-alphabag-yellowHover shadow-lg shadow-alphabag-yellow/10",
    secondary: "bg-alphabag-gray text-alphabag-text hover:bg-gray-700",
    danger: "bg-alphabag-red/10 text-alphabag-red border border-alphabag-red/20 hover:bg-alphabag-red hover:text-white",
    ghost: "bg-transparent text-alphabag-subtext hover:text-alphabag-yellow hover:bg-alphabag-gray/30",
    outline: "bg-transparent border border-alphabag-gray text-alphabag-text hover:border-alphabag-yellow hover:text-alphabag-yellow"
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-[9px]",
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm min-h-[44px]", // WCAG compliance for touch targets
    lg: "px-8 py-4 text-base min-h-[52px]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
