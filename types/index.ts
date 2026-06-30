// types/index.ts

// ============================================
// USER TYPES
// ============================================

export type AccountType = 'user' | 'mistri' | 'admin';
export type StaffRole = 'super_admin' | 'admin' | 'support' | 'manager';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;
export type AvailabilityStatus = 'available' | 'unavailable' | 'on_work_available';
export type ExperienceLevel = 'less_than_1' | '1_to_3' | '3_plus' | null;

export interface BaseUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  accountType: AccountType;
  isActive: boolean;
  isOnboarded: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
  deviceToken?: string | null;
  defaultLocation?: string | null;
}

export interface Customer extends BaseUser {
  accountType: 'user';
}

export interface Mistri extends BaseUser {
  accountType: 'mistri';
  serviceId: number | null;
  profilePhotoUrl: string | null;
  isAvailable: boolean;
  availabilityStatus: AvailabilityStatus;
  isFeatured: boolean;
  averageRating: string | null;
  jobsCompleted: number;
  approvalStatus: ApprovalStatus;
  approvalRejectionReason: string | null;
  govtIdFrontUrl: string | null;
  govtIdBackUrl: string | null;
  experienceLevel: ExperienceLevel;
  govtIdType: string | null;
  serviceName?: string;
}

export interface Admin extends BaseUser {
  accountType: 'admin';
  staffRole: StaffRole;
  permissions: string[];
  designation: string | null;
}

export type User = Customer | Mistri | Admin;

// ============================================
// SERVICE CATEGORY TYPES
// ============================================

export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  iconColor: string;
  isActive: boolean;
  displayOrder: number;
  subCategoryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  serviceItemsCount?: number;
}

export interface ServiceItem {
  id: string;
  subCategoryId: string;
  name: string;
  description: string | null;
  price: string;
  durationMinutes: number | null;
  isActive: boolean;
  isPopular: boolean;
  imageUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  subCategoryName?: string;
  categoryId?: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface OrderItem {
  id: string;
  orderId: string;
  serviceItemId: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  durationMinutes: number | null;
  imageUrl: string | null;
  categoryId?: number;
}

export interface SubOrderItem {
  id: string;
  subOrderId: string;
  orderItemId: string;
  serviceItemId: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  durationMinutes: number | null;
  imageUrl: string | null;
}

export interface SubOrder {
  id: string;
  orderId: string;
  categoryId: number;
  categoryName: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  assignedMistriId: string | null;
  assignedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  adminNotes: string | null;
  items: SubOrderItem[];
  itemCount: number;
  mistriName?: string | null;
  mistriPhone?: string | null;
  mistriRating?: string | null;
  timeline?: any[];
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string | null;
  zipCode: string | null;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  items: OrderItem[];
  subOrders: SubOrder[];
  itemCount: number;
  subOrderCount: number;
  customerNotes: string | null;
  adminNotes: string | null;
  assignedMistriId: string | null;
  mistriName: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
}

// ============================================
// RATING TYPES
// ============================================

export interface Rating {
  id: string;
  rating: number;
  review: string | null;
  isApproved: boolean;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  customerName: string;
  mistriName: string;
  mistriId: string;
  customerId: string;
  serviceRequestId: string;
  approvedBy?: string | null;
}

// ============================================
// HERO BANNER TYPES
// ============================================

export interface HeroBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  videoUrl: string | null;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  adType: 'ad1' | 'ad2' | 'both';
  createdAt: string;
  updatedAt: string;
}

// ============================================
//AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedByRole: string;
  performedByName: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================
// SMS LOG TYPES
// ============================================

export interface SmsLog {
  id: string;
  to: string;
  type: 'otp_login' | 'otp_phone_change' | 'otp_account_deletion' | 'otp_admin' | 'service_accepted' | 'service_completed' | 'mistri_approved';
  status: 'success' | 'failed';
  createdAt: string;
}

export interface SmsStats {
  total: number;
  today: number;
  thisMonth: number;
  failed: number;
  byType: Record<string, number>;
}

// ============================================
// CONSULTATION TYPES
// ============================================

export interface Consultation {
  id: string;
  userId: string | null;
  categoryId: number;
  categoryName: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  details: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  urgency: 'normal' | 'urgent' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  assignedMistriName: string | null;
  assignedMistriPhone: string | null;
}