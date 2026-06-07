"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const TRENDING_EXAMS = [
  { label: "UPSC CSE 2025", href: "/exam/upsc-cse", icon: "🏛️" },
  { label: "JEE Main 2025", href: "/exam/jee-main", icon: "⚙️" },
  { label: "NEET UG 2025", href: "/exam/neet-ug", icon: "🩺" },
  { label: "SSC CGL 2025", href: "/exam/ssc-cgl", icon: "📋" },
  { label: "IBPS PO 2025", href: "/exam/ibps-po", icon: "🏦" },
  { label: "NDA 2025", href: "/exam/nda", icon: "⚔️" },
];

const FLOATING_BADGES = [
  { text: "UPSC 2025", color: "from-violet-500 to-violet-700", x: "-5%", y: "25%" },
  { text: "JEE Main", color: "from-indigo-500 to-indigo-700", x: "88%", y: "20%" },
  { text: "NEET UG", color: "from-teal-500 to-teal-700", x: "-3%", y: "65%" },
  { text: "SSC CGL", color: "from-blue-500 to-blue-700", x: "85%", y: "60%" },
  { text: "RBI Grade B", color: "from-emerald-500 to-emerald-700", x: "40%", y: "88%" },
];

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/exams?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero bg-grid" />

      {/* Orbs */}
      <div className="orb orb-brand w-[600px] h-[600px] -top-40 -left-40 animate-float" />
      <div className="orb orb-accent w-[400px] h-[400px] bottom-20 right-10 animate-float animation-delay-300" />
      <div className="orb orb-purple w-[300px] h-[300px] top-40 right-40 animate-float animation-delay-200" />

      {/* Floating Exam Badges */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {FLOATING_BADGES.map((badge, i) => (
          <motion.div
            key={badge.text}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.4, type: "spring" }}
            style={{ left: badge.x, top: badge.y }}
            className="absolute"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${badge.color} shadow-lg border border-white/10`}
            >
              {badge.text}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 badge-brand mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>India&apos;s #1 AI Exam Prediction Platform</span>
          <span className="inline-flex items-center gap-1 bg-accent-500/20 text-accent-400 text-xs px-2 py-0.5 rounded-full border border-accent-500/30">
            <Zap className="w-2.5 h-2.5" />
            New
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] mb-6"
        >
          Predict. Prepare.{" "}
          <span className="gradient-text">Succeed.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered predicted question papers for 100+ Government Exams,
          JEE, NEET & more. Backed by deep analysis of 10+ years of exam patterns.
        </motion.p>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="flex gap-2 p-2 rounded-2xl bg-surface-card/80 backdrop-blur border border-surface-border shadow-card">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-5 h-5 text-muted-custom flex-shrink-0" />
              <input
                type="text"
                placeholder="Search exam — UPSC, JEE Main, NEET, SSC CGL..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-muted-custom text-base outline-none"
              />
            </div>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 flex-shrink-0"
            >
              <span className="hidden sm:block">Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.form>

        {/* Trending Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="flex items-center gap-1 text-xs text-muted-custom">
            <TrendingUp className="w-3.5 h-3.5" />
            Trending:
          </span>
          {TRENDING_EXAMS.map((exam) => (
            <Link
              key={exam.href}
              href={exam.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-secondary border border-surface-border hover:border-brand-500/50 hover:text-white hover:bg-brand-500/10 transition-all"
            >
              <span>{exam.icon}</span>
              {exam.label}
            </Link>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
        >
          {[
            { value: "2L+", label: "Students" },
            { value: "100+", label: "Exams Covered" },
            { value: "94%", label: "Accuracy Rate" },
            { value: "5000+", label: "Questions Predicted" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-display font-bold gradient-text">
                {stat.value}
              </div>
              <div className="text-xs text-muted-custom mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
    </section>
  );
}
