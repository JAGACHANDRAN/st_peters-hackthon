import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, PieChart, Target, Sparkles, Bot } from 'lucide-react';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = [
    { name: 'Dashboard', path: '/dashboard', icon: Compass },
    { name: 'Budget', path: '/budget', icon: PieChart },
    { name: 'Savings', path: '/goals', icon: Target },
    { name: 'Loans', path: '/loans', icon: Sparkles },
    { name: 'Advisor', path: '/advisor', icon: Bot },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 py-1.5 px-3 shadow-lg flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition ${
              active
                ? 'text-brand-700 font-bold bg-brand-50'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-brand-700' : 'text-gray-500'}`} />
            <span className="text-[11px] mt-0.5">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
