"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star, Quote } from "lucide-react";

// ============================================================
// STATS SECTION
// ============================================================
const STATS = [
  { value: "2,00,000+", label: "Active Students", icon: "👥" },
  { value: "100+", label: "Exams Covered", icon: "📚" },
  { value: "94.2%", label: "Prediction Accuracy", icon: "🎯" },
  { value: "₹50 Crore+", label: "Student Savings vs Coaching", icon: "💰" },
];

export function StatsSection() {
  return (
    <section className="py-16 px-4 border-y border-surface-border bg-surface-card/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl sm:text-3xl font-display font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-secondary">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TESTIMONIALS SECTION
// ============================================================
const TESTIMONIALS = [
  {
    name: "Arjun Sharma",
    exam: "UPSC CSE 2024",
    score: "AIR 47",
    text: "ExamEdge's predicted paper had 30+ questions that appeared verbatim in UPSC Prelims 2024. I couldn't believe it when I saw the overlap. Absolutely worth every rupee.",
    avatar: "A",
    color: "bg-violet-500",
    stars: 5,
  },
  {
    name: "Priya Mehta",
    exam: "JEE Main 2024",
    score: "99.2 Percentile",
    text: "The JEE Main predicted paper covered all the surprise topics from Class 12 like Modern Physics and Coordination Chemistry. My JEE score jumped from 89th to 99th percentile!",
    avatar: "P",
    color: "bg-indigo-500",
    stars: 5,
  },
  {
    name: "Rahul Gupta",
    exam: "SSC CGL 2024",
    score: "Selected",
    text: "Got exactly 18 out of 20 predicted Quantitative Aptitude questions in the Tier-1 exam. ExamEdge's analysis is on another level. Highly recommend.",
    avatar: "R",
    color: "bg-blue-500",
    stars: 5,
  },
  {
    name: "Sneha Joshi",
    exam: "NEET UG 2024",
    score: "720/720",
    text: "I scored a perfect 720 in NEET and ExamEdge's Biology predicted paper was a big part of my strategy. The Genetics and Evolution questions were spot on.",
    avatar: "S",
    color: "bg-teal-500",
    stars: 5,
  },
  {
    name: "Vikram Singh",
    exam: "IBPS PO 2024",
    score: "Selected in PNB",
    text: "The reasoning and English predicted sections were very accurate. The practice gave me confidence during the actual exam. ExamEdge is a game changer for banking exams.",
    avatar: "V",
    color: "bg-emerald-500",
    stars: 5,
  },
  {
    name: "Kavya Reddy",
    exam: "NEET PG 2024",
    score: "AIR 312",
    text: "NEET PG is extremely unpredictable but ExamEdge nailed the high-yield topics. The clinical case-based questions they predicted were extremely similar to what came in the exam.",
    avatar: "K",
    color: "bg-pink-500",
    stars: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-surface-card/20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="badge-brand mb-4 inline-block">Success Stories</span>
          <h2 className="section-title mb-3">
            Toppers Trust <span className="gradient-text">ExamEdge</span>
          </h2>
          <p className="section-subtitle">
            Join 2L+ students who cracked their exams with our AI predictions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card p-6 relative"
            >
              <Quote className="absolute top-4 right-4 w-6 h-6 text-brand-500/30" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star
                    key={si}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="text-sm text-secondary leading-relaxed mb-5 line-clamp-4">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-white font-display`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white font-display">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-custom">
                    {t.exam} •{" "}
                    <span className="text-brand-400 font-semibold">
                      {t.score}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CTA SECTION
// ============================================================
export function CTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950" />
      <div className="orb orb-brand w-[500px] h-[500px] -left-40 top-0 opacity-20" />
      <div className="orb orb-accent w-[300px] h-[300px] right-10 top-10 opacity-15" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Predict Your Way to{" "}
            <span className="gradient-text-orange">Success?</span>
          </h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto mb-10">
            Access AI-predicted question papers for UPSC, JEE, NEET, SSC and
            100+ more exams. Your selection is just one paper away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/exams"
              className="btn-accent flex items-center gap-2 text-base w-full sm:w-auto justify-center"
            >
              Browse All Exams
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth?tab=register"
              className="btn-ghost flex items-center gap-2 text-base w-full sm:w-auto justify-center"
            >
              Create Free Account
            </Link>
          </div>

          <p className="text-xs text-muted-custom mt-6">
            No subscription required. Pay only for the papers you need.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default StatsSection;
