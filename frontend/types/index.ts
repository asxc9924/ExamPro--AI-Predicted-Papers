// ============================================================
// USER TYPES
// ============================================================
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin" | "super_admin";
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================
// EXAM TYPES
// ============================================================
export type ExamCategory =
  | "upsc"
  | "ssc"
  | "banking"
  | "railway"
  | "defence"
  | "teaching"
  | "state"
  | "engineering"
  | "medical";

export interface EligibilityInfo {
  ageMin?: number;
  ageMax?: number;
  education: string;
  nationality: string;
  other?: string[];
}

export interface ExamStage {
  name: string;
  type: "objective" | "descriptive" | "interview" | "skill-test";
  duration?: number; // in minutes
  marks?: number;
  subjects?: string[];
}

export interface SyllabusSection {
  name: string;
  topics: string[];
}

export interface ImportantDate {
  event: string;
  date: string;
  isApproximate?: boolean;
}

export interface Exam {
  _id: string;
  title: string;
  slug: string;
  shortName: string;
  category: ExamCategory;
  conductingBody: string;
  description: string;
  eligibility: EligibilityInfo;
  examPattern: {
    stages: ExamStage[];
    totalMarks?: number;
    negativeMark?: boolean;
  };
  syllabus: SyllabusSection[];
  selectionProcess: string[];
  importantDates?: ImportantDate[];
  vacancies?: number;
  salary?: string;
  thumbnail?: string;
  isTrending: boolean;
  isActive: boolean;
  createdAt: string;
}

// ============================================================
// PAPER TYPES
// ============================================================
export type PaperType = "predicted" | "model" | "pyq" | "practice";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface PredictedPaper {
  _id: string;
  examId: string | Exam;
  title: string;
  description: string;
  pdfUrl?: string; // Only available after purchase
  thumbnail?: string;
  price: number; // in paise (₹1 = 100 paise)
  difficultyLevel: DifficultyLevel;
  predictionScore: number; // 0–100
  totalQuestions: number;
  paperType: PaperType;
  year?: number;
  isActive: boolean;
  hasPurchased?: boolean; // Injected by API for auth users
  createdAt: string;
}

// ============================================================
// ORDER / PAYMENT TYPES
// ============================================================
export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  _id: string;
  userId: string;
  paperId: string | PredictedPaper;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Purchase {
  _id: string;
  userId: string;
  paperId: PredictedPaper;
  orderId: Order;
  paymentId: string;
  amount: number;
  purchasedAt: string;
  isActive: boolean;
}

export interface PaymentHistory {
  _id: string;
  paperId: PredictedPaper;
  amount: number;
  status: OrderStatus;
  razorpayPaymentId?: string;
  createdAt: string;
}

// ============================================================
// RAZORPAY TYPES
// ============================================================
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// ADMIN TYPES
// ============================================================
export interface AdminAnalytics {
  totalUsers: number;
  totalRevenue: number;
  totalOrders: number;
  totalExams: number;
  totalPapers: number;
  recentOrders: Order[];
  revenueByMonth: { month: string; revenue: number }[];
  usersByMonth: { month: string; count: number }[];
  popularExams: { exam: Exam; purchaseCount: number }[];
}

// ============================================================
// FORM TYPES
// ============================================================
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface OTPForm {
  email: string;
  otp: string;
}

export interface ExamForm {
  title: string;
  slug: string;
  shortName: string;
  category: ExamCategory;
  conductingBody: string;
  description: string;
  eligibility: EligibilityInfo;
  examPattern: Exam["examPattern"];
  syllabus: SyllabusSection[];
  selectionProcess: string[];
  vacancies?: number;
  salary?: string;
  isTrending: boolean;
}

export interface PaperForm {
  examId: string;
  title: string;
  description: string;
  price: number;
  difficultyLevel: DifficultyLevel;
  predictionScore: number;
  totalQuestions: number;
  paperType: PaperType;
  year?: number;
  pdf?: File;
  thumbnail?: File;
}

// ============================================================
// CATEGORY METADATA
// ============================================================
export const CATEGORY_META: Record<
  ExamCategory,
  { label: string; color: string; icon: string; description: string }
> = {
  upsc: {
    label: "UPSC",
    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    icon: "🏛️",
    description: "Civil Services & Allied Exams",
  },
  ssc: {
    label: "SSC",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "📋",
    description: "Staff Selection Commission",
  },
  banking: {
    label: "Banking",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "🏦",
    description: "IBPS, SBI & RBI Exams",
  },
  railway: {
    label: "Railway",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "🚂",
    description: "RRB & Railway Board Exams",
  },
  defence: {
    label: "Defence",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "⚔️",
    description: "NDA, CDS & Armed Forces",
  },
  teaching: {
    label: "Teaching",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    icon: "📚",
    description: "CTET, TET & Teacher Exams",
  },
  state: {
    label: "State Govt",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: "🗺️",
    description: "State PSC & Police Exams",
  },
  engineering: {
    label: "Engineering",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    icon: "⚙️",
    description: "JEE Main, Advanced & More",
  },
  medical: {
    label: "Medical",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    icon: "🩺",
    description: "NEET UG, PG & AIIMS",
  },
};
