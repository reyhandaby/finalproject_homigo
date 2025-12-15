export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "TENANT";
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PropertyImage {
  id: string;
  url: string;
  propertyId: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Facility {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  capacityGuests: number;
  beds: number;
  baths: number;
  images?: RoomImage[];
}

export interface RoomImage {
  id: string;
  url: string;
}

export interface PropertyPreview {
  id: string;
  name: string;
  slug: string;
  city: string;
  minPrice: number;
  images?: PropertyImage[];
  category?: Category;
  rooms?: Room[];
}

export interface Property extends PropertyPreview {
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rooms: Room[];
  facilities: Facility[];
  images: PropertyImage[];
}

export interface PropertyListResponse {
  items: PropertyPreview[];
  total: number;
  page: number;
  pageSize: number;
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
  status:
    | "PENDING"
    | "WAITING_PAYMENT"
    | "CONFIRMED"
    | "CANCELLED"
    | "REJECTED";
  paymentStatus: "PENDING" | "APPROVED" | "REJECTED";

  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  property?: Property;
  room?: Room;
  paymentProof?: {
    imageUrl: string;
    uploadedAt: string;
  };
}

export type BookingOrder = Booking;

export interface City {
  city: string;
  lat: number;
  lng: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
