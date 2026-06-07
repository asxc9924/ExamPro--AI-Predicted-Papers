"use client";

import { motion } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Zap,
  BarChart3,
  Lock,
  Download,
  Clock,
  Trophy,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Paper Prediction",
    description:
      "Our ML models analyze 10+ years of exam data to predict the most likely questions with 94% accuracy.",
    gradient: "from-violet-500 to-indigo-600",
    glow: "rgba(99, 102, 241, 0.3)",
  },
  {
    icon: BarChart3,
    title: "PYQ Deep Analysis",
    description:
      "Comprehensive analysis of Previous Year Questions with topic-wise weightage and trend mapping.",
    gradient: "from-blue-500 to-cyan-600",
    glow: "rgba(59, 130, 246, 0.3)",
  },
  {
    icon: ShieldCheck,
    title: "Verified Predictions",
    description:
      "Every predicted paper is reviewed by top subject-matter experts before being published.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.3)",
  },
  {
    icon: Lock,
    title: "Secure Access",
    description:
      "Papers are encrypted and DRM-protected. Only purchased papers are unlocked per user.",
    gradient: "from-orange-500 to-amber-600",
    glow: "rgba(249, 115, 22, 0.3)",
  },
  {
    icon: Zap,
    title: "Instant Access",
    description:
      "Get immediate access to your purchased papers right after payment confirmation.",
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236, 72, 153, 0.3)",
  },
  {
    icon: Download,
    title: "PDF Download",
    description:
      "Download your purchased papers in high-quality PDF format for offline study anytime.",
    gradient: "from-purple-500 to-violet-600",
    glow: "rgba(139, 92, 246, 0.3)",
  },
  {
    icon: Clock,
    title: "Lifetime Access",
    description:
      "One-time purchase gives you permanent access. No subscriptions, no renewals.",
    gradient: "from-indigo-500 to-blue-600",
    glow: "rgba(79, 70, 229, 0.3)",
  },
  {
    icon: Trophy,
    title: "Exam Specific",
    description:
      "Papers tailored for each exam — UPSC, JEE, NEET, SSC, Banking with exam-pattern accuracy.",
    gradient: "from-yellow-500 to-orange-600",
    glow: "rgba(234, 179, 8, 0.3)",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-brand mb-4 inline-block">Why ExamEdge</span>
          <h2 className="section-title mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Crack Your Exam</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            From AI-powered predictions to secure payment and instant PDF
            access — we&apos;ve built the most advanced exam prep platform in India.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="card p-6 group cursor-default"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{ boxShadow: `0 0 20px ${feature.glow}` }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-display font-bold text-white mb-2 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
