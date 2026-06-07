import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type {
  User, Exam, PredictedPaper, Order, Purchase,
  PaymentHistory, AdminAnalytics, RazorpayOrder,
  ApiResponse, PaginatedResponse, ExamCategory,
} from "@/types";

// ── Base URL resolution ─────────────────────────────────────────
// • Vercel (monorepo): backend is at /_/backend  (set NEXT_PUBLIC_API_URL=/_/backend/api)
// • Render (separate): backend is at https://your-api.onrender.com/api
// • Local dev:         http://localhost:5000/api
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/_/backend/api`
    : "/_/backend/api");

// ── Axios instance ──────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL:         API_BASE,
  withCredentials: true,
  headers:         { "Content-Type": "application/json" },
  timeout:         15000,
});

// ── Request interceptor — attach JWT ────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — auto-refresh on 401 ─────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh");
        if (data.data?.accessToken) {
          localStorage.setItem("accessToken", data.data.accessToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem("accessToken");
        if (typeof window !== "undefined") {
          window.location.href = "/auth?redirect=" + window.location.pathname;
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── AUTH ────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post<ApiResponse<{ user: User }>>("/auth/register", data),

  sendOTP: (email: string, purpose: "register" | "login" | "forgot-password") =>
    api.post<ApiResponse>("/auth/send-otp", { email, purpose }),

  verifyOTP: (email: string, otp: string, purpose: string) =>
    api.post<ApiResponse<{ accessToken: string; user: User }>>("/auth/verify-otp", { email, otp, purpose }),

  login: (email: string, password: string) =>
    api.post<ApiResponse<{ accessToken: string; user: User }>>("/auth/login", { email, password }),

  logout: () =>
    api.post<ApiResponse>("/auth/logout"),

  getMe: () =>
    api.get<ApiResponse<{ user: User }>>("/auth/me"),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse>("/auth/reset-password", { token, password }),

  googleLogin: () => {
    window.location.href = `${API_BASE.replace("/api", "")}/api/auth/google`;
  },
};

// ── EXAMS ───────────────────────────────────────────────────────
export const examApi = {
  getAll: (params?: {
    page?: number; limit?: number; category?: ExamCategory;
    search?: string; trending?: boolean;
  }) => api.get<ApiResponse<PaginatedResponse<Exam>>>("/exams", { params }),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<{ exam: Exam; papers: PredictedPaper[] }>>(`/exams/${slug}`),

  getByCategory: (category: ExamCategory, params?: { page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Exam>>>(`/exams/category/${category}`, { params }),

  search: (query: string) =>
    api.get<ApiResponse<Exam[]>>("/exams/search", { params: { q: query } }),

  getTrending: () =>
    api.get<ApiResponse<Exam[]>>("/exams/trending"),
};

// ── PAPERS ──────────────────────────────────────────────────────
export const paperApi = {
  getByExam: (examId: string) =>
    api.get<ApiResponse<PredictedPaper[]>>(`/papers/exam/${examId}`),

  getById: (id: string) =>
    api.get<ApiResponse<PredictedPaper>>(`/papers/${id}`),

  checkAccess: (id: string) =>
    api.get<ApiResponse<{ hasAccess: boolean }>>(`/papers/${id}/access`),

  getDownloadUrl: (id: string) =>
    api.get<ApiResponse<{ url: string; title: string }>>(`/papers/${id}/download`),
};

// ── PAYMENT ─────────────────────────────────────────────────────
export const paymentApi = {
  createOrder: (paperId: string) =>
    api.post<ApiResponse<{ order: RazorpayOrder; paper: PredictedPaper }>>("/payment/create-order", { paperId }),

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paperId: string;
  }) => api.post<ApiResponse<{ purchase: Purchase }>>("/payment/verify", data),

  getHistory: () =>
    api.get<ApiResponse<PaymentHistory[]>>("/payment/history"),
};

// ── USER ────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () =>
    api.get<ApiResponse<{ user: User }>>("/user/profile"),

  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>("/user/profile", data),

  getPurchases: () =>
    api.get<ApiResponse<Purchase[]>>("/user/purchases"),

  getWishlist: () =>
    api.get<ApiResponse<PredictedPaper[]>>("/user/wishlist"),

  addToWishlist: (paperId: string) =>
    api.post<ApiResponse>(`/user/wishlist/${paperId}`),

  removeFromWishlist: (paperId: string) =>
    api.delete<ApiResponse>(`/user/wishlist/${paperId}`),
};

// ── ADMIN ───────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () =>
    api.get<ApiResponse<AdminAnalytics>>("/admin/dashboard"),

  createExam: (data: FormData) =>
    api.post<ApiResponse<Exam>>("/admin/exams", data, { headers: { "Content-Type": "multipart/form-data" } }),

  updateExam: (id: string, data: FormData) =>
    api.put<ApiResponse<Exam>>(`/admin/exams/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),

  deleteExam: (id: string) =>
    api.delete<ApiResponse>(`/admin/exams/${id}`),

  getPapers: (params?: { examId?: string; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<PredictedPaper>>>("/admin/papers", { params }),

  createPaper: (data: FormData) =>
    api.post<ApiResponse<PredictedPaper>>("/admin/papers", data, { headers: { "Content-Type": "multipart/form-data" } }),

  updatePaper: (id: string, data: FormData) =>
    api.put<ApiResponse<PredictedPaper>>(`/admin/papers/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),

  deletePaper: (id: string) =>
    api.delete<ApiResponse>(`/admin/papers/${id}`),

  getUsers: (params?: { page?: number; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<User>>>("/admin/users", { params }),

  updateUser: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/admin/users/${id}`, data),

  getOrders: (params?: { page?: number; status?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Order>>>("/admin/orders", { params }),

  updateOrderStatus: (id: string, status: string) =>
    api.put<ApiResponse<Order>>(`/admin/orders/${id}`, { status }),
};

export default api;
