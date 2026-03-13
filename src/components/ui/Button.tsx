import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[#11d442] text-white hover:bg-[#0fb839] hover:-translate-y-0.5 shadow hover:shadow-lg hover:shadow-[#11d442]/20 active:translate-y-0",
      secondary: "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5 shadow hover:shadow-lg active:translate-y-0",
      outline: "border-2 border-gray-200 bg-transparent hover:border-[#11d442] hover:text-[#11d442] text-gray-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900"
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg"
    };

    const classes = [
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth ? "w-full" : "",
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
