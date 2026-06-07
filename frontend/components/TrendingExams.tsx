"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, FileText, TrendingUp, Lock, ArrowRight } from "lucide-react";

const ALL_EXAMS = [
  // Government
  {
    title: "UPSC Civil Services",
    shortName: "UPSC CSE",
    slug: "upsc-cse",
    category: "upsc",
    icon: "🏛️",
    students: "12L+",
    papers: 8,
    color: "from-violet-500/20 to-violet-700/10",
    borderColor: "border-violet-500/20",
    badge: "Most Popular",
    badgeColor: "badge-brand",
  },
  {
    title: "SSC CGL",
    shortName: "SSC CGL",
    slug: "ssc-cgl",
    category: "ssc",
    icon: "📋",
    students: "8L+",
    papers: 6,
    color: "from-blue-500/20 to-blue-700/10",
    borderColor: "border-blue-500/20",
    badge: "Trending",
    badgeColor: "badge-accent",
  },
  {
    title: "SBI PO",
    shortName: "SBI PO",
    slug: "sbi-po",
    category: "banking",
    icon: "🏦",
    students: "6L+",
    papers: 5,
    color: "from-emerald-500/20 to-emerald-700/10",
    borderColor: "border-emerald-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "IBPS Clerk",
    shortName: "IBPS Clerk",
    slug: "ibps-clerk",
    category: "banking",
    icon: "🏦",
    students: "5L+",
    papers: 4,
    color: "from-emerald-500/20 to-emerald-700/10",
    borderColor: "border-emerald-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "Railway NTPC",
    shortName: "RRB NTPC",
    slug: "rrb-ntpc",
    category: "railway",
    icon: "🚂",
    students: "7L+",
    papers: 5,
    color: "from-amber-500/20 to-amber-700/10",
    borderColor: "border-amber-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "NDA Exam",
    shortName: "NDA",
    slug: "nda",
    category: "defence",
    icon: "⚔️",
    students: "4L+",
    papers: 4,
    color: "from-red-500/20 to-red-700/10",
    borderColor: "border-red-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "SSC CHSL",
    shortName: "SSC CHSL",
    slug: "ssc-chsl",
    category: "ssc",
    icon: "📋",
    students: "5L+",
    papers: 4,
    color: "from-blue-500/20 to-blue-700/10",
    borderColor: "border-blue-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "RBI Grade B",
    shortName: "RBI Grade B",
    slug: "rbi-grade-b",
    category: "banking",
    icon: "🏦",
    students: "3L+",
    papers: 6,
    color: "from-emerald-500/20 to-emerald-700/10",
    borderColor: "border-emerald-500/20",
    badge: "Premium",
    badgeColor: "badge-accent",
  },
  // Engineering
  {
    title: "JEE Main 2025",
    shortName: "JEE Main",
    slug: "jee-main",
    category: "engineering",
    icon: "⚙️",
    students: "10L+",
    papers: 8,
    color: "from-indigo-500/20 to-indigo-700/10",
    borderColor: "border-indigo-500/20",
    badge: "Hot 🔥",
    badgeColor: "badge-accent",
  },
  {
    title: "JEE Advanced 2025",
    shortName: "JEE Advanced",
    slug: "jee-advanced",
    category: "engineering",
    icon: "⚙️",
    students: "3L+",
    papers: 6,
    color: "from-indigo-500/20 to-indigo-700/10",
    borderColor: "border-indigo-500/20",
    badge: "IIT Entrance",
    badgeColor: "badge-brand",
  },
  // Medical
  {
    title: "NEET UG 2025",
    shortName: "NEET UG",
    slug: "neet-ug",
    category: "medical",
    icon: "🩺",
    students: "15L+",
    papers: 8,
    color: "from-teal-500/20 to-teal-700/10",
    borderColor: "border-teal-500/20",
    badge: "Most Appeared 🩺",
    badgeColor: "badge-success",
  },
  {
    title: "NEET PG 2025",
    shortName: "NEET PG",
    slug: "neet-pg",
    category: "medical",
    icon: "🩺",
    students: "2L+",
    papers: 5,
    color: "from-teal-500/20 to-teal-700/10",
    borderColor: "border-teal-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "AIIMS Nursing",
    shortName: "AIIMS Nursing",
    slug: "aiims-nursing",
    category: "medical",
    icon: "🩺",
    students: "80K+",
    papers: 3,
    color: "from-teal-500/20 to-teal-700/10",
    borderColor: "border-teal-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "CTET 2025",
    shortName: "CTET",
    slug: "ctet",
    category: "teaching",
    icon: "📚",
    students: "4L+",
    papers: 4,
    color: "from-pink-500/20 to-pink-700/10",
    borderColor: "border-pink-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "Railway Group D",
    shortName: "RRB Group D",
    slug: "rrb-group-d",
    category: "railway",
    icon: "🚂",
    students: "9L+",
    papers: 5,
    color: "from-amber-500/20 to-amber-700/10",
    borderColor: "border-amber-500/20",
    badge: null,
    badgeColor: "",
  },
  {
    title: "CDS Exam",
    shortName: "CDS",
    slug: "cds",
    category: "defence",
    icon: "⚔️",
    students: "2L+",
    papers: 4,
    color: "from-red-500/20 to-red-700/10",
    borderColor: "border-red-500/20",
    badge: null,
    badgeColor: "",
  },
];

const FILTER_TABS = [
  { id: "all", label: "All Exams" },
  { id: "engineering", label: "Engineering 🔧" },
  { id: "medical", label: "Medical 🩺" },
  { id: "upsc", label: "UPSC" },
  { id: "ssc", label: "SSC" },
  { id: "banking", label: "Banking" },
  { id: "railway", label: "Railway" },
  { id: "defence", label: "Defence" },
];

export default function TrendingExams() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const filtered =
    activeFilter === "all"
      ? ALL_EXAMS
      : ALL_EXAMS.filter((e) => e.category === activeFilter);

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  return (
    <section className="py-20 px-4 bg-surface-card/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <span className="badge-accent mb-3 inline-block">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Popular Exams
            </span>
            <h2 className="section-title">
              Find Your <span className="gradient-text">Exam</span>
            </h2>
          </div>
          <Link
            href="/exams"
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            View All Exams
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setShowAll(false);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeFilter === tab.id
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-white/5 text-secondary border border-surface-border hover:border-brand-500/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Exam Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map((exam, i) => (
            <motion.div
              key={exam.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link href={`/exam/${exam.slug}`}>
                <div
                  className={`card p-5 cursor-pointer group h-full border ${exam.borderColor}`}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${exam.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{exam.icon}</div>
                      {exam.badge && (
                        <span className={`badge ${exam.badgeColor} text-xs`}>
                          {exam.badge}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-display font-bold text-white text-sm mb-1 leading-tight">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-muted-custom mb-4 capitalize">
                      {exam.category}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-secondary">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{exam.students} Students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{exam.papers} Papers</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-brand-400">
                        <Lock className="w-3 h-3" />
                        <span>Predicted Paper</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Show More */}
        {filtered.length > 8 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setShowAll(!showAll)}
              className="btn-ghost inline-flex items-center gap-2"
            >
              {showAll ? "Show Less" : `Show All ${filtered.length} Exams`}
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  showAll ? "rotate-90" : ""
                }`}
              />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
