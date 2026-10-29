import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Package,
  Crown,
  Store,
  RefreshCw,
  Plus,
  Minus,
  Edit,
  X,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminInventory = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stock Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState('ADD');
  const [stockQty, setStockQty] = useState(10);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminService.getInventory();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockQty(10);
    setStockAction('ADD');
    setStockModalOpen(true);
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await superAdminService.updateProductStock(selectedProduct._id, {
        action: stockAction,
        quantity: stockQty,
      });
      setSuccessMsg(`Stock updated for "${selectedProduct.name}"`);
      setStockModalOpen(false);
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const {
    totalProducts = 0,
    lowStockCount = 0,
    outOfStockCount = 0,
    superAdminCount = 0,
    lowStockProducts = [],
    outOfStockProducts = [],
    superAdminProducts = [],
  } = data || {};

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#30358F] to-[#1E2356] text-white shadow-md">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Inventory Center</h1>
            <p className="text-xs text-slate-500">
              Real-time stock monitoring, low-stock warnings, and direct inventory level management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/super-admin/products')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <Package className="w-4 h-4 text-slate-600" />
            <span>Product Directory</span>
          </button>
          <button
            onClick={fetchInventory}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition border border-slate-200 shadow-sm"
            title="Refresh Inventory Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {successMsg && (
        <motion.div variants={itemVariants} className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600" /> {error}
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Catalog Products</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono">{totalProducts.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">Live platform catalog</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Low Stock Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 font-mono">{lowStockCount.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">Products with stock ≤ 5 units</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600 font-mono">{outOfStockCount.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">Products with 0 inventory</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Super Admin Direct</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-blue-300">{superAdminCount.toLocaleString()}</p>
            <p className="text-[11px] text-blue-100/80 mt-1">Directly owned products</p>
          </div>
        </div>
      </motion.div>

      {/* Out of Stock Alert Table */}
      {outOfStockProducts.length > 0 && (
        <motion.div variants={itemVariants} className="bg-rose-50/70 border border-rose-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-3">
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Critical: Out of Stock Products ({outOfStockProducts.length})
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-rose-200 bg-white text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-100/50 border-b border-rose-200 text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 text-slate-700">
                {outOfStockProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-rose-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4">{p.categoryId?.name || 'Category'}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700">{p.sourceType || 'VENDOR'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-rose-600">0 Units</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openStockModal(p)}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                      >
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Low Stock Warning Table */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Low Stock Inventory Alert ({lowStockProducts.length})
          </h3>
        </div>

        {lowStockProducts.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/60 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lowStockProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{p.sku || p._id}</td>
                    <td className="py-3 px-4">{p.categoryId?.name || 'Category'}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700">{p.sourceType || 'VENDOR'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{p.stock} units left</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openStockModal(p)}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">No products are currently low on stock.</p>
        )}
      </motion.div>

      {/* Stock Adjustment Modal */}
      {stockModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => setStockModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500">
              Product: <span className="font-bold text-slate-900">{selectedProduct.name}</span>
            </p>

            <form onSubmit={handleStockUpdate} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action</label>
                <select
                  value={stockAction}
                  onChange={(e) => setStockAction(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ADD">➕ Add Stock Quantity</option>
                  <option value="REDUCE">➖ Reduce Stock Quantity</option>
                  <option value="SET">🎯 Set Exact Stock Level</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600">
                Current Stock: <span className="font-bold text-slate-900">{selectedProduct.stock} units</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
                >
                  Update Inventory
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SuperAdminInventory;
