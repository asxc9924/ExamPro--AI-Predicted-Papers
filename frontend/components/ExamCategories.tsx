"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ExamCategory } from "@/types";
import { CATEGORY_META } from "@/types";

const CATEGORIES: { id: ExamCategory; count: string }[] = [
  { id: "upsc", count: "15+ Exams" },
  { id: "ssc", count: "8+ Exams" },
  { id: "banking", count: "12+ Exams" },
  { id: "railway", count: "6+ Exams" },
  { id: "defence", count: "5+ Exams" },
  { id: "teaching", count: "10+ Exams" },
  { id: "engineering", count: "4+ Exams" },
  { id: "medical", count: "5+ Exams" },
  { id: "state", count: "50+ Exams" },
];

export default function ExamCategories() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="badge-brand mb-4 inline-block">All Categories</span>
          <h2 className="section-title mb-3">
            Browse by <span className="gradient-text">Exam Category</span>
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            From UPSC to JEE to NEET — we cover every major exam with
            AI-predicted papers and deep analysis.
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => {
            const meta = CATEGORY_META[cat.id];
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link href={`/category/${cat.id}`}>
                  <div className="card p-5 cursor-pointer group text-center h-full">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {meta.icon}
                    </div>
                    <h3 className="font-display font-bold text-white text-sm mb-1">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-muted-custom mb-2">
                      {meta.description}
                    </p>
                    <span className={`badge text-xs ${meta.color}`}>
                      {cat.count}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
