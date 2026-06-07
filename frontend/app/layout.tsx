import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "ExamEdge — AI-Predicted Question Papers for Government Exams",
    template: "%s | ExamEdge",
  },
  description:
    "India's most advanced exam prediction platform. Get AI-powered predicted question papers for UPSC, SSC, Banking, Railway, NDA, JEE, NEET and more.",
  keywords: [
    "government exam preparation",
    "predicted question papers",
    "UPSC preparation",
    "SSC CGL",
    "banking exams",
    "JEE Main prediction",
    "NEET prediction",
    "railway exams",
    "NDA CDS",
    "AI exam prediction",
  ],
  authors: [{ name: "ExamEdge Team" }],
  creator: "ExamEdge",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://examedge.in",
    siteName: "ExamEdge",
    title: "ExamEdge — AI-Predicted Question Papers",
    description:
      "Get AI-powered predicted question papers for 100+ government exams & entrance tests.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExamEdge",
    description: "AI-Predicted Question Papers for Government Exams",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1E1B4B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-surface font-body antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1A1928",
                border: "1px solid #2D2B45",
                color: "#F8F7FF",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
