import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg transform relative overflow-hidden font-serif border-b-4 active:border-b-0 active:translate-y-1";
  
  const variants = {
    // Primary: Đỏ Cam (Red Orange) - Nổi bật, hành động chính
    primary: "bg-gradient-to-r from-red-orange to-red-600 text-white border-red-800 hover:from-red-500 hover:to-orange-500 shadow-orange-200 disabled:opacity-50 disabled:border-none",
    
    // Secondary: Xanh Lính (Army Green) - Hành động phụ
    secondary: "bg-army-green text-white border-[#2E3B29] hover:bg-army-green-light shadow-emerald-100 disabled:opacity-50 disabled:border-none",
    
    // Outline: Tím Huế (Hue Purple) - Viền
    outline: "bg-white border-2 border-hue-purple text-hue-purple hover:bg-purple-50 shadow-sm border-b-2 active:border-b-2 active:translate-y-0"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="animate-pulse">Đang xử lý...</span>
        </>
      ) : children}
    </button>
  );
};