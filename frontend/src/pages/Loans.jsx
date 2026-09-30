import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { schemesApi } from '../api/schemes';
import { eligibilityApi } from '../api/eligibility';
import SchemeCard from '../components/SchemeCard';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import {
  Sparkles,
  Sliders,
  Filter,
  ShieldAlert,
  Search,
  CheckCircle,
} from 'lucide-react';

const PURPOSES = ['all', 'dairy', 'retail', 'tailoring', 'agri', 'food_processing', 'handicraft'];

const Loans = () => {
  const [searchParams] = useSearchParams();

  const [schemes, setSchemes] = useState([]);
  const [eligibilityResults, setEligibilityResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  // Filters & Parameters
  const [purpose, setPurpose] = useState('all');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('all');
  const [requestedAmount, setRequestedAmount] = useState(50000);
  const [tenureMonths, setTenureMonths] = useState(24);

  const fetchSchemesAndEligibility = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch schemes based on query
      const params = {};
      if (purpose !== 'all') params.purpose = purpose;
      if (stateFilter !== 'ALL') params.state = stateFilter;
      if (levelFilter !== 'all') params.level = levelFilter;

      const schemesData = await schemesApi.list(params);
      setSchemes(schemesData || []);

      // 2. Run batch eligibility check
      setEvaluating(true);
      const eligData = await eligibilityApi.check(requestedAmount, tenureMonths).catch(() => ({ results: [] }));
      const mapping = {};
      (eligData.results || []).forEach((item) => {
        mapping[item.scheme_id] = item;
      });
      setEligibilityResults(mapping);
    } catch (err) {
      console.error('Failed to load schemes:', err);
      setError('Unable to load loan schemes. Please check your network or try again.');
    } finally {
      setLoading(false);
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchSchemesAndEligibility();
  }, [purpose, stateFilter, levelFilter]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const eligData = await eligibilityApi.check(requestedAmount, tenureMonths);
      const mapping = {};
      (eligData.results || []).forEach((item) => {
        mapping[item.scheme_id] = item;
      });
      setEligibilityResults(mapping);
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Government & Bank Schemes
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Loan Scheme Finder & Matcher
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            Compare verified central and state schemes (MUDRA, DAY-NRLM, Stand-Up India, NABARD, Mission Shakti) against your financial profile.
          </p>
        </div>

        {/* Mandatory Official Guidance Disclaimer */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Important Guidance Notice:</span>
            <span>
              Guidance only. Final eligibility, interest rate and approval are decided by the bank or scheme authority.
            </span>
          </div>
        </div>

        {/* Loan Calculator Bar */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" /> Test Loan Amount & Tenure
            </h2>
            <button
              onClick={handleRunEvaluation}
              disabled={evaluating}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {evaluating ? 'Updating Verdicts...' : 'Recalculate All'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Requested Borrowing Amount</span>
                <span className="text-brand-700 text-sm font-bold">
                  ₹{Number(requestedAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="5000"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>₹10,000 (Micro)</span>
                <span>₹1,00,000</span>
                <span>₹2,00,000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Repayment Tenure</span>
                <span className="text-brand-700 text-sm font-bold">{tenureMonths} Months</span>
              </div>
              <input
                type="range"
                min="12"
                max="60"
                step="6"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>12 Months (1 yr)</span>
                <span>36 Months (3 yrs)</span>
                <span>60 Months (5 yrs)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mr-2">
            <Filter className="w-4 h-4 text-gray-400" /> Filters:
          </div>

          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 outline-none"
          >
            <option value="all">All Purposes</option>
            <option value="dairy">Dairy Enterprise</option>
            <option value="retail">Grocery / Retail</option>
            <option value="tailoring">Tailoring</option>
            <option value="agri">Agriculture</option>
            <option value="food_processing">Food Processing</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 outline-none"
          >
            <option value="ALL">All States / Central</option>
            <option value="Odisha">Odisha</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 outline-none"
          >
            <option value="all">All Levels</option>
            <option value="central">Central Govt</option>
            <option value="state">State Govt</option>
            <option value="bank">Bank / MFI</option>
          </select>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {loading ? (
          <div className="py-12">
            <Loader message="Evaluating matching schemes..." />
          </div>
        ) : schemes.length === 0 ? (
          <EmptyState
            title="No schemes matched your filters"
            description="Try changing the purpose or state filters to view available loan opportunities."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((s) => (
              <SchemeCard
                key={s.id || s._id}
                scheme={s}
                eligibilityResult={eligibilityResults[s.id || s._id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
