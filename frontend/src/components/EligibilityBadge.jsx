import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

const EligibilityBadge = ({ verdict, size = 'md' }) => {
  const normalized = (verdict || '').toUpperCase();

  const configs = {
    ELIGIBLE: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Eligible',
      icon: CheckCircle2,
    },
    MAYBE: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Needs Info / Review',
      icon: AlertTriangle,
    },
    NOT_ELIGIBLE: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      label: 'Not Eligible',
      icon: XCircle,
    },
  };

  const config = configs[normalized] || {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    label: verdict || 'Unknown',
    icon: HelpCircle,
  };

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};

export default EligibilityBadge;
