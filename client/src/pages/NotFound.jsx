import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const getDashboardLink = () => {
    if (!isAuthenticated || !user) return { path: '/', label: 'Back to Home', icon: Home };
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { path: '/super-admin/dashboard', label: 'Super Admin Console', icon: LayoutDashboard };
      case 'VENDOR':
        return { path: '/vendor/dashboard', label: 'Vendor Dashboard', icon: LayoutDashboard };
      default:
        return { path: '/customer/dashboard', label: 'Customer Dashboard', icon: LayoutDashboard };
    }
  };

  const dashboard = getDashboardLink();
  const Icon = dashboard.icon;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50 text-slate-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-xl shadow-slate-900/5 relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>

        <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
          404: Page Not Found
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3 mb-2">
          Page Does Not Exist
        </h1>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={dashboard.path}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Icon className="w-4 h-4" />
            <span>{dashboard.label}</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Marketplace Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
