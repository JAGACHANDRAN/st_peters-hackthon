import React, { useState, useEffect } from 'react';
import { budgetApi } from '../api/budget';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import {
  PieChart as PieIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

const COLORS = ['#16a34a', '#0284c7', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#64748b'];

const DEFAULT_EXPENSES = [
  { category: 'Food & Groceries', amount: 3500 },
  { category: 'Children Schooling', amount: 1500 },
  { category: 'Health & Emergencies', amount: 1000 },
];

const Budget = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const [month, setMonth] = useState('2026-09');
  const [income, setIncome] = useState(8000);
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const data = await budgetApi.getLatest();
        if (data) {
          setMonth(data.month || '2026-09');
          setIncome(data.income || 8000);
          if (data.expenses && data.expenses.length > 0) {
            setExpenses(data.expenses);
          }
        }
      } catch (err) {
        console.error('Failed to load budget:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBudget();
  }, []);

  const addExpenseItem = () => {
    setExpenses([...expenses, { category: '', amount: 0 }]);
  };

  const removeExpenseItem = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index, field, value) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    setError('');
    setSavedSuccess(false);
    try {
      await budgetApi.save({
        month,
        income: parseFloat(income) || 0,
        expenses: expenses.map((e) => ({
          category: e.category || 'Other',
          amount: parseFloat(e.amount) || 0,
        })),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const remaining = (parseFloat(income) || 0) - totalExpense;
  const suggestedSavings = remaining > 0 ? Math.round(remaining * 0.22) : 0;

  // Chart data
  const chartData = expenses
    .filter((e) => (parseFloat(e.amount) || 0) > 0)
    .map((e) => ({
      name: e.category || 'General',
      value: parseFloat(e.amount) || 0,
    }));

  if (remaining > 0) {
    chartData.push({
      name: 'Surplus Cash',
      value: remaining,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading monthly budget..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-2">
              <PieIcon className="w-3.5 h-3.5" /> Monthly Financial Balance
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Household Budget & Expense Split
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tracking your income and living expenses helps keep your business loans safe from default.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 outline-none"
            />
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Budget saved successfully! Your suggested savings have been updated.
          </div>
        )}

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Monthly Income</span>
            <h3 className="text-xl font-bold text-gray-900 mt-1">₹{Number(income).toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Total Expenses</span>
            <h3 className="text-xl font-bold text-rose-600 mt-1">₹{Number(totalExpense).toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Remaining Surplus</span>
            <h3 className={`text-xl font-bold mt-1 ${remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{Number(remaining).toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="bg-brand-50 p-5 rounded-2xl border border-brand-200 shadow-sm">
            <span className="text-xs text-brand-800 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Suggested Savings (22%)
            </span>
            <h3 className="text-xl font-bold text-brand-700 mt-1">
              ₹{Number(suggestedSavings).toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Main Grid: Inputs + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Inputs (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Monthly Total Household Income (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={income}
                onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                className="w-full p-3 rounded-xl border border-gray-300 text-base font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Monthly Living Expenses
                </h3>
                <button
                  type="button"
                  onClick={addExpenseItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>

              <div className="space-y-3">
                {expenses.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category (e.g. Food)"
                      value={item.category}
                      onChange={(e) => updateExpense(idx, 'category', e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 outline-none focus:border-brand-500"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Amount"
                        value={item.amount || ''}
                        onChange={(e) => updateExpense(idx, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 outline-none focus:border-brand-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExpenseItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Remove category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Visual Pie Chart (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">
                Visual Expense Breakdown
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                See where your money goes every month and plan your business buffer.
              </p>

              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No expense data to chart.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 leading-relaxed">
              💡 <strong>Smart Rule:</strong> Never commit more than 50% of your remaining surplus (₹{Number(Math.max(0, remaining * 0.5)).toLocaleString('en-IN')}) towards monthly loan EMIs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
