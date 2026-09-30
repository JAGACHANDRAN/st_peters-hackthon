import React from 'react';

const ProgressBar = ({ current = 0, target = 100, label, color = 'emerald' }) => {
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const colorClasses = {
    emerald: 'bg-emerald-600',
    brand: 'bg-brand-600',
    amber: 'bg-amber-500',
    blue: 'bg-blue-600',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1.5">
          <span>{label}</span>
          <span className="font-semibold text-gray-900">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            colorClasses[color] || colorClasses.emerald
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>₹{Number(current).toLocaleString('en-IN')} saved</span>
        <span>Target: ₹{Number(target).toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
