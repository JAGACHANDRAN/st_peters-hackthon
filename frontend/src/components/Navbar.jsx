import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Wallet,
  Compass,
  PieChart,
  Target,
  Bot,
  BookOpen,
  Shield,
  Menu,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Compass },
    { name: 'Budget', path: '/budget', icon: PieChart },
    { name: 'Savings', path: '/goals', icon: Target },
    { name: 'Find Loans', path: '/loans', icon: Sparkles },
    { name: 'AI Advisor', path: '/advisor', icon: Bot },
    { name: 'Demo Wallet', path: '/payments', icon: Wallet },
    { name: 'Learn', path: '/learn', icon: BookOpen },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin Schemes', path: '/admin/schemes', icon: Shield });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              ₹
            </div>
            <div>
              <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight block leading-tight">
                Finance Empowerment
              </span>
              <span className="text-[10px] text-brand-700 font-medium tracking-wide uppercase block">
                Rural Women Entrepreneurs
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Auth Info / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/onboarding"
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 hover:border-brand-300 px-3 py-1.5 rounded-full text-xs font-medium text-gray-800 transition"
                  title="Edit Financial Profile"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            {!user && (
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="py-2 px-3 border-b border-gray-100 mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">{user.name}</span>
            <span className="text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
              {user.role}
            </span>
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 text-gray-500" />
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 mt-2 flex justify-between">
            <Link
              to="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-brand-700 font-medium px-3 py-2"
            >
              Edit Profile
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-3 py-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
