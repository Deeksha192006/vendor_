import {
  Home,
  ShoppingBag,
  Crown,
  Dices,
  Share2,
  Package,
  Heart,
  User,
  MapPin,
  Coins,
  Settings,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Boxes,
  RotateCcw,
  Users,
  TrendingUp,
  Receipt,
  ArrowDownCircle,
  Building2,
  Store,
  Landmark,
  CreditCard,
  Network,
  Tag,
  Bell,
  CheckSquare,
  BarChart3,
  Shield,
  ShieldCheck,
  KeyRound,
  Sliders,
  History,
  ShieldAlert,
  Activity,
  Percent,
  ShoppingCart,
  Headphones,
  Layers,
} from 'lucide-react';

/* ==========================================================================
   1. CUSTOMER NAVIGATION (Sidebar Groups)
   Pure e-commerce marketplace & rewards sidebar navigation.
   ========================================================================== */

export const customerNavGroups = [
  {
    group: 'SHOP',
    items: [
      { name: 'Home', path: '/', icon: Home },
      { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
      { name: 'Catalog', path: '/products', icon: ShoppingBag },
      { name: 'Wishlist', path: '/customer/wishlist', icon: Heart },
      { name: 'Cart', path: '/cart', icon: ShoppingCart, isCart: true },
    ],
  },
  {
    group: 'REWARDS',
    items: [
      { name: 'Fair Coins', path: '/customer/wallet', icon: Coins },
      { name: 'VIP Pass', path: '/customer/subscription', icon: Crown, highlight: true },
      { name: 'Spin & Win', path: '/customer/rewards', icon: Dices },
      { name: 'Referral Network', path: '/customer/referrals', icon: Share2 },
    ],
  },
  {
    group: 'ORDERS',
    items: [
      { name: 'My Orders', path: '/customer/orders', icon: Package },
      { name: 'Daily Purchase Report', path: '/customer/daily-purchases', icon: Receipt },
      { name: 'Track Orders', path: '/customer/orders?tab=tracking', icon: Tag },
      { name: 'Returns', path: '/customer/orders?tab=returns', icon: RotateCcw },
    ],
  },
  {
    group: 'ACCOUNT',
    items: [
      { name: 'My Profile', path: '/customer/profile', icon: User },
      { name: 'Addresses', path: '/customer/addresses', icon: MapPin },
      { name: 'Notifications', path: '/customer/notifications', icon: Bell },
      { name: 'Settings', path: '/customer/settings', icon: Settings },
    ],
  },
  {
    group: 'SUPPORT',
    items: [
      { name: 'Help Center', path: '/customer/help', icon: HelpCircle },
      { name: 'Terms & Conditions', path: '/terms/customer', icon: ShieldCheck },
      { name: 'Privacy Policy', path: '/privacy-policy', icon: Shield },
      { name: 'Contact Support', path: '/customer/help?tab=contact', icon: Headphones },
    ],
  },
];

export const customerNavItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Catalog', path: '/products', icon: ShoppingBag },
  { name: 'VIP Pass', path: '/customer/subscription', icon: Crown, highlight: true },
  { name: 'Spin & Win', path: '/customer/rewards', icon: Dices },
  { name: 'Refer & Earn', path: '/customer/referrals', icon: Share2, highlight: true },
];

export const customerMobileBottomNav = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Catalog', path: '/products', icon: ShoppingBag },
  { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'Orders', path: '/account/orders', icon: Package },
  { name: 'Account', path: '/account/profile', icon: User },
];

export const customerDrawerSecondaryItems = [
  { name: 'Customer Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'VIP Pass', path: '/account/subscription', icon: Crown },
  { name: 'Spin & Win', path: '/account/spin', icon: Dices },
  { name: 'Referral Network', path: '/account/referrals', icon: Share2 },
  { name: 'Offline Bills', path: '/account/offline-bills', icon: Receipt },
  { name: 'Wishlist', path: '/account/wishlist', icon: Heart },
  { name: 'Settings', path: '/account/settings', icon: Settings },
  { name: 'Help & Support', path: '/account/notifications', icon: HelpCircle },
];

export const customerProfileMenu = [
  { name: 'Customer Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', path: '/account/profile', icon: User },
  { name: 'My Orders', path: '/account/orders', icon: Package },
  { name: 'My Addresses', path: '/account/addresses', icon: MapPin },
  { name: 'My Wishlist', path: '/account/wishlist', icon: Heart },
  { name: 'My Rewards & Coins', path: '/account/wallet', icon: Coins },
  { name: 'Referral Network', path: '/account/referrals', icon: Share2 },
  { name: 'Settings', path: '/account/settings', icon: Settings },
];

/* ==========================================================================
   2. VENDOR PORTAL NAVIGATION (Sidebar)
   Operational management for merchants.
   ========================================================================== */

export const vendorNavGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'PRODUCT MANAGEMENT',
    items: [
      { name: 'Products', path: '/vendor/products', icon: Package },
      { name: 'Add Product', path: '/vendor/products/new', icon: PlusCircle },
      { name: 'Inventory', path: '/vendor/products?tab=inventory', icon: Boxes },
    ],
  },
  {
    group: 'ORDER MANAGEMENT',
    items: [
      { name: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
      { name: 'Returns & Cancellations', path: '/vendor/orders?tab=returns', icon: RotateCcw },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { name: 'Daily Sales Report', path: '/vendor/daily-sales', icon: BarChart3, highlight: true },
      { name: 'Sales & Earnings', path: '/vendor/earnings', icon: TrendingUp },
      { name: 'Earnings & Ledger', path: '/vendor/finance', icon: TrendingUp },
    ],
  },
  {
    group: 'VERIFICATION',
    items: [
      { name: 'Business Profile', path: '/vendor/profile', icon: Building2 },
      { name: 'Bank Details', path: '/vendor/profile?tab=bank', icon: Landmark },
    ],
  },
  {
    group: 'GROWTH',
    items: [
      { name: 'Subscription', path: '/vendor/subscription', icon: CreditCard },
      { name: 'Refer a Vendor', path: '/vendor/network', icon: Network, highlight: true },
      { name: 'Store QR Codes', path: '/vendor/qr', icon: Tag },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Vendor Terms', path: '/terms/vendor', icon: ShieldCheck },
      { name: 'Privacy Policy', path: '/privacy-policy', icon: Shield },
      { name: 'Settings', path: '/vendor/profile?tab=settings', icon: Settings },
      { name: 'Help', path: '/vendor/dashboard?tab=help', icon: HelpCircle },
    ],
  },
];

export const vendorProfileMenu = [
  { name: 'Business Profile', path: '/vendor/profile', icon: Building2 },
  { name: 'Bank Details', path: '/vendor/profile', icon: Landmark },
  { name: 'Account Settings', path: '/vendor/profile', icon: Settings },
];

/* ==========================================================================
   3. ADMIN & SUPER ADMIN UNIFIED NAVIGATION (Sidebar)
   Unified command center for Super Admin combining operational management & platform control.
   ========================================================================== */

export const superAdminNavGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Overview Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
      { name: 'Sales Report', path: '/super-admin/sales-report', icon: BarChart3, highlight: true },
    ],
  },
  {
    group: 'PRODUCT MANAGEMENT',
    items: [
      { name: 'Products', path: '/super-admin/products', icon: Package },
      { name: 'Add Product', path: '/super-admin/products/new', icon: PlusCircle },
      { name: 'Product Categories', path: '/super-admin/categories', icon: Tag },
      { name: 'Inventory', path: '/super-admin/inventory', icon: Boxes },
      { name: 'Super Admin Orders', path: '/super-admin/admin-orders', icon: ShoppingBag },
    ],
  },
  {
    group: 'USER & VENDOR MANAGEMENT',
    items: [
      { name: 'Franchise Vendor Management', path: '/super-admin/franchise-vendors', icon: Building2, highlight: true },
      { name: 'Franchise Vendor Applications & KYC', path: '/super-admin/franchise-applications', icon: ShieldCheck, highlight: true },
      { name: 'Users & Customers', path: '/super-admin/users', icon: Users },
      { name: 'Vendors & Reviews', path: '/super-admin/vendors', icon: Store },
    ],
  },
  {
    group: 'MARKETPLACE OPERATIONS',
    items: [
      { name: 'Products Catalog', path: '/super-admin/products', icon: Package },
      { name: 'Product Approvals', path: '/super-admin/products/review', icon: ShieldCheck },
      { name: 'Fulfillment Dashboard', path: '/super-admin/fulfillment', icon: Boxes },
      { name: 'Subscription Monitoring Overview', path: '/super-admin/subscriptions', icon: Layers },
      { name: 'Vendor Subscription Management', path: '/super-admin/vendor-subscriptions', icon: CreditCard },
      { name: 'Customer Subscription Plans', path: '/super-admin/subscription-plans', icon: Crown },
    ],
  },
  {
    group: 'FINANCE & SETTLEMENTS',
    items: [
      { name: 'Sales Report', path: '/super-admin/sales-report', icon: BarChart3 },
      { name: 'Financial Ledger', path: '/super-admin/ledger', icon: Receipt },
      { name: 'Daily Sales Report', path: '/super-admin/payments', icon: BarChart3, highlight: true },
      { name: 'Settlements', path: '/super-admin/settlements', icon: ArrowDownCircle },
      { name: 'Vendor Payouts', path: '/super-admin/payouts', icon: ArrowDownCircle },
      { name: 'Platform Commission Management', path: '/super-admin/commissions', icon: Percent, highlight: true },
      { name: 'VIP Pass Plans', path: '/super-admin/subscriptions', icon: Crown },
    ],
  },
  {
    group: 'REFERRAL NETWORK',
    items: [
      { name: 'Referral Management', path: '/super-admin/referral-network', icon: Network, highlight: true },
    ],
  },
  {
    group: 'PLATFORM CONFIGURATION',
    items: [
      { name: 'Offline Bills Verification', path: '/super-admin/offline-bills', icon: Receipt },
      { name: 'Spin Wheel Manager', path: '/super-admin/spin-wheel', icon: Dices },
      { name: 'Platform Settings', path: '/super-admin/settings', icon: Sliders },
      { name: 'Legal Documents & Terms', path: '/super-admin/legal-documents', icon: ShieldCheck, highlight: true },
      { name: 'Data Deletion Requests', path: '/super-admin/data-deletions', icon: ShieldAlert, highlight: true },
    ],
  },
  {
    group: 'SYSTEM & HEALTH',
    items: [
      { name: 'Analytics & Trends', path: '/super-admin/analytics', icon: BarChart3 },
      { name: 'Notifications', path: '/super-admin/notifications', icon: Bell },
    ],
  },
  {
    group: 'ACCOUNT',
    items: [
      { name: 'Super Admin Profile', path: '/super-admin/profile', icon: User },
    ],
  },
];

export const adminNavGroups = superAdminNavGroups;

export const adminProfileMenu = [
  { name: 'Super Admin Profile', path: '/super-admin/profile', icon: User },
  { name: 'System Settings', path: '/super-admin/settings', icon: Settings },
];

export const superAdminProfileMenu = [
  { name: 'Super Admin Profile', path: '/super-admin/profile', icon: User },
  { name: 'System Settings', path: '/super-admin/settings', icon: Settings },
];

