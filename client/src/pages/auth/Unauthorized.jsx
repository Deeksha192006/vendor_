import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import { ShieldAlert, ArrowLeft, LogOut, Store, ShoppingBag, Shield, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export const Unauthorized = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const getRoleDashboard = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/super-admin/dashboard';
      case 'VENDOR':
        return '/vendor/dashboard';
      default:
        return '/customer/dashboard';
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-rose-50/40 via-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-xl shadow-rose-500/5 relative overflow-hidden"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider mb-2">
          403: Access Denied
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Unauthorized Portal Access
        </h2>

        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          You do not have permission to view this section. FairKart enforces strict separation of responsibilities between Customers, Merchants/Vendors, and the Platform Super Admin.
        </p>

        {isAuthenticated && user && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Currently Signed In As:
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-800">{user.name || user.email}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            to={getRoleDashboard()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Permitted Dashboard</span>
          </Link>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Available Role Portals
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <Link to="/customer/login" className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-semibold transition-all flex flex-col items-center gap-1.5">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>Customer</span>
            </Link>
            <Link to="/vendor/login" className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-semibold transition-all flex flex-col items-center gap-1.5">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Vendor</span>
            </Link>
            <Link to="/super-admin/login" className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/60 hover:border-amber-200 text-slate-700 hover:text-amber-700 font-semibold transition-all flex flex-col items-center gap-1.5">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Super Admin</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
