import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorBox = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          {message && <p className="text-xs text-red-700 mt-1 leading-relaxed">{message}</p>}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBox;
