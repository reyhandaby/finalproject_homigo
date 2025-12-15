export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "USER" | "TENANT";
  isVerified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  role: "USER" | "TENANT";
}

export interface VerifyRequest {
  token: string;
  password: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  minPrice: number;
  images: PropertyImage[];
  category: Category | null;
  facilities: Facility[];
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  createdAt: string;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  description: string | null;
  basePrice: number;
  capacityGuests: number;
  beds: number;
  baths: number;
  images: RoomImage[];
  availabilities: RoomAvailability[];
  seasonRates: SeasonRate[];
  createdAt: string;
}

export interface RoomImage {
  id: string;
  url: string;
  createdAt: string;
}

export interface RoomAvailability {
  id: string;
  roomId: string;
  date: string;
  isAvailable: boolean;
  overridePrice: number | null;
}

export interface SeasonRate {
  id: string;
  propertyId: string | null;
  roomId: string | null;
  type: "NOMINAL" | "PERCENTAGE";
  value: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Facility {
  id: string;
  name: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  propertyId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nightlyPrice: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  property: {
    id: string;
    name: string;
    city: string;
    slug: string;
    images: PropertyImage[];
  };
  room: {
    id: string;
    name: string;
    basePrice: number;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  paymentProof: PaymentProof | null;
  review: Review | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | "PENDING"
  | "WAITING_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type PaymentStatus =
  | "PENDING"
  | "WAITING_PAYMENT"
  | "WAITING_CONFIRMATION"
  | "APPROVED"
  | "REJECTED";

export interface PaymentProof {
  id: string;
  bookingId: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface CreateBookingRequest {
  roomId: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
}

export interface PriceBreakdown {
  dailyPrices: DailyPrice[];
  totalPrice: number;
  averageNightlyPrice: number;
  nights: number;
}

export interface DailyPrice {
  date: string;
  basePrice: number;
  seasonalAdjustment: number;
  finalPrice: number;
  type: "base" | "peak_season" | "custom";
}

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: any;
}
