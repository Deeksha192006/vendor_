import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Coins,
  Clock,
  RefreshCw,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchWallet = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/fair-coins/wallet'),
        api.get('/fair-coins/transactions'),
      ]);

      const walletData = walletRes.data?.data?.wallet || walletRes.data?.wallet || null;
      const txData = txRes.data?.data?.transactions || txRes.data?.transactions || [];

      setWallet(walletData);
      setTransactions(txData);
    } catch (e) {
      console.error('Failed to load wallet data:', e);
      setError('Unable to load Fair Coins wallet. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const balance = Number(wallet?.balance ?? 0);
  // Authoritative fixed rule: 10 Fair Coins = ₹1 (Rupee equivalent = Fair Coin balance ÷ 10)
  const rupeeEquivalent = (balance / 10).toFixed(2);
  const totalEarned = Number(wallet?.totalEarned ?? balance);
  const totalSpent = Number(wallet?.totalSpent ?? 0);

  const getTransactionBadge = (tx) => {
    if (tx.status === 'REVERSED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          REVERSED
        </span>
      );
    }
    if (tx.status === 'FAILED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          FAILED
        </span>
      );
    }

    switch (tx.type) {
      case 'DEBIT':
      case 'EXPIRATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {tx.type}
          </span>
        );
      case 'REFUND':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            REFUND
          </span>
        );
      case 'REFERRAL_REWARD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            REFERRAL
          </span>
        );
      case 'PURCHASE_REWARD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PURCHASE
          </span>
        );
      case 'SPIN_REWARD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            SPIN & WIN
          </span>
        );
      case 'CREDIT':
      case 'BONUS':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {tx.type || 'CREDIT'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 text-amber-500" />
            <span>My Fair Coins</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your loyalty rewards, referral bonuses, and checkout redemptions.
          </p>
        </div>

        <button
          onClick={() => fetchWallet(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition disabled:opacity-50 self-start sm:self-auto"
          title="Refresh wallet balance and ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Wallet'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchWallet()}
            className="underline text-rose-700 hover:text-rose-900 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Available Balance & Rupee Equivalent */}
        <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 space-y-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-radial from-amber-400/20 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Available Balance</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs">
              Active
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-4xl font-black font-mono tracking-tight">
              {loading ? '...' : balance.toLocaleString()}
              <span className="text-lg font-bold text-blue-200 ml-2">Coins</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/15 space-y-1 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-100">Equivalent Value:</span>
              <span className="font-black text-amber-300 font-mono text-sm">
                ₹{loading ? '...' : rupeeEquivalent}
              </span>
            </div>
            <div className="text-[11px] text-blue-100/90 font-medium flex items-center justify-between">
              <span>Fixed Conversion Rate:</span>
              <span className="font-bold text-white">10 Fair Coins = ₹1</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Earned */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Total Earned</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">
              +{loading ? '...' : totalEarned.toLocaleString()}
              <span className="text-xs font-bold text-slate-400 ml-1">Coins</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Earned from purchases, referral network & daily spins.
          </div>
        </div>

        {/* Card 3: Total Redeemed */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Total Redeemed</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800 mt-2 font-mono">
              -{loading ? '...' : totalSpent.toLocaleString()}
              <span className="text-xs font-bold text-slate-400 ml-1">Coins</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Redeemed at 10 Coins = ₹1 for instant checkout discounts.
          </div>
        </div>
      </div>

      {/* Information Banner on Fixed Rate Rule */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold text-amber-950">Authoritative Platform Conversion Rate: </span>
            <span>10 Fair Coins = ₹1 (1 Fair Coin = ₹0.10)</span>
          </div>
        </div>
        <div className="text-[11px] text-amber-800 font-semibold bg-white/70 px-3 py-1 rounded-lg border border-amber-200 self-start sm:self-auto">
          Rupee equivalent = Fair Coins ÷ 10
        </div>
      </div>

      {/* Immutable Ledger History Table */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Fair Coin Transaction History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited transaction ledger with timestamp and post-transaction balance.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading transaction history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            <Coins className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-600">No transactions recorded yet</p>
            <p className="text-slate-400 mt-0.5">
              Earn coins by making purchases, referring friends, or playing the daily Spin & Win.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Transaction Details</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Balance After</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => {
                  const isDebit =
                    tx.type === 'DEBIT' ||
                    tx.type === 'EXPIRATION' ||
                    (typeof tx.amount === 'number' && tx.amount < 0);
                  const isReversal = tx.status === 'REVERSED';
                  const absAmount = Math.abs(Number(tx.amount) || 0);

                  const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
                  const formattedDate = txDate
                    ? txDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';
                  const formattedTime = txDate
                    ? txDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : '';

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Description & Reference */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{tx.description || tx.source || 'Fair Coin Reward'}</div>
                        {tx.referenceId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {tx.referenceId}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3">{getTransactionBadge(tx)}</td>

                      {/* Amount: positive for credit, negative for debit */}
                      <td
                        className={`py-3.5 px-3 font-mono font-black ${
                          isReversal
                            ? 'text-purple-600 line-through'
                            : isDebit
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {isDebit ? `-${absAmount}` : `+${absAmount}`}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">Coins</span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {tx.balanceAfter !== undefined && tx.balanceAfter !== null
                          ? Number(tx.balanceAfter).toLocaleString()
                          : '—'}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="text-slate-700 font-medium">{formattedDate}</div>
                        {formattedTime && (
                          <div className="text-[10px] text-slate-400">{formattedTime}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
