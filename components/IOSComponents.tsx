
import React from 'react';

export const IOSHeader: React.FC<{ title: string; rightAction?: React.ReactNode; titleClassName?: string; backgroundClass?: string }> = ({ title, rightAction, titleClassName, backgroundClass }) => (
  <div className={`absolute top-0 left-0 right-0 h-20 pt-4 px-6 flex items-center justify-between z-50 border-b border-gray-200/50 transition-all duration-500 ${backgroundClass || 'bg-white/80 backdrop-blur-md'}`}>
    <div className="max-w-[1920px] mx-auto w-full flex items-center justify-between">
      <h1 className={`text-xl font-bold tracking-tight text-gray-900 ${titleClassName || ''}`}>{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </div>
  </div>
);

export const IOSButton: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'ghost'; 
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled }) => {
  const baseStyle = "active:scale-95 transition-transform duration-200 rounded-2xl font-semibold flex items-center justify-center py-3 px-4 w-full";
  const variants = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-gray-100 text-gray-900",
    ghost: "bg-transparent text-blue-600 hover:bg-blue-50"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const FloatingNav: React.FC<{ 
  tabs: { id: string; icon: React.FC<any>; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => (
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
     <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl p-1.5 flex items-center space-x-1">
      {tabs.map((tab) => (
        <button 
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-2 rounded-full flex items-center space-x-2 transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="text-xs font-bold">{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm mx-4 text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-semibold text-gray-800">{message}</p>
    </div>
  </div>
);
