import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Save,
  X,
  Calendar,
} from 'lucide-react';

const AdminSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    short_name: '',
    provider: '',
    level: 'central',
    applicable_states: ['ALL'],
    purpose: ['business', 'dairy'],
    description: '',
    loan_min: 10000,
    loan_max: 500000,
    interest_rate_min: 8.5,
    interest_rate_max: 11.5,
    interest_subvention: '',
    collateral_required: false,
    tenure_months_min: 12,
    tenure_months_max: 60,
    processing_fee_note: '',
    eligibility: {
      genders: ['female'],
      min_age: 18,
      max_age: 65,
      categories: ['general', 'obc', 'sc', 'st', 'minority'],
      areas: ['rural', 'semi_urban', 'urban'],
      requires_shg_membership: false,
      min_shg_tenure_months: 0,
      requires_bank_account: true,
      requires_aadhaar: true,
      allows_existing_default: false,
      new_business_allowed: true,
      existing_business_required: false,
    },
    documents_required: ['Aadhaar Card', 'Bank Passbook'],
    how_to_apply: 'Apply through nearest commercial bank.',
    source_url: 'https://www.mudra.org.in/',
    last_verified: null,
    is_active: true,
  });

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSchemes();
      setSchemes(data || []);
    } catch (err) {
      setError('Failed to load schemes for administration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleOpenAdd = () => {
    setEditingScheme(null);
    setForm({
      name: '',
      short_name: '',
      provider: '',
      level: 'central',
      applicable_states: ['ALL'],
      purpose: ['business', 'dairy'],
      description: '',
      loan_min: 10000,
      loan_max: 500000,
      interest_rate_min: 8.5,
      interest_rate_max: 11.5,
      interest_subvention: '',
      collateral_required: false,
      tenure_months_min: 12,
      tenure_months_max: 60,
      processing_fee_note: '',
      eligibility: {
        genders: ['female'],
        min_age: 18,
        max_age: 65,
        categories: ['general', 'obc', 'sc', 'st', 'minority'],
        areas: ['rural', 'semi_urban', 'urban'],
        requires_shg_membership: false,
        min_shg_tenure_months: 0,
        requires_bank_account: true,
        requires_aadhaar: true,
        allows_existing_default: false,
        new_business_allowed: true,
        existing_business_required: false,
      },
      documents_required: ['Aadhaar Card', 'Bank Passbook'],
      how_to_apply: 'Apply through nearest commercial bank.',
      source_url: 'https://www.mudra.org.in/',
      last_verified: null,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingScheme(s);
    setForm({
      ...s,
      eligibility: {
        ...s.eligibility,
      },
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) return;
    try {
      await adminApi.deleteScheme(id);
      fetchSchemes();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingScheme) {
        await adminApi.updateScheme(editingScheme.id || editingScheme._id, form);
      } else {
        await adminApi.createScheme(form);
      }
      setShowModal(false);
      fetchSchemes();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader message="Loading scheme management console..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" /> Administrator Console
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Loan Scheme & Rules Manager
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Add, update, and verify government schemes and deterministic eligibility rules.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Scheme
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {/* Schemes Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Scheme Name</th>
                  <th className="py-3 px-4">Provider / Level</th>
                  <th className="py-3 px-4">Loan Limits</th>
                  <th className="py-3 px-4">Interest Rate</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schemes.map((s) => (
                  <tr key={s.id || s._id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-4 font-bold text-gray-900 max-w-xs">
                      <div>{s.name}</div>
                      <span className="text-[10px] text-gray-400 font-normal">{s.short_name}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div>{s.provider}</div>
                      <span className="text-[10px] uppercase font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                        {s.level}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      ₹{Number(s.loan_min).toLocaleString('en-IN')} - ₹{Number(s.loan_max).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-brand-700 font-bold">
                      {s.interest_rate_min}%{s.interest_rate_max ? ` - ${s.interest_rate_max}%` : ''}
                    </td>
                    <td className="py-4 px-4">
                      {s.last_verified ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Not Verified
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit scheme"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id || s._id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete scheme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Add / Edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingScheme ? 'Edit Loan Scheme' : 'Add New Government Scheme'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Scheme Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-2 border rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Short Name *</label>
                    <input
                      type="text"
                      value={form.short_name}
                      onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                      className="w-full p-2 border rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Provider *</label>
                    <input
                      type="text"
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value })}
                      className="w-full p-2 border rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Level *</label>
                    <select
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                      className="w-full p-2 border rounded-xl"
                    >
                      <option value="central">Central</option>
                      <option value="state">State</option>
                      <option value="bank">Bank</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Description *</label>
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Min Loan (₹)</label>
                    <input
                      type="number"
                      value={form.loan_min}
                      onChange={(e) => setForm({ ...form, loan_min: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Max Loan (₹)</label>
                    <input
                      type="number"
                      value={form.loan_max}
                      onChange={(e) => setForm({ ...form, loan_max: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Min Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.interest_rate_min}
                      onChange={(e) =>
                        setForm({ ...form, interest_rate_min: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Max Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.interest_rate_max || ''}
                      onChange={(e) =>
                        setForm({ ...form, interest_rate_max: parseFloat(e.target.value) || null })
                      }
                      className="w-full p-2 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Eligibility toggles */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="font-bold text-gray-900 block">Eligibility Rules</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.eligibility.requires_shg_membership}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            eligibility: {
                              ...form.eligibility,
                              requires_shg_membership: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Requires SHG Membership</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.eligibility.allows_existing_default}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            eligibility: {
                              ...form.eligibility,
                              allows_existing_default: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Allows Past Default</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <span>Scheme Is Active in Finder</span>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Scheme'}
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

export default AdminSchemes;
