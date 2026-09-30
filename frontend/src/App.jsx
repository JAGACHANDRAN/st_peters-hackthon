import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Loans from './pages/Loans';
import LoanDetail from './pages/LoanDetail';
import Advisor from './pages/Advisor';
import Payments from './pages/Payments';
import Learn from './pages/Learn';
import AdminSchemes from './pages/AdminSchemes';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budget"
                element={
                  <ProtectedRoute>
                    <Budget />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/loans"
                element={
                  <ProtectedRoute>
                    <Loans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/loans/:id"
                element={
                  <ProtectedRoute>
                    <LoanDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advisor"
                element={
                  <ProtectedRoute>
                    <Advisor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn"
                element={
                  <ProtectedRoute>
                    <Learn />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/schemes"
                element={
                  <AdminRoute>
                    <AdminSchemes />
                  </AdminRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
