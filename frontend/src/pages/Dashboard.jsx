import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api/profile';
import { budgetApi } from '../api/budget';
import { goalsApi } from '../api/goals';
import { eligibilityApi } from '../api/eligibility';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import {
  Wallet,
  Calculator,
  Target,
  Sparkles,
  Bot,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
  Plus,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [budget, setBudget] = useState(null);
  const [goals, setGoals] = useState([]);
  const [eligibilityMatches, setEligibilityMatches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profData, budData, goalsData] = await Promise.all([
          profileApi.getProfile(),
          budgetApi.getLatest().catch(() => null),
          goalsApi.list().catch(() => []),
        ]);

        setProfile(profData);
        setBudget(budData);
        setGoals(goalsData || []);

        const targetAmount = profData?.business?.required_amount || 50000;
        const eligData = await eligibilityApi.check(targetAmount, 24).catch(() => ({ results: [] }));
        setEligibilityMatches(eligData.results || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading your personalized dashboard..." size="lg" />
      </div>
    );
  }

  const primaryGoal = goals.length > 0 ? goals[0] : null;

  const monthlyIncome = profile?.monthly_income || 0;
  const householdExpense = profile?.monthly_household_expense || 0;
  const otherExpense = profile?.monthly_other_expense || 0;
  const disposable = monthlyIncome - householdExpense - otherExpense;

  const topMatch = eligibilityMatches[0];
  const safeMaxEmi = topMatch?.repayment?.safe_max_emi || Math.max(0, Math.round(disposable * 0.5));
  const safeMaxLoan = topMatch?.repayment?.safe_max_loan || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-emerald-800 to-brand-900 text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs text-brand-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-300" />
              {profile?.is_shg_member ? `SHG Member (${profile.shg_name || 'Active Group'})` : 'Independent Entrepreneur'} • {profile?.district ? `${profile.district}, ` : ''}{profile?.state || 'India'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Namaste, {user?.name || 'Entrepreneur'}!
            </h1>
            <p className="text-xs sm:text-sm text-brand-100 mt-1 max-w-xl">
              Business: {profile?.business?.type ? profile.business.type.toUpperCase() : 'Micro Enterprise'} {profile?.business?.required_amount ? `(Target Loan: ₹${Number(profile.business.required_amount).toLocaleString('en-IN')})` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/loans"
              className="px-4 py-2.5 bg-white text-brand-900 hover:bg-brand-50 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-brand-600" /> Find Loan Schemes
            </Link>
            <Link
              to="/advisor"
              className="px-4 py-2.5 bg-brand-800/80 hover:bg-brand-800 text-white border border-brand-500/50 rounded-xl font-medium text-xs transition flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-brand-200" /> Ask AI Advisor
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Monthly Household Income"
            value={`₹${Number(monthlyIncome).toLocaleString('en-IN')}`}
            subtitle={`${profile?.income_stability || 'Regular'} stability`}
            icon={Wallet}
            color="emerald"
          />
          <StatCard
            title="Net Cash Surplus"
            value={`₹${Number(disposable).toLocaleString('en-IN')}`}
            subtitle="Income after essentials"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Safe Maximum Monthly EMI"
            value={`₹${Number(safeMaxEmi).toLocaleString('en-IN')}`}
            subtitle={safeMaxLoan > 0 ? `Safe borrowing ~₹${Number(safeMaxLoan).toLocaleString('en-IN')}` : 'Based on cash flow'}
            icon={Calculator}
            color="amber"
          />
          <StatCard
            title="Savings Goal Balance"
            value={primaryGoal ? `₹${Number(primaryGoal.saved_amount).toLocaleString('en-IN')}` : '₹0'}
            subtitle={primaryGoal ? `Target: ₹${Number(primaryGoal.target_amount).toLocaleString('en-IN')}` : 'No active goal'}
            icon={Target}
            color="purple"
          />
        </div>

        {/* Middle Two-Column Grid: Savings Goal & Budget Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Savings Goal Widget */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Primary Enterprise Goal
                </span>
                <Link to="/goals" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Manage Goals
                </Link>
              </div>

              {primaryGoal ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xl">
                      🎯
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{primaryGoal.name}</h3>
                      <p className="text-xs text-gray-500">Target Date: {primaryGoal.deadline || 'Ongoing'}</p>
                    </div>
                  </div>

                  <ProgressBar
                    current={primaryGoal.saved_amount}
                    target={primaryGoal.target_amount}
                    label="Goal Completion"
                    color="brand"
                  />
                </>
              ) : (
                <div className="py-6 text-center text-xs text-gray-500">
                  <p className="font-semibold text-gray-700 mb-1">No savings goal set yet</p>
                  <p className="mb-4">Create a goal to start saving for equipment, inventory, or emergency reserves.</p>
                  <Link
                    to="/goals"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-xl font-bold"
                  >
                    <Plus className="w-4 h-4" /> Create Goal
                  </Link>
                </div>
              )}
            </div>

            {primaryGoal && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Monthly: ₹{Number(primaryGoal.monthly_contribution || 0).toLocaleString('en-IN')}
                </span>
                <Link
                  to={`/payments?goal_id=${primaryGoal.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Deposit Demo Savings
                </Link>
              </div>
            )}
          </div>

          {/* Budget Overview Widget */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Monthly Cash Flow
                </span>
                <Link to="/budget" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Edit Budget
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Total Monthly Income</span>
                  <span className="font-semibold text-gray-900">₹{Number(monthlyIncome).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Household Living Expenses</span>
                  <span className="font-semibold text-rose-600">- ₹{Number(householdExpense).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Other Discretionary Expenses</span>
                  <span className="font-semibold text-rose-600">- ₹{Number(otherExpense).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 bg-brand-50/60 p-2.5 rounded-xl font-bold">
                  <span className="text-brand-900">Suggested Monthly Savings</span>
                  <span className="text-brand-700">₹{Number(budget?.suggested_savings || Math.max(0, Math.round(disposable * 0.22))).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              💡 Maintaining a savings buffer ensures you never default on unexpected bad weather days.
            </div>
          </div>

          {/* AI Advisor Tip Widget */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold mb-3">
                <Bot className="w-3.5 h-3.5" /> AI Financial Guide Tip
              </div>
              <h3 className="text-lg font-bold mb-2">Build Your Emergency Reserve</h3>
              <p className="text-xs text-amber-50 leading-relaxed">
                "{user?.name || 'Entrepreneur'}, keeping a 2-month emergency savings buffer protects your {profile?.business?.type || 'enterprise'} business from unexpected price fluctuations or seasonal dips."
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
              <Link
                to="/advisor"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-white text-amber-900 rounded-xl font-bold text-xs shadow transition hover:bg-amber-50"
              >
                Chat with AI Advisor <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Top Loan Scheme Matches Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recommended Loan Schemes</h2>
              <p className="text-xs text-gray-500">
                Matched against your income (₹{monthlyIncome.toLocaleString('en-IN')}) and {profile?.state || 'state'} guidelines
              </p>
            </div>
            <Link
              to="/loans"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Explore all schemes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {eligibilityMatches.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 text-xs text-gray-500">
              No matching loan schemes loaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibilityMatches.slice(0, 3).map((item) => (
                <div
                  key={item.scheme_id}
                  className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-brand-700 uppercase bg-brand-50 px-2 py-0.5 rounded">
                        {item.provider}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          item.verdict === 'ELIGIBLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.verdict === 'MAYBE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.verdict}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mb-1">{item.scheme_name}</h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {item.ai_explanation?.summary || 'Standard government micro-enterprise support.'}
                    </p>

                    <div className="bg-gray-50 rounded-xl p-3 text-xs mb-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimated EMI (24m)</span>
                        <span className="font-bold text-gray-900">₹{item.emi.toLocaleString('en-IN')}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Affordability Verdict</span>
                        <span
                          className={`font-semibold ${
                            item.repayment.verdict === 'COMFORTABLE'
                              ? 'text-emerald-700'
                              : item.repayment.verdict === 'TIGHT'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {item.repayment.verdict}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/loans/${item.scheme_id}`}
                    className="w-full py-2.5 bg-gray-50 hover:bg-brand-50 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                  >
                    Calculate Repayment <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
