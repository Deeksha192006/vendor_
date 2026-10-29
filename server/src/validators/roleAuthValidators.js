import { z } from 'zod';

// Disallowed injection fields helper
const disallowPrivilegeEscalation = (data, ctx) => {
  if (data.role !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Explicit role assignment is strictly prohibited during public registration',
      path: ['role'],
    });
  }
  if (data.isAdmin !== undefined || data.isSuperAdmin !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Privilege escalation fields are prohibited',
      path: ['isAdmin'],
    });
  }
};

/**
 * 1. Customer Registration Schema
 * Strictly accepts customer-relevant information only.
 */
export const customerRegistrationSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
    firstName: z.string().min(1, 'First name must be at least 1 character').max(50).trim().optional(),
    lastName: z.string().max(50).trim().optional(),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().optional(),
    phone: z.string().trim().optional().nullable().or(z.literal('')),
    mobileNumber: z.string().trim().optional().nullable().or(z.literal('')),
    referralCode: z.string().trim().optional().nullable().or(z.literal('')),
    shopQrToken: z.string().trim().optional().nullable().or(z.literal('')),
    address: z.union([z.string(), z.record(z.any())]).optional().nullable(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().default('India').optional(),
    pincode: z.string().trim().optional(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must read and agree to the Terms & Conditions and Privacy Policy to register.' }),
    }),
    termsVersion: z.string().optional(),
    // Reject unknown privilege flags
    role: z.any().optional(),
    isAdmin: z.any().optional(),
    isSuperAdmin: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    disallowPrivilegeEscalation(data, ctx);
    if (!data.name && !data.firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name or First Name is required',
        path: ['name'],
      });
    }
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

/**
 * 2. Vendor Registration Schema
 * Collects vendor identity, store, and business registration details.
 */
export const vendorRegistrationSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
    firstName: z.string().max(50).trim().optional(),
    lastName: z.string().max(50).trim().optional(),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    phone: z.string().trim().optional().nullable().or(z.literal('')),
    mobileNumber: z.string().trim().optional().nullable().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().optional(),
    storeName: z.string().min(2, 'Store name must be at least 2 characters').trim().optional(),
    businessName: z.string().min(2, 'Business name must be at least 2 characters').trim().optional(),
    businessType: z.string().trim().optional(),
    businessDescription: z.string().trim().optional(),
    description: z.string().trim().optional(),
    gstNumber: z.string().trim().optional().nullable().or(z.literal('')),
    gstin: z.string().trim().optional().nullable().or(z.literal('')),
    panNumber: z.string().trim().optional().nullable().or(z.literal('')),
    pan: z.string().trim().optional().nullable().or(z.literal('')),
    businessRegistrationNumber: z.string().trim().optional(),
    // Location
    state: z.string().trim().optional(),
    district: z.string().trim().optional(),
    talukArea: z.string().trim().optional(),
    associatedShopkeeper: z.string().trim().optional().nullable().or(z.literal('')),
    pincode: z.string().trim().optional(),
    fullAddress: z.string().trim().optional(),
    businessAddress: z.string().trim().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    locationConsent: z.boolean().optional(),
    // KYC Documents
    identityDocumentType: z.string().trim().optional().nullable().or(z.literal('')),
    identityDocumentNumber: z.string().trim().optional().nullable().or(z.literal('')),
    identityDocumentUpload: z.string().optional().nullable().or(z.literal('')),
    panDocumentUpload: z.string().optional().nullable().or(z.literal('')),
    gstCertificateUpload: z.string().optional().nullable().or(z.literal('')),
    businessProofUpload: z.string().optional().nullable().or(z.literal('')),
    // Banking Details
    accountHolderName: z.string().trim().optional().nullable().or(z.literal('')),
    bankName: z.string().trim().optional().nullable().or(z.literal('')),
    accountNumber: z.string().trim().optional().nullable().or(z.literal('')),
    ifscCode: z.string().trim().optional().nullable().or(z.literal('')),
    branchName: z.string().trim().optional().nullable().or(z.literal('')),
    upiId: z.string().trim().optional().nullable().or(z.literal('')),
    bankProofUpload: z.string().optional().nullable().or(z.literal('')),
    // Referral
    referralCode: z.string().trim().optional().nullable().or(z.literal('')),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must read and agree to the Vendor Terms & Conditions and Privacy Policy.' }),
    }),
    termsVersion: z.string().optional(),
    // Reject unknown privilege flags
    role: z.any().optional(),
    isAdmin: z.any().optional(),
    isSuperAdmin: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    disallowPrivilegeEscalation(data, ctx);
    if (!data.name && !data.firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name is required',
        path: ['name'],
      });
    }
  });

/**
 * 3. Admin Creation Schema (Super Admin only)
 */
export const adminCreationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().trim().optional(),
  mobileNumber: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  adminRoleId: z.string().trim().optional().nullable(),
  department: z.string().trim().optional(),
  permissions: z.array(z.string()).optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

/**
 * 4. Super Admin Bootstrap Schema
 */
export const superAdminBootstrapSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'Super Admin password must be at least 8 characters'),
  phone: z.string().trim().optional(),
  bootstrapKey: z.string().min(1, 'Secure bootstrap key is required'),
});

/**
 * 5. Vendor Bank Schema
 */
export const vendorBankSchema = z.object({
  accountHolderName: z.string().min(2, 'Account holder name is required').trim(),
  bankName: z.string().min(2, 'Bank name is required').trim(),
  accountNumber: z.string().min(8, 'Account number must be at least 8 digits').max(20).trim(),
  ifscCode: z.string().min(6, 'IFSC code is required').trim().toUpperCase(),
  branchName: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
  bankProofUpload: z.string().optional(),
});

/**
 * 6. Customer Profile Schema
 */
export const customerProfileSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    firstName: z.string().max(50).trim().optional(),
    lastName: z.string().max(50).trim().optional(),
    phone: z.string().min(10).max(15).trim().optional(),
    mobileNumber: z.string().min(10).max(15).trim().optional(),
    avatar: z.string().optional(),
    profileImage: z.string().optional(),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', '']).optional(),
    notificationPreferences: z.record(z.boolean()).optional(),
    // Reject protected fields
    role: z.any().optional(),
    balance: z.any().optional(),
    fairCoinBalance: z.any().optional(),
    superCoinBalance: z.any().optional(),
  })
  .superRefine(disallowPrivilegeEscalation);

/**
 * 7. Vendor Profile Schema
 */
export const vendorProfileSchema = z
  .object({
    storeName: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
    business: z.record(z.any()).optional(),
    location: z.record(z.any()).optional(),
    // Reject protected fields
    role: z.any().optional(),
    balance: z.any().optional(),
    pendingBalance: z.any().optional(),
    commissionRate: z.any().optional(),
  })
  .superRefine(disallowPrivilegeEscalation);

/**
 * 8. Admin Profile Schema
 */
export const adminProfileSchema = z.object({
  name: z.string().min(2).trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  department: z.string().trim().optional(),
  permissions: z.array(z.string()).optional(),
  profileImage: z.string().optional(),
});

/**
 * 9. Super Admin Profile Schema
 */
export const superAdminProfileSchema = z.object({
  name: z.string().min(2).trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  profileImage: z.string().optional(),
});
