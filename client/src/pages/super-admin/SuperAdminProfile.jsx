import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, KeyRound, Clock, Calendar, CheckCircle, LogOut, X } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { logoutUser } from '../../store/authSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await superAdminService.resetUserPassword(user._id, password);
      setSuccessMsg('Your Super Admin credentials have been updated securely.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-2xl"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <User className="w-5 h-5" />
          </span>
          Super Admin Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Master administrative account information, session telemetry, and credential management.
        </p>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between font-medium">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold" aria-label="Dismiss error">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {successMsg && (
        <motion.div variants={itemVariants} className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold" aria-label="Dismiss message">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Profile Overview Card */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Super Admin'}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
              <Shield className="w-3 h-3 text-blue-600" /> MASTER SUPER_ADMIN
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Account Initialized
            </span>
            <span className="font-bold text-slate-800 mt-1 block">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Last Active Session
            </span>
            <span className="font-bold text-slate-800 mt-1 block">
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Current Session'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Change Password Card */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" /> Update Master Credentials
        </h3>
        <p className="text-xs text-slate-500">
          Updating your password will securely re-hash with bcrypt and terminate other active sessions.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">New Password (min 8 characters)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              required
              minLength={8}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminProfile;
