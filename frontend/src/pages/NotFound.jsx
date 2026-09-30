import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">404</h1>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-xs text-gray-500 mb-6">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
