import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentsApi } from '../api/payments';
import { goalsApi } from '../api/goals';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';

const Payments = () => {
  const [searchParams] = useSearchParams();
  const preselectedGoalId = searchParams.get('goal_id') || '';

  const [goals, setGoals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedGoalId, setSelectedGoalId] = useState(preselectedGoalId);
  const [amount, setAmount] = useState('1500');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Active Transaction State Machine tracker
  const [currentTxn, setCurrentTxn] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gData, pData] = await Promise.all([
        goalsApi.list().catch(() => []),
        paymentsApi.list().catch(() => []),
      ]);
      setGoals(gData || []);
      if (!selectedGoalId && gData && gData.length > 0) {
        setSelectedGoalId(gData[0].id);
      }
      setPayments(pData || []);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      setError('Unable to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please specify a positive deposit amount.');
      return;
    }

    setProcessing(true);
    setError('');
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      const txn = await paymentsApi.initiate({
        goal_id: selectedGoalId || null,
        amount: amt,
        type: 'SAVINGS_TRANSFER',
        destination: 'Demo Savings Goal Wallet',
        idempotency_key: idempotencyKey,
        simulate_failure: simulateFailure,
      });

      setCurrentTxn(txn);
      // Refresh transactions and goal balance
      const [updatedGoals, updatedPayments] = await Promise.all([
        goalsApi.list(),
        paymentsApi.list(),
      ]);
      setGoals(updatedGoals);
      setPayments(updatedPayments);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process demo payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setSimulateFailure(false);
    handleDeposit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading demo wallet and payment history..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-2">
            <Wallet className="w-3.5 h-3.5" /> Practice Banking
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Demo Savings Wallet
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            Simulate monthly transfers to your enterprise savings goals with live state-machine confirmation and failure resilience testing.
          </p>
        </div>

        {/* Mandatory Demo Disclaimer */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Demo Simulation Notice:</span>
            <p className="mt-0.5 font-medium">
              Demo transaction. A real balance must be confirmed with the bank.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {/* Main Grid: Form + Status Machine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-600" /> Initiate Demo Savings Deposit
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Destination Savings Goal
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Current: ₹{Number(g.saved_amount).toLocaleString('en-IN')})
                    </option>
                  ))}
                  {goals.length === 0 && <option value="">General Enterprise Wallet</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Deposit Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Simulate Failure Toggle */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Simulate Bank Payment Failure
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    Test how the platform safeguards your account if the bank gateway drops the transfer.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <button
                type="button"
                onClick={handleDeposit}
                disabled={processing}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 mt-4"
              >
                {processing ? 'Connecting to Simulated Gateway...' : 'Confirm Demo Deposit'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Status Card: 5 cols */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Transaction State Machine
              </h3>

              {currentTxn ? (
                <div className="space-y-4">
                  {/* Status Indicator */}
                  <div
                    className={`p-4 rounded-2xl border text-xs ${
                      currentTxn.status === 'SUCCESS'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {currentTxn.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <span>
                        Status: {currentTxn.status}
                      </span>
                    </div>

                    <p className="mt-1 leading-relaxed">
                      {currentTxn.status === 'SUCCESS'
                        ? `₹${Number(currentTxn.amount).toLocaleString('en-IN')} successfully verified and credited to your savings balance.`
                        : `Transfer failed: ${currentTxn.failure_reason || 'Gateway simulated rejection'}. Your goal balance was NOT changed.`}
                    </p>

                    {currentTxn.provider_ref && (
                      <div className="mt-2 text-[11px] text-gray-500">
                        Ref: {currentTxn.provider_ref}
                      </div>
                    )}

                    {currentTxn.status === 'FAILED' && (
                      <button
                        onClick={handleRetry}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Payment Without Failure
                      </button>
                    )}
                  </div>

                  {/* Flow Stages */}
                  <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2 border border-gray-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> 1. INITIATED (Idempotency checked)
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> 2. PENDING (Provider gateway called)
                    </div>
                    <div
                      className={`flex items-center gap-2 font-semibold ${
                        currentTxn.status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {currentTxn.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      3. {currentTxn.status} (Verified)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  Initiate a deposit on the left to see the live 3-stage verification flow.
                </div>
              )}
            </div>

            <div className="mt-4 text-[11px] text-gray-400 pt-3 border-t border-gray-100">
              🔒 Idempotent safety: Double clicks are prevented from duplicating transfers.
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Transaction History
            </h3>
            <span className="text-xs text-gray-500 font-medium">{payments.length} Records</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Provider Ref</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {p.created_at ? new Date(p.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{p.destination}</td>
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                        {p.provider_ref || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
