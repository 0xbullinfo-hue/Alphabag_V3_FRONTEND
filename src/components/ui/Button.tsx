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
  const baseStyles = "inline-flex items-center justify-center font-medium rounded transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-alphabag-yellow disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-alphabag-yellow text-[#0B0E11] font-semibold hover:bg-[#FCD535] active:bg-[#D9A30A]",
    secondary: "bg-[#202630] border border-[#2B313A] text-alphabag-text hover:bg-[#2B313A] hover:border-[#3E4552]",
    danger: "bg-rose-500/10 border border-rose-500/20 text-alphabag-red hover:bg-rose-500 hover:text-white",
    ghost: "bg-transparent text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]",
    outline: "bg-transparent border border-[#2B313A] text-alphabag-text hover:border-alphabag-yellow hover:text-alphabag-yellow"
  };

  const sizes = {
    xs: "h-7 px-2.5 text-xs gap-1.5",
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-xs font-medium gap-2",
    lg: "h-10 px-5 text-sm font-medium gap-2"
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
          {leftIcon && <span className="flex items-center shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex items-center shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
