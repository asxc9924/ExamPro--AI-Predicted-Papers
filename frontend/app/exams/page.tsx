"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, BookOpen, Loader2 } from "lucide-react";
import { examApi } from "@/lib/api";
import type { Exam, ExamCategory } from "@/types";
import { CATEGORY_META } from "@/types";
import Link from "next/link";

const CATEGORIES: { id: ExamCategory | "all"; label: string; icon: string }[] = [
  { id: "all",         label: "All",         icon: "📄" },
  { id: "engineering", label: "Engineering", icon: "⚙️" },
  { id: "medical",     label: "Medical",     icon: "🩺" },
  { id: "upsc",        label: "UPSC",        icon: "🏛️" },
  { id: "ssc",         label: "SSC",         icon: "📋" },
  { id: "banking",     label: "Banking",     icon: "🏦" },
  { id: "railway",     label: "Railway",     icon: "🚂" },
  { id: "defence",     label: "Defence",     icon: "⚔️" },
  { id: "teaching",    label: "Teaching",    icon: "📚" },
  { id: "state",       label: "State",       icon: "🗺️" },
];

function ExamsPageContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [exams, setExams]             = useState<Exam[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState(searchParams.get("search") || "");
  const [category, setCategory]       = useState<ExamCategory | "all">("all");

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 18 };
      if (category !== "all") params.category = category;
      if (search.trim())      params.search   = search.trim();

      const { data } = await examApi.getAll(params);
      if (data.data) {
        setExams(data.data.data);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch { setExams([]); }
    finally { setLoading(false); }
  }, [page, category, search]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExams();
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Browse All Exams
          </h1>
          <p className="text-secondary">
            {total.toLocaleString()} exams — find your paper and start preparing
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
              <input
                type="text"
                placeholder="Search UPSC, JEE, NEET, SSC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </form>
          <div className="flex items-center gap-1 text-secondary text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter:</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => { setCategory(cat.id as ExamCategory | "all"); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat.id
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-white/5 text-secondary border border-surface-border hover:border-brand-500/50 hover:text-white"
              }`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Exam Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-custom mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No exams found</h3>
            <p className="text-secondary text-sm">Try a different search or category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam, i) => {
                const catMeta = CATEGORY_META[exam.category];
                return (
                  <motion.div key={exam._id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}>
                    <Link href={`/exam/${exam.slug}`}>
                      <div className="card p-5 group cursor-pointer h-full">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl">{catMeta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-bold text-white text-sm leading-tight group-hover:text-brand-300 transition-colors line-clamp-2">{exam.title}</h3>
                            <p className="text-xs text-muted-custom mt-0.5">{exam.conductingBody}</p>
                          </div>
                        </div>
                        <p className="text-xs text-secondary line-clamp-2 mb-3">{exam.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`badge text-xs ${catMeta.color}`}>{catMeta.label}</span>
                          {exam.isTrending && <span className="text-xs text-accent-400 font-medium">🔥 Trending</span>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-ghost text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                <span className="text-secondary text-sm">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-ghost text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-32"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>}>
      <ExamsPageContent />
    </Suspense>
  );
}
