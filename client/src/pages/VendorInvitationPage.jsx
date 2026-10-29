import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import franchiseVendorService from '../services/franchiseVendorService';
import { setAccessToken } from '../services/api';
import { setAuthUser } from '../store/authSlice';

export const VendorInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [alreadyActivated, setAlreadyActivated] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await franchiseVendorService.validateInvitationToken(token);

        if (res.alreadyActivated) {
          setAlreadyActivated(true);
          setVendorData(res.vendor);
        } else if (res.alreadySubmitted) {
          setAlreadySubmitted(true);
          setVendorData(res.vendor);
        } else if (res.valid) {
          // Redirect vendor to the existing Apply as Vendor form — Step 2 (Password & KYC)
          navigate(`/vendor/apply?token=${token}&step=2`, { replace: true });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setError('Missing invitation token.');
      setLoading(false);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await franchiseVendorService.activateFranchiseVendor(token, {
        password,
        confirmPassword,
      });

      // Secure direct login
      if (res.tokens?.accessToken) {
        setAccessToken(res.tokens.accessToken);
      }
      if (res.user) {
        dispatch(setAuthUser(res.user));
      }

      setSuccess(true);

      // Direct redirect to Vendor Dashboard
      setTimeout(() => {
        navigate('/vendor/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to activate account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-800">Verifying Franchise Invitation...</h2>
          <p className="text-xs text-slate-500 mt-1">Please wait while we validate your secure token.</p>
        </div>
      </div>
    );
  }

  // Case: Already Activated
  if (alreadyActivated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Account Already Active</h2>
          <p className="text-xs text-slate-600 mt-2">
            Your franchise vendor account for <strong>{vendorData?.storeName || 'your store'}</strong> has already been securely activated.
          </p>
          <div className="mt-6">
            <Link
              to="/vendor/login"
              className="w-full py-3 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              Go to Vendor Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case: Already Submitted & Under Review
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Application Under Review</h2>
          <p className="text-xs text-slate-600 mt-2">
            Your franchise application and KYC verification documents for <strong>{vendorData?.storeName || 'your store'}</strong> have already been securely submitted and are currently being reviewed by the Super Admin.
          </p>
          <div className="mt-6">
            <Link
              to="/vendor/login"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              Go to Vendor Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case: Error / Expired / Invalid
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Invalid or Expired Link</h2>
          <p className="text-xs text-slate-600 mt-2">{error}</p>
          <p className="text-[11px] text-slate-400 mt-3">
            Invitation links expire after 24 hours. If your link has expired, please contact the Super Admin to receive a renewed invitation.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition inline-block"
            >
              Return to BAAPOO MART
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case: Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Welcome to BAAPOO MART!</h2>
          <p className="text-xs text-slate-600 mt-2">
            Your franchise vendor account is activated and ready. Redirecting directly to your Vendor Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Case: Active Token -> Set Password Form
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950 text-white px-4 py-2 rounded-2xl shadow-md mb-4">
          <Building2 className="w-5 h-5 text-amber-400" />
          <span className="font-black text-sm tracking-wide">BAAPOO MART</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Activate Franchise Store
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Welcome! You have been appointed as an official Franchise Vendor. Set your permanent password below to begin.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-200">
          {/* Welcome Card */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Franchise Store:</span>
              <strong className="text-slate-900">{vendorData?.storeName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Name:</span>
              <strong className="text-slate-800">{vendorData?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Username:</span>
              <strong className="font-mono text-indigo-700">@{vendorData?.username}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Territory:</span>
              <span className="text-slate-700">
                {vendorData?.territory?.taluk}, {vendorData?.territory?.district}
              </span>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Create Permanent Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Permanent Password <span className="text-rose-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-950/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Activating Account...'
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Activate Account & Enter Dashboard
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            By activating, you agree to BAAPOO MART Vendor Policies & Standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorInvitationPage;
