// src/lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "/api/proxy",
  withCredentials: true,
});

function safeParseJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = safeParseJwt(token);
  const exp = typeof payload?.exp === "number" ? payload.exp * 1000 : 0;
  return !exp || Date.now() >= exp;
}

function logoutAndRedirect() {
  try {
    localStorage.removeItem("token");
  } catch {}
  try {
    document.cookie = "token=; path=/; max-age=0";
  } catch {}
  if (typeof window !== "undefined") {
    const url = new URL("/login", window.location.origin);
    url.searchParams.set("expired", "1");
    window.location.href = url.toString();
  }
}

// attach token if exists (safe for SSR)
api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token && isTokenExpired(token)) {
      logoutAndRedirect();
    } else if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      logoutAndRedirect();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  googleAuth: (role: string) => api.get(`/auth/google?role=${role}`),
  verifyEmail: (token: string) => api.get(`/auth/verify/${token}`),
  verify: (data: any) => api.post("/auth/verify", data),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  me: () => api.get("/auth/me"),
};

// Properties endpoints (aligned with your backend app.ts)
export const propertiesApi = {
  list: (params?: any) => api.get("/properties", { params }),
  detail: (id: string) => api.get(`/properties/${id}`),

  create: (data: any) => api.post("/properties", data),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),

  // tenant-specific (some pages call /tenant/properties)
  getTenantProperties: () => api.get("/tenant/properties"),

  // images: backend expects POST /properties/:id/images { base64 }
  uploadImage: (propertyId: string, base64: string) =>
    api.post(`/properties/${propertyId}/images`, { base64 }),
  deleteImage: (imageId: string) =>
    api.delete(`/properties/images/${imageId}`),
};

// Rooms
export const roomsApi = {
  // create tetap ke tenant-properti (kamus backend punya POST /tenant/properties/:propertyId/rooms)
  create: (propertyId: string, data: any) =>
    api.post(`/rooms/tenant/properties/${propertyId}/rooms`, data),

  // detail/update/delete memakai routes yang disediakan roomsRouter (GET /rooms/:id, PUT /rooms/:id, DELETE /rooms/:id)
  detail: (roomId: string) => api.get(`/rooms/${roomId}`),
  update: (roomId: string, data: any) => api.put(`/rooms/${roomId}`, data),
  delete: (roomId: string) => api.delete(`/rooms/${roomId}`),

  // images endpoints (roomsRouter menyediakan /:id/images and /images/:imageId)
  uploadImage: (roomId: string, base64: string) =>
    api.post(`/rooms/${roomId}/images`, { base64 }),
  deleteImage: (imageId: string) => api.delete(`/images/${imageId}`),

  // availability & season-rates (jika backend menyediakan)
  setAvailability: (roomId: string, data: any) =>
    api.post(`/rooms/${roomId}/availability`, data),
  setSeasonRate: (roomId: string, data: any) =>
    api.post(`/rooms/${roomId}/season-rates`, data),
};

// Bookings
export const bookingsApi = {
  create: (data: any) => api.post("/bookings", data),
  list: (params?: any) => api.get("/bookings", { params }),
  listMy: (params?: any) => api.get("/bookings/me", { params }),
  detail: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  detailTenant: (id: string) => api.get(`/bookings/tenant/${id}`),
  uploadPaymentProof: (id: string, form: FormData) =>
    api.post(`/bookings/${id}/payment-proof`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  confirm: (id: string) => api.put(`/bookings/${id}/confirm`),
  reject: (id: string, reason?: string) =>
    api.put(`/bookings/${id}/reject`, { reason }),
};

// Reviews
export const reviewsApi = {
  create: (data: any) => api.post("/reviews", data),
  list: (propertyId: string) => api.get(`/reviews?propertyId=${propertyId}`),
};

// Categories (added create/update/delete)
export const categoriesApi = {
  list: () => api.get("/categories"),
  detail: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string }) => api.post("/categories", data),
  update: (id: string, data: { name: string }) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Facilities: tambah create & delete
export const facilitiesApi = {
  list: () => api.get("/facilities"),
  create: (data: { name: string }) => api.post("/facilities", data),
  delete: (id: string) => api.delete(`/facilities/${id}`),
};

// Season Rates
export const seasonRatesApi = {
  list: (params: { propertyId?: string; roomId?: string }) =>
    api.get("/season-rates", { params }),
  create: (data: {
    propertyId?: string;
    roomId?: string;
    type: "NOMINAL" | "PERCENTAGE";
    value: number;
    startDate: string;
    endDate: string;
  }) => api.post("/season-rates", data),
  update: (
    id: string,
    data: Partial<{
      type: "NOMINAL" | "PERCENTAGE";
      value: number;
      startDate: string;
      endDate: string;
    }>
  ) => api.put(`/season-rates/${id}`, data),
  delete: (id: string) => api.delete(`/season-rates/${id}`),
};

export const userApi = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data: any) => api.put("/users/me", data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;
