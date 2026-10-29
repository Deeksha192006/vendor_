import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Lock,
  Cookie,
  Calendar,
  Layers,
  Printer,
  ChevronRight,
  ExternalLink,
  Store,
  Users,
  Settings2,
  AlertCircle,
  RotateCcw,
  Truck,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api';

const LEGAL_TABS = [
  {
    key: 'CUSTOMER_TERMS',
    name: 'Customer Terms',
    title: 'Customer Terms & Conditions',
    path: '/terms/customer',
    icon: Users,
    desc: 'Account rules, orders, transparent pricing, returns, and Fair Coins',
  },
  {
    key: 'VENDOR_TERMS',
    name: 'Vendor Terms',
    title: 'Vendor Terms & Conditions',
    path: '/terms/vendor',
    icon: Store,
    desc: '5% platform commission, 3% vendor referral, 92%/95% proceeds, 7-day settlement',
  },
  {
    key: 'PRIVACY_POLICY',
    name: 'Privacy Policy',
    title: 'Privacy Policy',
    path: '/privacy-policy',
    icon: Lock,
    desc: 'How we collect, safeguard, and process your personal and business data',
  },
  {
    key: 'COOKIE_POLICY',
    name: 'Cookie Policy',
    title: 'Cookie Policy',
    path: '/cookie-policy',
    icon: Cookie,
    desc: 'Strictly necessary and optional cookies, tracking, and consent choices',
  },
  {
    key: 'REFUND_POLICY',
    name: 'Refund & Returns',
    title: 'Refund and Cancellation Policy',
    path: '/refund-policy',
    icon: RotateCcw,
    desc: '7-day return window, cancellation eligibility, QC, and refund timelines',
  },
  {
    key: 'SHIPPING_POLICY',
    name: 'Shipping & Delivery',
    title: 'Shipping and Delivery Policy',
    path: '/shipping-policy',
    icon: Truck,
    desc: 'Pan-India coverage, dispatch SLAs, delivery times, and fee transparency',
  },
  {
    key: 'GRIEVANCE_POLICY',
    name: 'Grievance & Contact',
    title: 'Contact and Grievance Redressal Information',
    path: '/grievance-policy',
    icon: HelpCircle,
    desc: 'Designated Grievance Officer, contact details, and statutory resolution timelines',
  },
];

export const LegalDocumentView = ({ initialType }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active document type from prop or path
  const resolveActiveKey = () => {
    if (initialType) return initialType;
    const path = location.pathname.toLowerCase();
    if (path.includes('vendor')) return 'VENDOR_TERMS';
    if (path.includes('cookie')) return 'COOKIE_POLICY';
    if (path.includes('privacy')) return 'PRIVACY_POLICY';
    if (path.includes('refund') || path.includes('return') || path.includes('cancellation')) return 'REFUND_POLICY';
    if (path.includes('shipping') || path.includes('delivery')) return 'SHIPPING_POLICY';
    if (path.includes('grievance') || path.includes('contact')) return 'GRIEVANCE_POLICY';
    return 'CUSTOMER_TERMS';
  };

  const [activeTab, setActiveTab] = useState(resolveActiveKey());
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveTab(resolveActiveKey());
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    api
      .get(`/legal-documents/${activeTab}`)
      .then((res) => {
        if (isMounted && res.data?.data) {
          setDocument(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load legal document:', err);
        if (isMounted) {
          setError('Unable to fetch live legal document from server.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab.key);
    navigate(tab.path);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeMeta = LEGAL_TABS.find((t) => t.key === activeTab) || LEGAL_TABS[0];
  const IconComponent = activeMeta.icon;

  // Simple and clean Markdown rendering to HTML helper
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-3 space-y-1.5 text-slate-700 leading-relaxed text-sm">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const formatInline = (str) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-blue-700">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 font-bold underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-2xl sm:text-3xl font-black text-slate-900 mt-6 mb-3 tracking-tight">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-lg sm:text-xl font-bold text-[#30358F] mt-8 mb-2 pb-1 border-b border-slate-100">
            {trimmed.replace('### ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('#### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-base font-bold text-slate-800 mt-5 mb-1.5">
            {trimmed.replace('#### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('---')) {
        flushList();
        elements.push(<hr key={index} className="my-6 border-slate-200" />);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        listItems.push(formatInline(trimmed.replace(/^[-*]\s+/, '')));
      } else if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        flushList();
        const formula = trimmed.replace(/\$\$/g, '');
        elements.push(
          <div key={index} className="p-4 my-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 font-mono text-xs sm:text-sm text-blue-950 font-bold overflow-x-auto shadow-xs">
            {formula}
          </div>
        );
      } else if (trimmed.length > 0) {
        flushList();
        elements.push(
          <p
            key={index}
            className="text-sm text-slate-700 my-2.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-[#ED1C2E] transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Legal Policies</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{activeMeta.name}</span>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E235C] via-[#30358F] to-[#2B3080] text-white p-6 sm:p-10 shadow-xl shadow-indigo-900/10">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official BAAPOO MART Legal Terms</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{activeMeta.title}</h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">{activeMeta.desc}</p>
          </div>
        </div>

        {/* Legal Document Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LEGAL_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-white border-[#30358F] shadow-md shadow-blue-900/10 ring-2 ring-blue-500/20'
                    : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#30358F] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#30358F] bg-blue-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <div className={`font-black text-xs sm:text-sm ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                    {tab.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Document Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Document Top Bar */}
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700">
                <Layers className="w-3.5 h-3.5 text-[#30358F]" />
                <span>Version {document?.version || '1.0'}</span>
              </span>

              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Effective:{' '}
                  {document?.effectiveDate
                    ? new Date(document.effectiveDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'January 1, 2026'}
                </span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                <span>•</span>
                <span>BAAPOO MART Digital Commerce Pvt. Ltd.</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'COOKIE_POLICY' && (
                <button
                  type="button"
                  onClick={() => window.openCookiePreferences && window.openCookiePreferences()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#30358F] font-bold text-xs hover:bg-blue-100 transition flex items-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Manage Cookies</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition flex items-center gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Reader Body */}
          <div className="p-6 sm:p-10 max-w-4xl mx-auto">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#30358F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Loading legal document...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Notice</span>
                </div>
                <p>{error}</p>
              </div>
            ) : (
              <article className="prose prose-slate max-w-none">
                {renderMarkdown(document?.content)}
              </article>
            )}
          </div>

          {/* Document Footer */}
          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              Have questions regarding these policies? Contact our Legal &amp; Compliance Desk at{' '}
              <a href="mailto:privacy@baapoomart.com" className="text-[#30358F] font-bold underline">
                privacy@baapoomart.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Quick Links:</span>
              <Link to="/customer/help" className="hover:text-[#ED1C2E] transition">
                Help Center
              </Link>
              <span>•</span>
              <Link to="/vendor/login" className="hover:text-[#ED1C2E] transition">
                Vendor Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentView;
