import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schemesApi } from '../api/schemes';
import { eligibilityApi } from '../api/eligibility';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EligibilityBadge from '../components/EligibilityBadge';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
  Bot,
  Lightbulb,
} from 'lucide-react';

const LoanDetail = () => {
  const { id } = useParams();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  // Interactive Sliders
  const [amount, setAmount] = useState(50000);
  const [tenure, setTenure] = useState(24);

  // Result
  const [eligibilityData, setEligibilityData] = useState(null);

  useEffect(() => {
    const fetchScheme = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await schemesApi.getById(id);
        setScheme(data);
        if (data) {
          const initialAmt = Math.min(Math.max(50000, data.loan_min), data.loan_max);
          setAmount(initialAmt);
          setTenure(data.tenure_months_min || 24);
          runCheck(initialAmt, data.tenure_months_min || 24);
        }
      } catch (err) {
        console.error('Failed to load scheme:', err);
        setError('Failed to load scheme details.');
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [id]);

  const runCheck = async (amt, ten) => {
    setEvaluating(true);
    try {
      const res = await eligibilityApi.check(amt, ten, id);
      if (res.results && res.results.length > 0) {
        setEligibilityData(res.results[0]);
      }
    } catch (err) {
      console.error('Check error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleAmountChange = (newAmt) => {
    setAmount(newAmt);
    runCheck(newAmt, tenure);
  };

  const handleTenureChange = (newTen) => {
    setTenure(newTen);
    runCheck(amount, newTen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading scheme details and running repayment check..." size="lg" />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <ErrorBox message="Scheme not found or no longer active." />
      </div>
    );
  }

  const repayment = eligibilityData?.repayment;
  const verdict = eligibilityData?.verdict;
  const repayVerdict = repayment?.verdict;
  const aiExp = eligibilityData?.ai_explanation;

  const verdictStyles = {
    COMFORTABLE: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      title: 'Comfortable & Safe',
      desc: 'This monthly EMI easily fits your family income and business projections.',
    },
    TIGHT: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      badge: 'bg-amber-600 text-white',
      title: 'Manageable but Tight',
      desc: 'You can afford this loan, but leaves small margin for unexpected medical or household needs.',
    },
    RISKY: {
      bg: 'bg-orange-50 border-orange-300 text-orange-900',
      badge: 'bg-orange-600 text-white',
      title: 'High Risk for Current Cash Flow',
      desc: 'The EMI is higher than your safe limit. Consider reducing the amount or extending tenure.',
    },
    NOT_AFFORDABLE: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      badge: 'bg-rose-600 text-white',
      title: 'Not Affordable Right Now',
      desc: 'The requested EMI exceeds your net available cash flow. Borrowing this amount could lead to default.',
    },
  };

  const currentStyle = verdictStyles[repayVerdict] || verdictStyles.TIGHT;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Back navigation */}
        <Link
          to="/loans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 mb-6 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schemes
        </Link>

        {/* Mandatory Official Guidance Notice */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Official Platform Disclaimer:</span>
            <p className="mt-0.5">
              Guidance only. Final eligibility, interest rate and approval are decided by the bank or scheme authority.
            </p>
          </div>
        </div>

        {/* Scheme Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-md">
              {scheme.provider} • {scheme.level.toUpperCase()} SCHEME
            </span>
            {verdict && <EligibilityBadge verdict={verdict} size="lg" />}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
            {scheme.name}
          </h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{scheme.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 rounded-2xl p-4 mt-6 text-xs">
            <div>
              <span className="text-gray-500 block">Permitted Loan Range</span>
              <span className="font-bold text-gray-900 text-sm">
                ₹{Number(scheme.loan_min).toLocaleString('en-IN')} - ₹{Number(scheme.loan_max).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Interest Rate</span>
              <span className="font-bold text-brand-700 text-sm">
                {scheme.interest_rate_min}%{scheme.interest_rate_max ? ` - ${scheme.interest_rate_max}%` : ''} p.a.
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Subvention / Subsidy</span>
              <span className="font-semibold text-gray-800">
                {scheme.interest_subvention || 'Standard terms'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Collateral Required</span>
              <span className="font-semibold text-emerald-700">
                {scheme.collateral_required ? 'Yes' : 'No (Collateral Free)'}
              </span>
            </div>
          </div>

          {/* Verification Status */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
            <div className="text-gray-500">
              {scheme.last_verified ? (
                <span className="text-emerald-700 font-medium">
                  Verified with portal: {new Date(scheme.last_verified).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-amber-700 font-semibold">
                  ⚠️ Note: Seed data not verified yet — please verify current year guidelines with official branch
                </span>
              )}
            </div>
            {scheme.source_url && (
              <a
                href={scheme.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700"
              >
                Official Scheme Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Live EMI Calculator & Repayment Affordability Check */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" /> Live EMI & Safe Repayment Capacity Check
            </h2>
            {evaluating && <span className="text-xs text-brand-600 font-semibold animate-pulse">Calculating...</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Slider 1: Loan Amount */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                <span>Requested Borrowing Amount</span>
                <span className="text-base text-brand-700 font-extrabold">
                  ₹{Number(amount).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={scheme.loan_min}
                max={scheme.loan_max}
                step="5000"
                value={amount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>Min: ₹{Number(scheme.loan_min).toLocaleString('en-IN')}</span>
                <span>Max: ₹{Number(scheme.loan_max).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Slider 2: Tenure */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                <span>Repayment Tenure (Months)</span>
                <span className="text-base text-brand-700 font-extrabold">{tenure} Months</span>
              </div>
              <input
                type="range"
                min={scheme.tenure_months_min}
                max={scheme.tenure_months_max}
                step="6"
                value={tenure}
                onChange={(e) => handleTenureChange(parseInt(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>{scheme.tenure_months_min} Months</span>
                <span>{scheme.tenure_months_max} Months</span>
              </div>
            </div>
          </div>

          {/* Repayment Verdict Banner */}
          {repayment && (
            <div className={`rounded-2xl border p-5 ${currentStyle.bg} mb-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentStyle.badge}`}>
                    {currentStyle.title}
                  </span>
                  <span className="text-xs font-bold">
                    EMI / Income Ratio: {Math.round(repayment.ratio * 100)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs block text-gray-600">Calculated Monthly EMI</span>
                  <span className="text-2xl font-black text-gray-900">
                    ₹{Number(repayment.emi).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-gray-500"> / month</span>
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed font-medium">{currentStyle.desc}</p>
            </div>
          )}

          {/* Key Repayment Parameters Grid */}
          {repayment && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 rounded-2xl p-4 text-xs mb-6">
              <div>
                <span className="text-gray-500 block">Safe Max Monthly EMI</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(repayment.safe_max_emi).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Safe Loan Cap (this tenure)</span>
                <span className="font-bold text-emerald-700 text-sm">₹{Number(repayment.safe_max_loan).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Net Household Disposable</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(repayment.disposable_income).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Expected Business Net</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(repayment.business_net).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* What to Improve List */}
          {repayment?.suggestions && repayment.suggestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200">
              <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-brand-600" /> Actionable Suggestions to Improve Loan Safety:
              </h4>
              <ul className="space-y-1.5 text-xs text-brand-800">
                {repayment.suggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-600 font-bold">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Plain-Language Explainer Box */}
        {aiExp && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold mb-4">
              <Bot className="w-3.5 h-3.5 text-amber-700" /> AI Plain-Language Explanation
            </div>

            <p className="text-sm text-gray-800 font-medium leading-relaxed mb-4">
              "{aiExp.summary}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Key Highlights:</h4>
                <ul className="space-y-1.5 text-gray-600">
                  {aiExp.why?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Recommended Next Steps:</h4>
                <ul className="space-y-1.5 text-gray-600">
                  {aiExp.next_steps?.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Required Documents & Application Process */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" /> Required Application Documents
            </h3>
            <ul className="space-y-2 text-xs text-gray-700">
              {scheme.documents_required?.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600" /> How to Apply
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
              {scheme.how_to_apply}
            </p>
            <div className="mt-6">
              <Link
                to="/advisor"
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Bot className="w-4 h-4" /> Ask AI Advisor About This Scheme
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetail;
