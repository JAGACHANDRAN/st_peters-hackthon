import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api/profile';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import {
  User,
  Users,
  Wallet,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Personal & Location', icon: User },
  { id: 2, title: 'Household & SHG', icon: Users },
  { id: 3, title: 'Income & Expenses', icon: Wallet },
  { id: 4, title: 'Business Enterprise', icon: Briefcase },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat',
  'Haryana', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

const Onboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    age: '',
    gender: 'female',
    state: '',
    district: '',
    area: 'rural',
    social_category: 'general',
    education_level: 'secondary',
    marital_status: 'married',
    dependents: 0,
    is_shg_member: false,
    shg_name: '',
    shg_tenure_months: 0,
    has_bank_account: true,
    has_aadhaar: true,
    has_pan: false,
    has_land_or_assets: false,
    asset_value: 0,
    monthly_income: '',
    income_stability: 'regular',
    monthly_household_expense: '',
    monthly_other_expense: '',
    existing_loans: [],
    has_default_history: false,
    credit_score: '',
    business: {
      type: 'dairy',
      stage: 'idea',
      is_new_business: true,
      is_micro_enterprise: true,
      required_amount: '',
      own_contribution: '',
      expected_monthly_revenue: '',
      expected_monthly_cost: '',
    },
  });

  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        if (data && data.age && data.age > 0 && data.state) {
          setFormData((prev) => ({
            ...prev,
            ...data,
            credit_score: data.credit_score !== null && data.credit_score !== undefined ? data.credit_score : '',
            shg_name: data.shg_name || '',
            business: { ...prev.business, ...(data.business || {}) },
          }));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExistingProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      business: { ...prev.business, [field]: value },
    }));
  };

  const addExistingLoan = () => {
    setFormData((prev) => ({
      ...prev,
      existing_loans: [
        ...prev.existing_loans,
        { lender: '', outstanding: 0, monthly_emi: 0, remaining_months: 12 },
      ],
    }));
  };

  const removeExistingLoan = (index) => {
    setFormData((prev) => ({
      ...prev,
      existing_loans: prev.existing_loans.filter((_, i) => i !== index),
    }));
  };

  const updateLoanField = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.existing_loans];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, existing_loans: updated };
    });
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.state || !formData.district || !formData.age || formData.age < 18) {
        setError('Please check: enter your age (at least 18), state, and district.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (formData.monthly_income === '' || formData.monthly_income < 0) {
        setError('Please enter your monthly household income.');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.business.required_amount || formData.business.required_amount < 1000) {
        setError('Please specify the required loan amount for your enterprise (min ₹1,000).');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmitProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const formatted = {
        ...formData,
        age: parseInt(formData.age, 10) || 25,
        dependents: parseInt(formData.dependents, 10) || 0,
        asset_value: parseFloat(formData.asset_value) || 0,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        monthly_household_expense: parseFloat(formData.monthly_household_expense) || 0,
        monthly_other_expense: parseFloat(formData.monthly_other_expense) || 0,
        shg_tenure_months: parseInt(formData.shg_tenure_months, 10) || 0,
        credit_score: (formData.credit_score !== '' && formData.credit_score !== null && !isNaN(formData.credit_score))
          ? parseInt(formData.credit_score, 10)
          : null,
        shg_name: formData.shg_name ? formData.shg_name.trim() : null,
        existing_loans: (formData.existing_loans || []).map((l) => ({
          lender: l.lender || 'Bank/MFI',
          outstanding: parseFloat(l.outstanding) || 0,
          monthly_emi: parseFloat(l.monthly_emi) || 0,
          remaining_months: parseInt(l.remaining_months, 10) || 12,
        })),
        business: {
          ...formData.business,
          required_amount: parseFloat(formData.business?.required_amount) || 0,
          own_contribution: parseFloat(formData.business?.own_contribution) || 0,
          expected_monthly_revenue: parseFloat(formData.business?.expected_monthly_revenue) || 0,
          expected_monthly_cost: parseFloat(formData.business?.expected_monthly_cost) || 0,
        },
      };

      await profileApi.updateProfile(formatted);
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg || d).join(', ')
        : (detail || 'Failed to save financial profile. Please try again.');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading your financial profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Welcome, {user?.name || 'Entrepreneur'}!
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Set Up Your Financial Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl mx-auto">
            Fill in your household and business details so we can match you with eligible government schemes and calculate your safe loan limit.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-4 gap-2 text-center">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isDone = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition mb-1 ${
                      isDone
                        ? 'bg-brand-600 text-white'
                        : isCurrent
                        ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold truncate max-w-full ${
                      isCurrent ? 'text-brand-700 font-bold' : isDone ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-brand-600 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {/* STEP 1: Personal & Location */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-600" /> Step 1: Personal & Location Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Age (Years) *</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    placeholder="e.g. 28"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State of Residence *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  >
                    <option value="">-- Select Your State --</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    placeholder="Enter your district name"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Area Type *</label>
                  <select
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="rural">Rural (Village / Gram Panchayat)</option>
                    <option value="semi_urban">Semi-Urban (Town / Taluk)</option>
                    <option value="urban">Urban (City)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Social Category *</label>
                  <select
                    value={formData.social_category}
                    onChange={(e) => handleChange('social_category', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="general">General</option>
                    <option value="obc">OBC (Other Backward Class)</option>
                    <option value="sc">SC (Scheduled Caste)</option>
                    <option value="st">ST (Scheduled Tribe)</option>
                    <option value="minority">Minority</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Household & SHG */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" /> Step 2: Household & SHG Group Membership
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Marital Status</label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => handleChange('marital_status', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="married">Married</option>
                    <option value="single">Single / Unmarried</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced / Separated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Dependents</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formData.dependents}
                    onChange={(e) => handleChange('dependents', parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* SHG Section */}
              <div className="bg-brand-50/60 border border-brand-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-brand-900">
                    Are you a member of any Self-Help Group (SHG)?
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_shg_member}
                      onChange={(e) => handleChange('is_shg_member', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {formData.is_shg_member && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-brand-200/60">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">SHG Name</label>
                      <input
                        type="text"
                        value={formData.shg_name || ''}
                        onChange={(e) => handleChange('shg_name', e.target.value)}
                        placeholder="e.g. Mahila Shakti SHG"
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-sm bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Membership Duration (Months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 12"
                        value={formData.shg_tenure_months || ''}
                        onChange={(e) => handleChange('shg_tenure_months', parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-sm bg-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Documents & Bank Account */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_bank_account}
                    onChange={(e) => handleChange('has_bank_account', e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span className="text-xs font-semibold text-gray-800">Bank Account</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_aadhaar}
                    onChange={(e) => handleChange('has_aadhaar', e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span className="text-xs font-semibold text-gray-800">Aadhaar Card</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_pan}
                    onChange={(e) => handleChange('has_pan', e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span className="text-xs font-semibold text-gray-800">PAN Card</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Income & Living Expenses */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-600" /> Step 3: Monthly Household Income & Expenses
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monthly Household Income (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 10000"
                    value={formData.monthly_income}
                    onChange={(e) => handleChange('monthly_income', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Income Stability *</label>
                  <select
                    value={formData.income_stability}
                    onChange={(e) => handleChange('income_stability', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="regular">Regular (Daily shop, regular sales, steady income)</option>
                    <option value="seasonal">Seasonal (Farming, harvest cycles)</option>
                    <option value="irregular">Irregular (Variable daily wage / casual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monthly Household Living Expenses (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 6000 (food, school, utilities)"
                    value={formData.monthly_household_expense}
                    onChange={(e) => handleChange('monthly_household_expense', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Other Expenses / Medical (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="200"
                    placeholder="e.g. 1000"
                    value={formData.monthly_other_expense}
                    onChange={(e) => handleChange('monthly_other_expense', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Past Default Check */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Any Past Unresolved Loan Defaults?
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Leave unchecked if you have never defaulted on a loan.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.has_default_history}
                  onChange={(e) => handleChange('has_default_history', e.target.checked)}
                  className="w-5 h-5 text-rose-600 rounded"
                />
              </div>

              {/* Existing Loans Section */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Existing Loans & Ongoing EMIs
                    </h4>
                    <p className="text-[11px] text-gray-500">Add any existing active loans if applicable</p>
                  </div>
                  <button
                    type="button"
                    onClick={addExistingLoan}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Loan
                  </button>
                </div>

                {formData.existing_loans.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No existing loans recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.existing_loans.map((loan, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl items-center text-xs"
                      >
                        <input
                          type="text"
                          placeholder="Lender Name"
                          value={loan.lender}
                          onChange={(e) => updateLoanField(idx, 'lender', e.target.value)}
                          className="p-2 border rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Outstanding (₹)"
                          value={loan.outstanding || ''}
                          onChange={(e) =>
                            updateLoanField(idx, 'outstanding', parseFloat(e.target.value) || 0)
                          }
                          className="p-2 border rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Monthly EMI (₹)"
                          value={loan.monthly_emi || ''}
                          onChange={(e) =>
                            updateLoanField(idx, 'monthly_emi', parseFloat(e.target.value) || 0)
                          }
                          className="p-2 border rounded-lg bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Months Left"
                            value={loan.remaining_months || ''}
                            onChange={(e) =>
                              updateLoanField(idx, 'remaining_months', parseInt(e.target.value) || 0)
                            }
                            className="p-2 border rounded-lg bg-white w-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingLoan(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Business Enterprise & Loan Goal */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-600" /> Step 4: Business Enterprise & Required Loan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business Activity *</label>
                  <select
                    value={formData.business.type}
                    onChange={(e) => handleBusinessChange('type', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="dairy">Dairy Farming & Milk Sales</option>
                    <option value="tailoring">Tailoring & Garments</option>
                    <option value="retail">Grocery / Kirana Retail Shop</option>
                    <option value="agri">Agriculture & Crop Allied</option>
                    <option value="food_processing">Food Processing / Snacks / Pickle</option>
                    <option value="handicraft">Handicrafts & Weaving</option>
                    <option value="other">Other Micro Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business Stage *</label>
                  <select
                    value={formData.business.stage}
                    onChange={(e) => handleBusinessChange('stage', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="idea">Idea Stage (Planning to start)</option>
                    <option value="new">New Enterprise (Under 1 year)</option>
                    <option value="running">Existing Running Business (1+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Required Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    placeholder="e.g. 50000"
                    value={formData.business.required_amount}
                    onChange={(e) => handleBusinessChange('required_amount', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Own Savings Contribution (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 10000"
                    value={formData.business.own_contribution}
                    onChange={(e) => handleBusinessChange('own_contribution', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expected Monthly Business Revenue (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 6000"
                    value={formData.business.expected_monthly_revenue}
                    onChange={(e) => handleBusinessChange('expected_monthly_revenue', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expected Monthly Business Running Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 2000 (materials, feed, transport)"
                    value={formData.business.expected_monthly_cost}
                    onChange={(e) => handleBusinessChange('expected_monthly_cost', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition flex items-center gap-2"
            >
              {saving
                ? 'Saving Profile...'
                : currentStep === 4
                ? 'Complete & Go to Dashboard'
                : 'Next Step'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
