// app/admin/_lib/api/manualService.ts
import { api } from './api';

export interface ManualServiceRequest {
  customerId?: string;
  customerPhone?: string;
  type: string;
  platformServiceIds?: string[];
  coords: {
    lat: number;
    lng: number;
  };
  address: string;
  selectedMistriId?: string;
  customerNotes?: string;
  paymentAmount?: number;
  isPaid?: boolean;
  status?: 'pending' | 'assigned' | 'completed' | 'canceled';
}

export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface ServiceType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface PlatformService {
  id: string;
  name: string;
  description: string | null;
  price: string;
  duration_minutes: number | null;
}

export interface Mistri {
  id: string;
  fullName: string;
  phoneNumber: string;
  serviceId: number | null;
  profilePhotoUrl: string | null;
  isAvailable: boolean;
  availabilityStatus: string;
  averageRating: string | null;
  jobsCompleted: number | null;
}

// Create a single manual service request
export const createManualServiceRequest = async (data: ManualServiceRequest) => {
  const response = await api.post('/api/admin/manual-service-request', data);
  return response.data;
};

// Create bulk manual service requests
export const createBulkManualServiceRequests = async (requests: ManualServiceRequest[]) => {
  const response = await api.post('/admin/manual-service-request/bulk', { requests });
  return response.data;
};

// Get customers for dropdown
export const getCustomers = async (search: string = '', limit: number = 20) => {
  const response = await api.get('/admin/manual-service-request/customers', {
    params: { search, limit },
  });
  return response.data;
};

// Get service types
export const getServiceTypes = async () => {
  const response = await api.get('/admin/manual-service-request/service-types');
  return response.data;
};

// Get platform services by service type
export const getPlatformServicesByType = async (serviceType: string) => {
  const response = await api.get('/admin/manual-service-request/platform-services', {
    params: { serviceType },
  });
  return response.data;
};

// Get available mistris
export const getAvailableMistris = async (serviceType?: string, search: string = '') => {
  const response = await api.get('/admin/manual-service-request/available-mistris', {
    params: { serviceType, search },
  });
  return response.data;
};