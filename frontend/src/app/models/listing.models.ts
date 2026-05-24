export type UserRole = 'buyer' | 'seller' | 'farmer' | 'service_provider' | 'admin' | 'CLIENT' | 'SELLER' | 'FARMER' | 'SERVICE_PROVIDER' | 'ADMIN';
export type ListingStatus = 'available' | 'sold' | 'ACTIVE' | 'SOLD';

export interface User {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  governorate?: string;
  avatar?: string;
  createdAt?: Date | string;
}

export interface ListingBase {
  id: number | string;
  title: string;
  category: string;
  price?: number;
  governorate?: string;
  wilaya?: string;
  location?: string;
  description?: string;
  images?: string[];
  imageUrl?: string;
  status?: ListingStatus;
  userId?: number;
  userName?: string;
  userPhone?: string;
  createdAt?: Date | string;
}

export interface Animal extends ListingBase {
  breed?: string;
  gender?: 'male' | 'female' | 'ذكر' | 'أنثى' | string;
  age?: number | string;
  weight?: number | string;
  healthStatus?: string;
}

export interface Product extends ListingBase {
  quantity?: number | string;
  unit?: string;
  origin?: string;
  isOrganic?: boolean;
  inStock?: boolean;
}

export interface ServiceListing extends ListingBase {
  coverageArea?: string;
  serviceType?: 'remote' | 'onsite' | string;
  negotiablePrice?: boolean;
  experience?: string;
}

export interface ListingFilters {
  q?: string;
  category?: string;
  governorate?: string;
  wilaya?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'cheap' | 'expensive' | 'rating' | string;
  limit?: number;
}
