import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { goalsApi } from '../api/goals';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import {
  Target,
  Plus,
  PlusCircle,
  Calendar,
  CheckCircle,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    monthly_contribution: '',
    deadline: '',
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await goalsApi.list();
      setGoals(data || []);
    } catch (err) {
      setError('Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount) return;
    setCreating(true);
    try {
      await goalsApi.create({
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount) || 0,
        monthly_contribution: parseFloat(newGoal.monthly_contribution) || 0,
        deadline: newGoal.deadline || null,
      });
      setShowModal(false);
      setNewGoal({ name: '', target_amount: '', monthly_contribution: '', deadline: '' });
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create goal.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading savings goals..." />
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
              <Target className="w-3.5 h-3.5" /> Enterprise Savings Targets
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Savings Goals & Business Capital
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Building your own margin savings reduces how much you need to borrow and lowers interest costs.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Goal
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No savings goals created yet"
            description="Create your first goal, such as buying dairy cattle, sewing equipment, or an emergency buffer."
            actionLabel="Create Goal"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((g) => {
              const remainingAmt = Math.max(0, g.target_amount - g.saved_amount);
              const monthsToGoal =
                g.monthly_contribution > 0 ? Math.ceil(remainingAmt / g.monthly_contribution) : null;

              return (
                <div
                  key={g.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {g.status === 'completed' ? 'Achieved 🎉' : 'In Progress'}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{g.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Target Amount</span>
                        <span className="text-base font-bold text-gray-900">
                          ₹{Number(g.target_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="my-4">
                      <ProgressBar
                        current={g.saved_amount}
                        target={g.target_amount}
                        color="brand"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-2xl p-3 text-xs mb-4">
                      <div>
                        <span className="text-gray-500 block">Monthly Contribution</span>
                        <span className="font-semibold text-gray-900">
                          ₹{Number(g.monthly_contribution || 0).toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Estimated Time</span>
                        <span className="font-semibold text-brand-700">
                          {monthsToGoal ? `${monthsToGoal} months left` : 'Open-ended'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Deadline: {g.deadline || 'Flexible'}
                    </div>

                    <Link
                      to={`/payments?goal_id=${g.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Deposit Demo Funds
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Goal Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-1">Create Savings Target</h2>
              <p className="text-xs text-gray-500 mb-5">
                Set a specific milestone for your micro-enterprise
              </p>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy Cow Purchase & Feed Shed"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="e.g. 20000"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Planned Monthly Contribution (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    placeholder="e.g. 1500"
                    value={newGoal.monthly_contribution}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, monthly_contribution: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    {creating ? 'Saving...' : 'Create Savings Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
