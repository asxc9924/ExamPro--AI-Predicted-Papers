# ExamEdge — Government & Entrance Exam Prediction Platform

A production-ready full-stack platform for Government Exam, Engineering & Medical Entrance Exam preparation with AI-predicted question papers.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion |
| UI Library | ShadCN UI |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + Google OAuth + Email OTP |
| Payments | Razorpay |
| File Storage | Cloudinary (PDFs & Thumbnails) |
| Email | Nodemailer + Gmail SMTP |

---

## Project Structure

```
exam-platform/
├── frontend/                  # Next.js 15 App
│   ├── app/
│   │   ├── page.tsx          # Homepage
│   │   ├── layout.tsx        # Root Layout
│   │   ├── globals.css       # Global Styles
│   │   ├── exam/[slug]/      # Exam Detail Page
│   │   ├── dashboard/        # User Dashboard
│   │   ├── admin/            # Admin Panel
│   │   └── auth/             # Login / Register
│   ├── components/           # Reusable Components
│   ├── lib/                  # Utilities & API calls
│   ├── hooks/                # Custom React Hooks
│   └── types/                # TypeScript Types
│
└── backend/                   # Express.js API
    ├── server.js             # Entry Point
    ├── models/               # Mongoose Models
    ├── routes/               # API Routes
    ├── controllers/          # Business Logic
    ├── middleware/           # Auth, Upload, Rate Limit
    ├── utils/                # Email, JWT, Razorpay helpers
    └── config/               # DB & App Config
```

---

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Razorpay account
- Google Cloud Console (OAuth)
- Cloudinary account
- Gmail account (SMTP)

### 1. Clone & Install

```bash
git clone <repo-url>

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

#### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/examedge
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary (PDF + Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=ExamEdge <noreply@examedge.in>

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000

# Admin Secret (for first admin creation)
ADMIN_SECRET=create_admin_secret_here
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev    # Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev    # Runs on http://localhost:3000
```

---

## API Endpoints

### Auth Routes (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register with email |
| POST | `/send-otp` | Send OTP to email |
| POST | `/verify-otp` | Verify OTP |
| POST | `/login` | Login with email+password |
| POST | `/refresh` | Refresh access token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset password |
| GET | `/google` | Google OAuth redirect |
| GET | `/google/callback` | Google OAuth callback |
| POST | `/logout` | Logout |

### Exam Routes (`/api/exams`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Get all exams (paginated, filtered) |
| GET | `/:slug` | Get single exam detail |
| GET | `/category/:cat` | Get exams by category |
| GET | `/search?q=` | Search exams |

### Paper Routes (`/api/papers`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/exam/:examId` | Get papers for an exam |
| GET | `/:id` | Get paper details |
| GET | `/:id/access` | Check if user has access |
| GET | `/:id/download` | Download PDF (paid only) |

### Payment Routes (`/api/payment`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/create-order` | Create Razorpay order |
| POST | `/verify` | Verify payment + grant access |
| POST | `/webhook` | Razorpay webhook handler |
| GET | `/history` | User payment history |

### User Routes (`/api/user`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| GET | `/purchases` | Get purchased papers |
| GET | `/wishlist` | Get wishlist |
| POST | `/wishlist/:paperId` | Add to wishlist |

### Admin Routes (`/api/admin`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Analytics overview |
| GET `/POST `/PUT `/DELETE | `/exams` | CRUD exams |
| GET `/POST `/PUT `/DELETE | `/papers` | CRUD papers |
| GET | `/users` | List all users |
| GET | `/orders` | All orders |
| PUT | `/orders/:id` | Update order status |

---

## MongoDB Collections Schema

### Users
```json
{
  "_id": "ObjectId",
  "name": "String (required)",
  "email": "String (unique, required)",
  "phone": "String",
  "password": "String (hashed)",
  "googleId": "String",
  "avatar": "String (URL)",
  "role": "user | admin | super_admin",
  "isEmailVerified": "Boolean",
  "refreshToken": "String",
  "createdAt": "Date"
}
```

### Exams
```json
{
  "_id": "ObjectId",
  "title": "String (required)",
  "slug": "String (unique)",
  "shortName": "String",
  "category": "upsc|ssc|banking|railway|defence|teaching|state|engineering|medical",
  "conductingBody": "String",
  "description": "String",
  "eligibility": "Object { age, education, nationality }",
  "examPattern": "Object { stages, subjects }",
  "syllabus": "Array of Sections",
  "selectionProcess": "Array of Stages",
  "importantDates": "Object",
  "vacancies": "Number",
  "salary": "String",
  "thumbnail": "String (URL)",
  "isTrending": "Boolean",
  "isActive": "Boolean",
  "createdAt": "Date"
}
```

### PredictedPapers
```json
{
  "_id": "ObjectId",
  "examId": "ObjectId (ref: Exam)",
  "title": "String",
  "description": "String",
  "pdfUrl": "String (Cloudinary URL)",
  "thumbnail": "String (URL)",
  "price": "Number (in paise for Razorpay)",
  "difficultyLevel": "easy|medium|hard",
  "predictionScore": "Number (0-100)",
  "totalQuestions": "Number",
  "paperType": "predicted|model|pyq|practice",
  "year": "Number",
  "isActive": "Boolean",
  "createdAt": "Date"
}
```

### Orders
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "paperId": "ObjectId (ref: PredictedPaper)",
  "amount": "Number",
  "razorpayOrderId": "String",
  "razorpayPaymentId": "String",
  "razorpaySignature": "String",
  "status": "pending|paid|failed|refunded",
  "createdAt": "Date"
}
```

### Purchases
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "paperId": "ObjectId (ref: PredictedPaper)",
  "orderId": "ObjectId (ref: Order)",
  "paymentId": "String",
  "amount": "Number",
  "purchasedAt": "Date",
  "isActive": "Boolean"
}
```

### OTPVerifications
```json
{
  "_id": "ObjectId",
  "email": "String",
  "otp": "String (hashed)",
  "purpose": "register|login|forgot-password",
  "expiresAt": "Date (10 min TTL)",
  "isUsed": "Boolean"
}
```

---

## Security Checklist

- [x] JWT Access + Refresh Token rotation
- [x] Password hashing with bcrypt (12 rounds)
- [x] Razorpay HMAC signature verification
- [x] Rate limiting (express-rate-limit)
- [x] Helmet.js security headers
- [x] MongoDB sanitize (express-mongo-sanitize)
- [x] XSS Protection (xss-clean)
- [x] CORS configured for production domains
- [x] OTP hashed before storage
- [x] PDF URLs signed/protected via middleware
- [x] Admin role verification on all admin routes
- [x] Input validation with Joi/Zod

---

## Deployment

### Backend (Railway / Render / EC2)
```bash
cd backend
npm run build  # if using TypeScript
npm start
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Push to GitHub, connect to Vercel
# Add env vars in Vercel dashboard
```

### MongoDB Atlas
- Create M0 free cluster
- Whitelist Vercel/Railway IPs
- Create DB user with readWrite role

---

## License
MIT
