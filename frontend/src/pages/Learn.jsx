import React, { useState } from 'react';
import { learnApi } from '../api/learn';
import Loader from '../components/Loader';
import {
  BookOpen,
  Sparkles,
  Bot,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  X,
} from 'lucide-react';

const LESSONS = [
  {
    id: 'emi',
    title: '1. What is an EMI?',
    summary:
      'An Equated Monthly Installment is a fixed amount you pay the bank every month. Part goes towards paying off your borrowed loan, and part covers interest.',
    keyRule: 'Keep total EMIs below 50% of your remaining monthly cash surplus.',
  },
  {
    id: 'cibil',
    title: '2. Why CIBIL / Credit Score Matters',
    summary:
      'Your credit score is like a school report card for how reliably you repay loans. Paying on or before the due date gives you a high score.',
    keyRule: 'A high score unlocks cheaper interest rates and larger future loans.',
  },
  {
    id: 'shg',
    title: '3. The Power of Self-Help Groups (SHGs)',
    summary:
      'A Self Help Group is 10 to 20 local women who save small money together. Banks trust SHGs and offer collateral-free group loans with government backing.',
    keyRule: 'Active SHG membership opens doors to subsidized schemes like DAY-NRLM.',
  },
  {
    id: 'interest_subvention',
    title: '4. What is Interest Subvention?',
    summary:
      'Interest subvention is a government discount. For example, if the bank charges 7% interest, the government pays 3%, so you only pay 4%.',
    keyRule: 'Subvention is only credited when you make timely monthly repayments.',
  },
  {
    id: 'collateral',
    title: '5. Collateral vs. Collateral-Free Loans',
    summary:
      'Collateral means pledging your house, land, or gold to the bank. Schemes like MUDRA offer collateral-free loans, so you do not risk losing your property.',
    keyRule: 'Always verify if a scheme requires collateral before signing papers.',
  },
  {
    id: 'emergency_fund',
    title: '6. The 2-Month Emergency Savings Buffer',
    summary:
      'Always keep a small savings bucket equal to 2 or 3 months of expenses untouched. If crop prices drop or monsoon delays milk sales, this buffer saves you.',
    keyRule: 'Never spend your emergency buffer on daily non-essential purchases.',
  },
  {
    id: 'budget',
    title: '7. Managing a Household Budget Without Debt',
    summary:
      'A budget is simply writing down money coming in and money going out each week so you never run out of cash before the month ends.',
    keyRule: 'Separate your personal kitchen expenses from your dairy or enterprise money.',
  },
  {
    id: 'dbt',
    title: '8. Direct Benefit Transfer (DBT) & Aadhaar',
    summary:
      'DBT sends government scheme subsidies and seed money directly into your Aadhaar-linked savings bank account with zero middlemen taking a cut.',
    keyRule: 'Ensure your Aadhaar is linked to your active bank passbook at the branch.',
  },
];

const Learn = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  const handleExplain = async (lesson) => {
    setSelectedTopic(lesson);
    setExplaining(true);
    setAiExplanation('');
    try {
      const res = await learnApi.explainTopic(lesson.title);
      setAiExplanation(res.explanation);
    } catch (err) {
      setAiExplanation(lesson.summary);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Financial Education
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Simple Money Lessons for Entrepreneurs
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            Short, easy-to-understand concepts written in plain village English. Click any lesson to hear the AI explain it in simple everyday examples.
          </p>
        </div>

        {/* 8 Lesson Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LESSONS.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{l.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">{l.summary}</p>
                <div className="bg-brand-50/70 border border-brand-200/60 rounded-2xl p-3 text-xs text-brand-900 mb-4">
                  <span className="font-bold block mb-0.5">Golden Rule:</span>
                  <span>{l.keyRule}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">2 min read</span>
                <button
                  onClick={() => handleExplain(l)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Bot className="w-3.5 h-3.5" /> Explain Simply with AI
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI Simple Explanation Modal */}
        {selectedTopic && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setSelectedTopic(null)}
                className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold mb-3">
                <Bot className="w-3.5 h-3.5" /> AI Simplified Explanation
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTopic.title}</h2>

              {explaining ? (
                <div className="py-8">
                  <Loader message="Translating into simple village examples..." />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {aiExplanation}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                    💡 If you have more questions about this, you can chat with the AI Advisor anytime!
                  </div>

                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                  >
                    Got it, thanks!
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Learn;
