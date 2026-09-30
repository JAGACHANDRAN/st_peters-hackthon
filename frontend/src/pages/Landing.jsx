import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calculator,
  HeartHandshake,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle,
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 py-16 sm:py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 text-brand-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Designed for Rural Women Entrepreneurs Across India
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Turn Your Business Dream Into Reality with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-700">
              Safe, Smart Finance
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover government loan schemes you qualify for, calculate safe monthly EMIs that protect your family, and build savings with simple AI guidance.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-600/20 transition flex items-center justify-center gap-2"
            >
              Create Your Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-gray-800 rounded-2xl font-bold text-base border border-gray-200 shadow-sm transition"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-brand-600" /> 100% Free & Impartial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-brand-600" /> No Bank Agents or Middlemen
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-brand-600" /> Simple Words & Low-Literacy Friendly
            </span>
          </div>
        </div>
      </section>

      {/* Empowerment Spotlight */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-800 to-emerald-950 rounded-3xl text-white p-8 sm:p-12 shadow-xl overflow-hidden relative">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-brand-200 mb-4">
                <Users className="w-3.5 h-3.5" /> Economic Self-Reliance
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 leading-snug">
                Empowering Rural Micro-Enterprises Across India
              </h2>
              <p className="text-brand-100 text-sm sm:text-base leading-relaxed mb-6">
                Whether you want to start a dairy farm, expand a tailoring shop, open a village grocery store, or invest in food processing, this platform helps you discover collateral-free government credit and calculates a safe monthly EMI so your household never faces debt distress.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur border border-white/10">
                  <span className="text-brand-300 text-xs block font-medium">Supported Enterprises</span>
                  <span className="text-lg font-bold">Dairy, Agri, Retail, Craft</span>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur border border-white/10">
                  <span className="text-brand-300 text-xs block font-medium">Calculations</span>
                  <span className="text-lg font-bold">Safe Cash-Flow Math</span>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur border border-white/10">
                  <span className="text-brand-300 text-xs block font-medium">Scheme Matching</span>
                  <span className="text-lg font-bold">Central & State Schemes</span>
                </div>
              </div>
              <p className="text-xs text-brand-200/90 leading-relaxed italic">
                "We provide clear reasons for every scheme recommendation and tell you exactly how much loan your monthly cash flow can safely support."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Four Tools to Safeguard Your Financial Journey
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Engineered with strict mathematical rigor and explainable AI to ensure you never fall into debt traps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Scheme Matching</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Checks real rules for MUDRA, Stand-Up India, NABARD, and State SHG schemes with explicit reasons for every match.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Repayment Check</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Calculates safe maximum EMI considering your seasonal income, living costs, and business gestation haircut.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Plain-Language AI</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Explains loan terms and next steps in simple village English without banking jargon or false promises.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Demo Savings Wallet</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Practice simulated deposits to your enterprise goals with real state machine tracking and retry handling.
            </p>
          </div>
        </div>
      </section>

      {/* Mandatory Disclaimer Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 space-y-2">
          <p className="font-semibold text-gray-700">
            Guidance only. Final eligibility, interest rate and approval are decided by the bank or scheme authority.
          </p>
          <p>
            Finance Empowerment Platform &copy; 2026. Dedicated to advancing economic self-reliance for women entrepreneurs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
