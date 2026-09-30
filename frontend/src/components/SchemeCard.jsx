import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import EligibilityBadge from './EligibilityBadge';

const SchemeCard = ({ scheme, eligibilityResult }) => {
  const verdict = eligibilityResult?.verdict;
  const failedRule = eligibilityResult?.failed_rules?.[0];
  const matchedRule = eligibilityResult?.matched_rules?.[0];
  const missingInfo = eligibilityResult?.missing_info?.[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-brand-500 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">
            {scheme.provider}
          </span>
          {verdict && <EligibilityBadge verdict={verdict} />}
        </div>

        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1">
          {scheme.name}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
          {scheme.description}
        </p>

        <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 mb-4 text-xs">
          <div>
            <span className="text-gray-500 block">Loan Range</span>
            <span className="font-semibold text-gray-900">
              ₹{Number(scheme.loan_min).toLocaleString('en-IN')} - ₹{Number(scheme.loan_max).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Interest Rate</span>
            <span className="font-semibold text-brand-700">
              {scheme.interest_rate_min}%{scheme.interest_rate_max ? ` - ${scheme.interest_rate_max}%` : ''} p.a.
            </span>
          </div>
        </div>

        {/* Dynamic reason box */}
        {verdict && (
          <div className="text-xs mb-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            {verdict === 'ELIGIBLE' && matchedRule && (
              <p className="text-emerald-700 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" /> {matchedRule}
              </p>
            )}
            {verdict === 'NOT_ELIGIBLE' && failedRule && (
              <p className="text-rose-700 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> Reason: {failedRule}
              </p>
            )}
            {verdict === 'MAYBE' && missingInfo && (
              <p className="text-amber-700 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> Missing: {missingInfo}
              </p>
            )}
          </div>
        )}

        {/* Verification badge */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          <span>
            {scheme.last_verified ? (
              <span className="text-emerald-600">Verified: {new Date(scheme.last_verified).toLocaleDateString()}</span>
            ) : (
              <span className="text-amber-600 font-medium">Not verified yet - verify on official portal</span>
            )}
          </span>
          {scheme.source_url && (
            <a
              href={scheme.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 font-medium"
            >
              Official site <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Tenure: {scheme.tenure_months_min}-{scheme.tenure_months_max}m
        </span>
        <Link
          to={`/loans/${scheme.id || scheme._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-white border border-brand-200 px-3.5 py-1.5 rounded-lg hover:bg-brand-50 transition shadow-sm"
        >
          Check Repayment <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default SchemeCard;
