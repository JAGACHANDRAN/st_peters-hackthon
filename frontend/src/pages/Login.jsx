import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBox from '../components/ErrorBox';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your mobile number or email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      if (!user.onboarding_complete) {
        navigate('/onboarding');
      } else {
        const dest = location.state?.from?.pathname || '/dashboard';
        navigate(dest);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials or register a new account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAdmin = async () => {
    setIdentifier('admin@finance.gov.in');
    setPassword('Admin@123');
    setError('');
    setSubmitting(true);
    try {
      await login('admin@finance.gov.in', 'Admin@123');
      navigate('/admin/schemes');
    } catch (err) {
      setError('Failed to login as Admin: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md mb-3">
            ₹
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          <p className="text-xs text-gray-500 mt-1">
            Access your financial dashboard, loan matches, and savings goals
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBox message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Mobile Number or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your phone or email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500 space-y-2">
          <div>
            New entrepreneur?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="text-[11px] text-gray-400 hover:text-purple-700 font-medium"
            >
              Platform Administrator Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
