import React from 'react';

const Loader = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3 text-center">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-brand-600 border-t-transparent rounded-full animate-spin`}
      />
      {message && <p className="text-sm font-medium text-gray-600">{message}</p>}
    </div>
  );
};

export default Loader;
