import { LEGAL_DOCUMENT_TYPES } from '../models/LegalDocument.js';

export const DEFAULT_LEGAL_DOCUMENTS = {
  [LEGAL_DOCUMENT_TYPES.VENDOR_TERMS]: {
    type: LEGAL_DOCUMENT_TYPES.VENDOR_TERMS,
    title: 'Vendor Terms & Conditions',
    version: '1.1',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: VENDOR TERMS & CONDITIONS
**Effective Date:** January 1, 2026  
**Version:** 1.1  
**Applicability:** All registered and onboarding merchants, sellers, and brand partners on BAAPOO MART.

Welcome to **BAAPOO MART** ("Platform", "we", "us", or "our"). These Vendor Terms & Conditions ("Vendor Terms") govern your access to and use of our marketplace platform as a registered vendor, merchant, or brand partner ("Vendor", "you", or "your"). By completing registration, onboarding, or listing products on BAAPOO MART, you acknowledge that you have read, understood, and agreed to be bound by these Vendor Terms and our Privacy Policy.

---

### 1. PLATFORM COMMISSION & PRICING RULES
1.1. **Super Admin Platform Service Commission:** BAAPOO MART operates a transparent product-level commission model. The platform calculates a fixed **5% commission** on each eligible product unit's selling price.  
1.2. **Vendor Proceeds Allocation:**  
- **Standard Unreferred Sales:** When the selling vendor does not have a qualifying direct referring vendor, the merchant receives **95% of the product selling price**.  
- **Referred Vendor Sales:** When the selling vendor registered via a qualifying direct referring vendor, the platform allocates **3% as direct vendor referral commission** to the referring vendor, leaving **92% of the product selling price** as net proceeds for the selling vendor.  
1.3. **Formula:**  
- Platform Commission = Eligible Product Line Selling Price × 5%  
- Direct Vendor Referral Commission = Eligible Product Line Selling Price × 3% (if eligible direct referrer exists)  
- Selling Vendor Share = Eligible Product Line Selling Price - Platform Commission (5%) - Referral Commission (3% if applicable) = 92% (or 95% if unreferred)  
1.4. **Centralized Payment Collection:** All customer order payments are collected centrally into the platform's designated Super Admin merchant account via authorized payment gateways (e.g., Razorpay) and systematically allocated vendor-wise.  
1.5. **Consistency Rule:** This commission formula is consistently enforced across the backend settlement engine, vendor financial ledgers, order summaries, and payout disbursements. Internal commission calculations are strictly kept out of customer-facing product displays.

---

### 2. PAYMENT PROCESSING FEES & DEDUCTIONS
2.1. **Payment Gateway Processing:** Customer transactions on BAAPOO MART are processed via authorized payment gateway partners, including Razorpay or other configured payment aggregators.  
2.2. **Statutory Taxes & Deductions:** All transactions and commissions comply with applicable statutory taxes, including Goods and Services Tax (GST) and Tax Collected at Source (TCS) under Indian tax laws.  
2.3. **No Hidden Charges:** No additional unannounced platform fees or unexpected deductions shall be charged outside verified merchant agreements.

---

### 3. VENDOR REFERRAL COMMISSIONS & REWARDS
3.1. **Direct Vendor Product Sale Referral Commission (3%):** When an existing verified Vendor ("Vendor A") successfully refers a new Vendor ("Vendor B") through their official referral link or code, Vendor A receives an additional **3% referral commission** on eligible product sales achieved by Vendor B.  
3.2. **Platform Commission Preservation:** The 3% vendor referral commission is separate and additional; the Super Admin platform commission remains fixed at 5% and is never reduced or merged.  
3.3. **Vendor Subscription Referral Reward (10%):** In addition to product sale commissions, Vendor A is eligible to receive a referral reward equal to **10% of qualifying Vendor B subscription plan payments**.  
3.4. **Eligibility & Settlement:** Both product sale referral commissions and subscription rewards become eligible only after verified payment clearing. Product sale referral payouts strictly adhere to the mandatory 7-day post-delivery holding period to accommodate returns and cancellations.  
3.5. **Cancellations & Reversals:** In the event of customer order return, cancellation, payment failure, or chargeback, any associated referral commission is reversed.  
3.6. **Direct Referral Exclusivity:** Referral commissions apply strictly to direct (1-to-1) vendor introductions. Circular referral loops and multi-tier cascades are prohibited.

---

### 4. VENDOR PAYOUT & SEVEN-DAY SETTLEMENT CYCLE
4.1. **Payment Verification:** Customer payments must be fully verified and reconciled before the corresponding transaction is posted to the vendor settlement ledger.  
4.2. **Seven-Day Settlement Holding Period:** To safeguard customer satisfaction and protect against fraud, eligible vendor order earnings are held in escrow for a mandatory **seven (7) calendar days** commencing from the verified timestamp of customer order delivery.  
4.3. **Condition for Release:** Settlements are released only after the expiration of the 7-day holding period, provided the order is not subject to an open return, refund request, warranty dispute, or active customer complaint.  
4.4. **Disbursement Channels:** Approved payouts are transferred directly to the vendor's verified bank account via NEFT/RTGS/IMPS or automated banking rails. Normal bank processing schedules apply.

---

### 5. VENDOR RESPONSIBILITIES & PRODUCT STANDARDS
5.1. **Product Accuracy & Genuineness:** Vendors must accurately describe every product listing, including true specifications, origin, ingredients, and warranty terms. All items must be 100% genuine, authentic Indian products compliant with applicable Indian standards.  
5.2. **Product Images:** Vendors may upload up to five (5) high-resolution images per product. Uploaded images must represent the exact item offered. AI-generated deceptive imagery or unauthorized stock photos are strictly prohibited.  
5.3. **Pricing Integrity:** Vendors must clearly declare the authentic Maximum Retail Price (MRP) and the actual Selling Price. Strikethrough pricing must reflect bona fide MRPs and must never mislead consumers.  
5.4. **Inventory & Fulfillment:** Vendors are responsible for maintaining accurate inventory levels and packaging accepted orders within the agreed dispatch SLA (normally 24 to 48 hours).  
5.5. **Prohibited Goods:** Counterfeit products, hazardous materials, unauthorized imports, and illegal or restricted items are strictly forbidden.  
5.6. **Returns & Customer Service:** Vendors must honor customer returns and warranty obligations within the 7-day post-delivery replacement window in good faith.

---

### 6. ACCOUNT SECURITY, VIOLATIONS & POLICY UPDATES
6.1. **Account Protection:** You are solely responsible for maintaining the confidentiality of your vendor credentials and two-factor authentication (MFA).  
6.2. **Suspension & Termination:** BAAPOO MART reserves the right to suspend or terminate any vendor account engaging in fraudulent listings, fake reviews, abusive cancellations, or regulatory violations.  
6.3. **Dispute Resolution:** In the event of a commercial dispute, parties agree to first engage in good-faith conciliation with BAAPOO MART merchant arbitration desk.  
6.4. **Material Updates:** Notice of material updates to these Vendor Terms will be communicated via the vendor portal or registered email address. Continued use of the platform after effective dates constitutes acceptance of revised terms.`,
  },

  [LEGAL_DOCUMENT_TYPES.CUSTOMER_TERMS]: {
    type: LEGAL_DOCUMENT_TYPES.CUSTOMER_TERMS,
    title: 'Customer Terms & Conditions',
    version: '1.1',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: CUSTOMER TERMS & CONDITIONS
**Effective Date:** January 1, 2026  
**Version:** 1.1  
**Applicability:** All registered customers, shoppers, and site visitors on BAAPOO MART.

Welcome to **BAAPOO MART** ("Platform", "we", "our", or "us"). These Customer Terms & Conditions ("Customer Terms") govern your access to and purchases made through our e-commerce marketplace. By creating an account, browsing our catalog, or placing an order, you agree to comply with and be bound by these Customer Terms and our Privacy Policy.

---

### 1. ACCOUNT REGISTRATION & SECURITY
1.1. **Eligibility:** You must be at least 18 years of age or possess legal parental/guardian consent to register and purchase products.  
1.2. **Account Accuracy:** You agree to provide true, accurate, current, and complete details during registration, including your name, email, phone number, and delivery address.  
1.3. **Credential Security:** You are responsible for safeguarding your login credentials. Notify our support desk immediately if you suspect unauthorized access to your account.

---

### 2. PRODUCT PRICING, AVAILABILITY & IMAGES
2.1. **Transparent Pricing Display:** The product details display only the actual Selling Price and the Maximum Retail Price (MRP). Where the Selling Price is lower than the MRP, the MRP is displayed with a visible strikethrough.  
2.2. **Real Vendor Images:** Products feature genuine images uploaded directly by verified merchants to reflect authentic appearance, packaging, and scale.  
2.3. **Authenticity Guarantee:** BAAPOO MART supports verified Indian manufacturers, artisans, and sellers. All products displayed are sourced from authentic sellers.  
2.4. **Product Availability:** Listings are subject to available inventory. If an item becomes unavailable after an order is placed, you will be notified immediately and issued a prompt full refund.

---

### 3. ORDERS, PAYMENTS & CHECKOUT
3.1. **Order Acceptance:** Your order confirmation constitutes an offer to purchase. Acceptance occurs when the vendor dispatches the items and a shipment notification is issued.  
3.2. **Payment Methods:** We accept digital payments through authorized payment gateways (UPI, credit/debit cards, net banking) and cash on delivery where supported.  
3.3. **Taxes & Shipping Charges:** Applicable GST and shipping charges are calculated transparently and displayed before you authorize payment. No hidden fees are added at checkout.

---

### 4. DELIVERY, RETURNS & REFUNDS
4.1. **Delivery Timelines:** Standard shipping typically takes 3 to 7 business days depending on location and courier partner availability.  
4.2. **Seven-Day Return Window:** You may request a return or replacement within seven (7) days of delivery for eligible damaged, defective, or incorrect items as detailed in our Refund and Cancellation Policy.  
4.3. **Refund Processing:** Approved refunds are initiated within 48 hours of return inspection and credited to your original payment method within 5 to 7 business days.

---

### 5. FAIR COINS & REWARDS PROGRAM
5.1. **Fair Coins:** You may earn Fair Coins through qualifying purchases, verified referrals, or platform activities as specified on the platform.  
5.2. **Redemption:** Fair Coins can be redeemed for discounts on eligible future orders in accordance with current redemption rules.  
5.3. **Non-Transferable:** Fair Coins cannot be exchanged for cash, transferred to other users, or withdrawn to external bank accounts.

---

### 6. CUSTOMER SUPPORT & GRIEVANCE HANDLING
For order assistance, delivery tracking, or complaints, reach our customer care desk at **support@baapoomart.com** or consult our Grievance Redressal information.`,
  },

  [LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY]: {
    type: LEGAL_DOCUMENT_TYPES.PRIVACY_POLICY,
    title: 'Privacy Policy',
    version: '1.1',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: PRIVACY POLICY
**Effective Date:** January 1, 2026  
**Version:** 1.1  
**Applicability:** All users, customers, merchants, and visitors of BAAPOO MART.

BAAPOO MART ("we", "us", or "our") values the privacy of every individual who visits or uses our platform. This Privacy Policy details how we collect, handle, store, and protect your personal data in accordance with the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and applicable data privacy regulations in India.

---

### 1. INFORMATION WE COLLECT
1.1. **Account & Identity Data:** Full name, email address, mobile number, password hash, and optional profile images.  
1.2. **Delivery & Address Data:** Shipping and billing street addresses, landmark, city, state, and postal pincode.  
1.3. **Merchant Onboarding & KYC Data:** Business registration name, GSTIN, PAN, bank account details for settlements, and business verification documents for vendors.  
1.4. **Transaction & Payment Data:** Order IDs, purchased items, payment status, and payment gateway references (we do not store sensitive credit/debit card numbers, PINs, or CVVs).  
1.5. **Technical & Device Information:** IP address, browser type, operating system, device identifiers, and session timestamps.

---

### 2. HOW WE USE YOUR INFORMATION
- To process, fulfill, track, and deliver customer orders.  
- To facilitate secure payment processing and vendor payout settlements.  
- To provide customer care, returns management, and grievance redressal.  
- To maintain account security, detect fraud, and prevent illegal activities.  
- To administer loyalty programs including Fair Coins and referral attributions.  
- To comply with statutory tax, regulatory, and legal obligations.

---

### 3. DATA SHARING & THIRD-PARTY DISCLOSURES
We do not sell, rent, or trade your personal information. Data is shared strictly on a need-to-know basis with:  
- **Verified Vendors:** Necessary delivery address and order details to fulfill product orders.  
- **Logistics & Delivery Partners:** Name, phone, and delivery address to complete package handoff.  
- **Payment Gateways:** Secure transactional tokens processed via certified PCI-DSS compliant providers like Razorpay.  
- **Law Enforcement:** When required by applicable Indian law, court order, or governmental mandate.

---

### 4. DATA SECURITY & RETENTION
4.1. **Security Measures:** We implement modern transport encryption (TLS/HTTPS), salted password hashing (bcrypt), role-based access control, and periodic vulnerability reviews.  
4.2. **Statutory Retention Rules:** Pursuant to Indian Goods and Services Tax (GST) rules, tax laws, and financial reporting standards, accounting ledgers, invoices, and transaction records are legally retained for up to 8 years.  
4.3. **Data Minimization:** Non-essential identifiers, contact details, and marketing preferences are purged or anonymized upon completion of an approved account deletion request.

---

### 5. YOUR PRIVACY RIGHTS & CHOICES
- **Access & Correction:** You can review and update your profile details and saved addresses directly in your Account Settings.  
- **Cookie Control:** You can manage or withdraw optional cookie consent at any time via our on-site Cookie Preferences panel.  
- **Account & Data Deletion:** You have the right to request deletion of your account and personal data at any time via the "Request Account and Data Deletion" option in Account Settings.

---

### 6. GRIEVANCE OFFICER & CONTACT INFORMATION
In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the contact details for grievance redressal are:  
- **Grievance Officer:** Privacy & Compliance Desk  
- **Email:** grievance@baapoomart.com  
- **Customer Support:** support@baapoomart.com  
- **Registered Address:** BAAPOO MART Digital Commerce Pvt. Ltd., Tech Hub, Bangalore, Karnataka, India.`,
  },

  [LEGAL_DOCUMENT_TYPES.COOKIE_POLICY]: {
    type: LEGAL_DOCUMENT_TYPES.COOKIE_POLICY,
    title: 'Cookie Policy',
    version: '1.1',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: COOKIE POLICY
**Effective Date:** January 1, 2026  
**Version:** 1.1  
**Applicability:** All visitors, customers, and vendors using BAAPOO MART websites and web applications.

This Cookie Policy explains how **BAAPOO MART** ("we", "us", or "our") uses cookies, local storage, and similar web tracking technologies when you browse or interact with our platform.

---

### 1. WHAT ARE COOKIES?
Cookies and browser storage objects (such as \`localStorage\` and \`sessionStorage\`) are small text or data files stored on your computer, tablet, or smartphone when you visit a website. They allow the platform to remember your active session, shopping cart items, security credentials, and browsing preferences across pages.

---

### 2. CATEGORIES OF COOKIES WE USE

#### A. Strictly Necessary Cookies (Always Active)
These cookies are indispensable for the core security, authentication, and functionality of BAAPOO MART. Without these cookies, the website cannot function properly.  
- **Purpose:** User authentication, secure session tokens, shopping cart state, CSRF protection, and fraud mitigation.  
- **Legal Basis:** Legitimate interest and contractual necessity for providing requested services.  
- **Control:** Cannot be disabled in our preference manager.

#### B. Performance & Analytics Cookies (Optional)
These cookies collect aggregated, pseudonymous information about how visitors navigate and interact with our web pages (such as page load speeds and most viewed products).  
- **Purpose:** Improving application performance, detecting broken links, and enhancing user experience.  
- **Control:** You can choose to enable or disable these cookies in the Cookie Preferences panel.

#### C. Personalization & Marketing Cookies (Optional)
These cookies help us provide personalized product recommendations, relevant banner announcements, and tailored Indian seller spotlights.  
- **Purpose:** Contextual recommendations and shopping personalization.  
- **Control:** You can choose to enable or disable these cookies in the Cookie Preferences panel.

---

### 3. HOW WE OBTAIN YOUR CONSENT
3.1. When you first visit BAAPOO MART, a Cookie Consent Banner is presented with clear options:  
- **Accept All:** Grants consent to all categories (Necessary, Analytics, and Marketing).  
- **Reject Optional Cookies:** Enables only Strictly Necessary cookies; blocks optional categories.  
- **Manage Preferences:** Allows category-level granular choice before consent is applied.  
3.2. **No Implicit Consent:** Continuing to browse without active selection is **not** treated as consent.  
3.3. **Persistence:** Your choices are securely saved along with a consent timestamp so that you are not repeatedly prompted on every page load.  
3.4. **Unblocked Core Services:** Rejecting optional cookies does not hinder your ability to register, browse products, add items to your cart, or complete secure checkout.

---

### 4. MANAGING OR WITHDRAWING YOUR CONSENT
You have the right to modify or revoke your cookie choices at any time:  
- Click the **"Cookie Preferences"** link located in the website footer on any page.  
- Modify your preferences in the interactive settings panel and click **"Save Preferences"**.  
- You may also clear stored cookies directly through your web browser settings.

---

### 5. CONTACT US
If you have questions regarding our use of cookies or privacy practices, please contact us at:  
**Email:** privacy@baapoomart.com | support@baapoomart.com`,
  },

  [LEGAL_DOCUMENT_TYPES.REFUND_POLICY]: {
    type: LEGAL_DOCUMENT_TYPES.REFUND_POLICY,
    title: 'Refund and Cancellation Policy',
    version: '1.0',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: REFUND AND CANCELLATION POLICY
**Effective Date:** January 1, 2026  
**Version:** 1.0  
**Applicability:** All customer orders placed on BAAPOO MART.

At BAAPOO MART, we are dedicated to providing an authentic, dependable, and transparent shopping experience. This Refund and Cancellation Policy details the criteria, timelines, and procedures for canceling orders, initiating returns, and receiving refunds.

---

### 1. ORDER CANCELLATION POLICY
1.1. **Cancellation Before Dispatch:** You may cancel an order free of charge at any time before the vendor packages and dispatches the consignment. You can initiate cancellation directly from the "My Orders" section of your customer account.  
1.2. **Cancellation After Dispatch:** Once an order has been handed over to our courier partner, it cannot be canceled in transit. You may refuse delivery at your doorstep or initiate a return after accepting delivery in accordance with the return criteria below.  
1.3. **Vendor or Platform Cancellation:** In rare cases where an item becomes unavailable or fails pre-dispatch quality inspection, BAAPOO MART will cancel the affected item and initiate an immediate 100% refund.

---

### 2. SEVEN-DAY RETURN POLICY
2.1. **Return Window:** Eligible items may be returned within **seven (7) calendar days** from the timestamp of confirmed delivery.  
2.2. **Eligible Return Reasons:**  
- Item arrived in damaged or defective condition.  
- Delivered product differs significantly from the listing specifications or images.  
- Missing items or parts in the package.  
- Wrong size or variant received.  
2.3. **Condition of Returned Items:** Items must be returned in their original packaging, unused, with all manufacturer tags, warranty cards, manuals, and freebies intact.  
2.4. **Non-Returnable Items:** Due to hygiene and safety regulations, certain products are non-returnable unless delivered damaged or defective:  
- Personal care, hygiene, and cosmetic products.  
- Perishable goods and edible food products.  
- Customized or personalized handcrafted items made to customer specifications.

---

### 3. RETURN VERIFICATION PROCESS
3.1. **Initiating a Request:** To initiate a return, navigate to "My Orders", select the item, and click "Request Return". Provide a brief explanation and clear photos/videos showing the issue.  
3.2. **Reverse Pickup:** Once approved, our logistics partner will arrange a complimentary reverse pickup from your delivery address within 2 to 3 business days.  
3.3. **Quality Check (QC):** Returned items undergo a prompt physical quality inspection at the merchant fulfillment facility to verify the reported condition.

---

### 4. REFUND TIMELINES AND METHODS
4.1. **Refund Approval:** Upon successful quality inspection (typically within 48 hours of return receipt), the refund is authorized.  
4.2. **Refund Method:**  
- **Prepaid Orders (UPI, Net Banking, Cards):** Refunded directly to the original payment source. Funds typically reflect within **5 to 7 business days**, subject to bank processing cycles.  
- **Cash on Delivery (COD) Orders:** Refunded to your verified bank account via NEFT/IMPS or credited to your BAAPOO MART wallet per your preference.  
- **Fair Coins:** Any Fair Coins redeemed on a returned order are credited back to your coin balance.  
4.3. **Shipping Fee Refunds:** If the return is due to a merchant error, defective merchandise, or damaged goods, any standard shipping fees paid are fully refunded.

---

### 5. CONTACT & DISPUTES
If you have questions regarding a refund or return status, please contact our support desk:  
- **Email:** support@baapoomart.com  
- **Help Center:** Available 24/7 through your customer account portal.`,
  },

  [LEGAL_DOCUMENT_TYPES.SHIPPING_POLICY]: {
    type: LEGAL_DOCUMENT_TYPES.SHIPPING_POLICY,
    title: 'Shipping and Delivery Policy',
    version: '1.0',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: SHIPPING AND DELIVERY POLICY
**Effective Date:** January 1, 2026  
**Version:** 1.0  
**Applicability:** All deliveries and shipments across India through BAAPOO MART.

BAAPOO MART is committed to delivering authentic Indian products safely, efficiently, and transparently to your doorstep. This Shipping and Delivery Policy explains our dispatch timelines, shipping charges, tracking methods, and partner courier networks.

---

### 1. COVERAGE AND SERVICEABLE REGIONS
1.1. **Pan-India Delivery:** BAAPOO MART delivers across all major states and union territories in India, covering over 19,000 postal pincodes via trusted third-party courier partners (including Delhivery, Blue Dart, Ekart, and India Post).  
1.2. **Pincode Verification:** You can verify delivery availability for your specific location on any product page by entering your 6-digit postal pincode.

---

### 2. ORDER PROCESSING & DISPATCH TIMELINES
2.1. **Vendor Dispatch SLA:** Verified merchants are required to pack and dispatch orders within **24 to 48 hours** of order confirmation (excluding Sundays and national holidays).  
2.2. **Made-to-Order & Artisan Items:** Certain handcrafted artisan products or customized items may require additional preparation time, which is clearly disclosed on the product detail page prior to checkout.  
2.3. **Dispatch Notification:** Once your package is handed over to the courier partner, you will receive an automated dispatch notification with your tracking number and live tracking link.

---

### 3. ESTIMATED DELIVERY TIMES
3.1. **Standard Delivery:**  
- **Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune):** 2 to 4 business days.  
- **Tier 2 and Tier 3 Cities:** 4 to 6 business days.  
- **Remote or North-Eastern Regions:** 5 to 8 business days.  
3.2. **Delays Beyond Control:** While our courier partners strive to meet estimated delivery windows, occasional delays may occur due to adverse weather conditions, public holidays, regional restrictions, or logistics network disruptions.

---

### 4. SHIPPING CHARGES & TRANSPARENCY
4.1. **Transparent Pricing:** Shipping charges (if applicable) are clearly shown in your shopping cart and finalized on the order checkout page before payment is initiated.  
4.2. **Free Delivery Promotions:** Orders meeting qualifying threshold amounts or specific promotional criteria are eligible for free delivery across India as indicated during checkout.  
4.3. **No Hidden Costs:** We never add surprise handling fees, fuel surcharges, or undisclosed costs at the time of delivery.

---

### 5. PACKAGE TRACKING & DELIVERY VERIFICATION
5.1. **Real-Time Tracking:** You can track the live transit status of your package at any time in the "My Orders" tab of your BAAPOO MART account.  
5.2. **Secure Handoff (OTP Verification):** For high-value consignments, delivery agents may request a One-Time Password (OTP) sent to your registered mobile number to confirm delivery.  
5.3. **Damaged Packaging at Delivery:** If you notice that the external shipping box is severely crushed, tampered with, or opened, please record video proof or refuse delivery and report immediately to support@baapoomart.com.`,
  },

  [LEGAL_DOCUMENT_TYPES.GRIEVANCE_POLICY]: {
    type: LEGAL_DOCUMENT_TYPES.GRIEVANCE_POLICY,
    title: 'Contact and Grievance Redressal Information',
    version: '1.0',
    effectiveDate: new Date('2026-01-01'),
    isPublished: true,
    content: `# BAAPOO MART: CONTACT AND GRIEVANCE REDRESSAL INFORMATION
**Effective Date:** January 1, 2026  
**Version:** 1.0  
**Statutory Reference:** In compliance with the Information Technology Act, 2000, Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Consumer Protection (E-Commerce) Rules, 2020.

BAAPOO MART is committed to addressing consumer inquiries, vendor complaints, and grievances in an objective, transparent, and prompt manner.

---

### 1. GENERAL CUSTOMER & VENDOR ASSISTANCE
For general inquiries, order status updates, vendor onboarding questions, or return requests, please reach our dedicated support desk:  
- **Customer Support Email:** support@baapoomart.com  
- **Vendor Partner Desk:** vendor-support@baapoomart.com  
- **Support Hours:** Monday to Saturday, 9:00 AM – 7:00 PM IST  
- **Response SLA:** Within 24 hours of ticket generation.

---

### 2. DESIGNATED GRIEVANCE OFFICER
If your issue or complaint is not satisfactorily resolved through primary customer support, you may escalate the matter directly to our designated Grievance Officer:

- **Name:** Rajesh Kumar Sharma  
- **Designation:** Head of Legal & Consumer Grievances  
- **Company Name:** BAAPOO MART Digital Commerce Pvt. Ltd.  
- **Grievance Email:** grievance@baapoomart.com  
- **Nodal Officer Email:** nodal-officer@baapoomart.com  
- **Corporate Office Address:**  
  BAAPOO MART Digital Commerce Pvt. Ltd.,  
  Level 4, Tech Innovation Hub, Outer Ring Road,  
  Bengaluru, Karnataka 560103, India.

---

### 3. GRIEVANCE REDRESSAL TIMELINES & WORKFLOW
3.1. **Acknowledgment:** In accordance with statutory requirements, our Grievance Desk will formally acknowledge receipt of your complaint within **48 hours** with a unique Grievance Tracking Ticket Number.  
3.2. **Investigation & Review:** The officer will review the order details, merchant records, courier logs, or platform data relevant to your complaint.  
3.3. **Resolution:** We commit to providing a reasoned resolution or conclusive determination within **30 calendar days** from the date of complaint receipt.

---

### 4. SUBMITTING A GRIEVANCE
To ensure fast and accurate resolution, please include the following details in your email to **grievance@baapoomart.com**:  
1. Your Full Name and Registered Email / Phone Number.  
2. Order Number or Transaction Reference ID (if applicable).  
3. Clear description of the grievance and steps previously taken with customer care.  
4. Any supporting invoices, unboxing photos/videos, or correspondence.`,
  },
};
