"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Lock, Unlock, FileText, Star, Target, Users,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle,
  BookOpen, Calendar, Award, TrendingUp, Download, Eye
} from "lucide-react";
import { examApi, paperApi, paymentApi } from "@/lib/api";
import { openRazorpayCheckout, formatPrice } from "@/lib/razorpay";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { Exam, PredictedPaper } from "@/types";
import Link from "next/link";

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   color: "badge-success",  bar: "bg-emerald-500", width: "w-1/3" },
  medium: { label: "Medium", color: "badge-accent",   bar: "bg-amber-500",   width: "w-2/3" },
  hard:   { label: "Hard",   color: "bg-red-500/20 text-red-300 border-red-500/30 badge", bar: "bg-red-500", width: "w-full" },
};

// Fallback static data for SSG builds
const STATIC_EXAM_DATA: Record<string, Partial<Exam>> = {
  "jee-main": {
    title: "JEE Main 2025",
    shortName: "JEE Main",
    category: "engineering",
    conductingBody: "National Testing Agency (NTA)",
    description: "Joint Entrance Examination Main (JEE Main) is a national level entrance examination for admission to B.E./B.Tech courses in NITs, IIITs, CFTIs and other institutions. It also serves as the qualifying exam for JEE Advanced (IIT admissions).",
    eligibility: { ageMin: 0, ageMax: 0, education: "10+2 with PCM — minimum 75% (65% for SC/ST)", nationality: "Indian / OCI" },
    examPattern: {
      stages: [
        { name: "Paper 1 (B.E./B.Tech)", type: "objective", duration: 180, marks: 300, subjects: ["Physics", "Chemistry", "Mathematics"] },
        { name: "Paper 2A (B.Arch)", type: "objective", duration: 180, marks: 400, subjects: ["Mathematics", "Aptitude", "Drawing"] },
      ],
      totalMarks: 300, negativeMark: true,
    },
    syllabus: [
      { name: "Physics", topics: ["Mechanics", "Thermodynamics", "Electrostatics", "Magnetism", "Optics", "Modern Physics", "Waves & Sound", "SHM"] },
      { name: "Chemistry", topics: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry", "Coordination Compounds", "Electrochemistry", "Thermodynamics"] },
      { name: "Mathematics", topics: ["Algebra", "Calculus", "Coordinate Geometry", "Vectors & 3D", "Statistics", "Trigonometry", "Matrices & Determinants"] },
    ],
    selectionProcess: ["Session 1 (January)", "Session 2 (April)", "JEE Advanced Qualification", "JoSAA Counselling"],
    vacancies: 50000,
    salary: "Varies (Top IITs/NITs packages 10–50 LPA)",
    isTrending: true,
  },
  "neet-ug": {
    title: "NEET UG 2025",
    shortName: "NEET UG",
    category: "medical",
    conductingBody: "National Testing Agency (NTA)",
    description: "NEET UG is the single national entrance examination for admission to MBBS, BDS, BAMS, BSMS, BUMS, BHMS, and other medical courses across India. Over 20 lakh students appear every year.",
    eligibility: { ageMin: 17, ageMax: 25, education: "10+2 with PCB — minimum 50% (40% for SC/ST/OBC)", nationality: "Indian / OCI / NRI / Foreign Nationals" },
    examPattern: {
      stages: [
        { name: "NEET UG Paper", type: "objective", duration: 200, marks: 720, subjects: ["Physics (50Q)", "Chemistry (50Q)", "Botany (50Q)", "Zoology (50Q)"] },
      ],
      totalMarks: 720, negativeMark: true,
    },
    syllabus: [
      { name: "Physics", topics: ["Physical World & Measurement", "Kinematics", "Laws of Motion", "Work-Energy-Power", "Thermodynamics", "Optics", "Modern Physics", "Semiconductors"] },
      { name: "Chemistry", topics: ["Basic Chemistry", "Atomic Structure", "Chemical Bonding", "States of Matter", "Organic Chemistry", "Coordination Compounds", "Biomolecules"] },
      { name: "Biology", topics: ["Cell Biology", "Genetics & Evolution", "Human Physiology", "Plant Physiology", "Reproduction", "Ecology", "Biotechnology"] },
    ],
    selectionProcess: ["NEET UG Written Exam", "Merit List", "MCC / State Counselling", "Seat Allotment"],
    vacancies: 100000,
    salary: "MBBS stipend ₹40,000–₹1,00,000/month",
    isTrending: true,
  },
  "upsc-cse": {
    title: "UPSC Civil Services Examination 2025",
    shortName: "UPSC CSE",
    category: "upsc",
    conductingBody: "Union Public Service Commission (UPSC)",
    description: "The UPSC Civil Services Examination is conducted annually to recruit candidates for the Indian Administrative Service (IAS), Indian Police Service (IPS), Indian Foreign Service (IFS) and other central services.",
    eligibility: { ageMin: 21, ageMax: 32, education: "Bachelor's Degree from any recognized university", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "Prelims (CSAT)", type: "objective", duration: 120, marks: 400, subjects: ["GS Paper I", "CSAT Paper II"] },
        { name: "Mains", type: "descriptive", duration: 180, marks: 1750, subjects: ["GS Papers I-IV", "Essay", "Optional Subject"] },
        { name: "Personality Test (Interview)", type: "interview", marks: 275 },
      ],
      totalMarks: 2025, negativeMark: true,
    },
    syllabus: [
      { name: "General Studies I", topics: ["Indian History", "World History", "Geography", "Art & Culture", "Social Issues"] },
      { name: "General Studies II", topics: ["Polity", "Governance", "Constitution", "Social Justice", "International Relations"] },
      { name: "General Studies III", topics: ["Economy", "Environment", "Science & Technology", "Internal Security", "Disaster Management"] },
      { name: "General Studies IV", topics: ["Ethics", "Integrity", "Aptitude", "Case Studies"] },
      { name: "CSAT", topics: ["Reading Comprehension", "Logical Reasoning", "Analytical Ability", "Basic Numeracy"] },
    ],
    selectionProcess: ["Prelims", "Mains", "Interview", "Medical Test", "Final Merit List"],
    vacancies: 1056,
    salary: "₹56,100 – ₹2,50,000 per month (IAS Scale)",
    isTrending: true,
  },
};

export default function ExamDetailClient({ slug }: { slug: string }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [papers, setPapers] = useState<PredictedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [openSyllabusIdx, setOpenSyllabusIdx] = useState<number | null>(0);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await examApi.getBySlug(slug);
        if (data.data) {
          setExam(data.data.exam);
          setPapers(data.data.papers);
        }
      } catch {
        // Use static fallback if API not available
        const staticData = STATIC_EXAM_DATA[slug];
        if (staticData) {
          setExam({ ...staticData, _id: slug, slug, isActive: true, createdAt: new Date().toISOString() } as Exam);
          setPapers(MOCK_PAPERS[slug] || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleUnlockPaper = async (paper: PredictedPaper) => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/exam/${slug}`);
      return;
    }
    setPaymentLoading(paper._id);
    try {
      const { data: orderData } = await paymentApi.createOrder(paper._id);
      if (!orderData.data) throw new Error("Failed to create order");
      const { order } = orderData.data;

      await openRazorpayCheckout({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: exam?.title || "Exam Paper",
        description: paper.title,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        onSuccess: async (response) => {
          try {
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paperId: paper._id,
            });
            toast.success("Payment successful! Paper unlocked.");
            setPapers((prev) => prev.map((p) => p._id === paper._id ? { ...p, hasPurchased: true } : p));
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        onDismiss: () => toast.info("Payment cancelled."),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      toast.error(message);
    } finally {
      setPaymentLoading(null);
    }
  };

  if (loading) return <ExamDetailSkeleton />;
  if (!exam) return <NotFound slug={slug} />;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "pattern", label: "Exam Pattern" },
    { id: "syllabus", label: "Syllabus" },
    { id: "papers", label: `Papers (${papers.length})` },
  ];

  return (
    <div className="pt-20 pb-16 min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-brand-950/80 to-surface border-b border-surface-border">
        <div className="orb orb-brand w-96 h-96 -top-20 -right-20 opacity-10" />
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-3xl flex-shrink-0 shadow-glow">
              {exam.category === "engineering" ? "⚙️" : exam.category === "medical" ? "🩺" : exam.category === "upsc" ? "🏛️" : exam.category === "banking" ? "🏦" : exam.category === "railway" ? "🚂" : exam.category === "defence" ? "⚔️" : "📋"}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="badge-brand capitalize">{exam.category}</span>
                {exam.isTrending && <span className="badge-accent"><TrendingUp className="w-3 h-3 inline mr-1" />Trending</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2">{exam.title}</h1>
              <p className="text-secondary mb-4 max-w-2xl">{exam.conductingBody}</p>
              <div className="flex flex-wrap gap-4 text-sm text-secondary">
                {exam.vacancies && (<div className="flex items-center gap-1"><Users className="w-4 h-4 text-brand-400" />{exam.vacancies.toLocaleString()} Vacancies</div>)}
                {exam.salary && (<div className="flex items-center gap-1"><Award className="w-4 h-4 text-accent-400" />{exam.salary}</div>)}
                <div className="flex items-center gap-1"><FileText className="w-4 h-4 text-emerald-400" />{papers.length} Predicted Papers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface-card rounded-xl border border-surface-border mb-8 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-brand-600 text-white shadow-glow" : "text-secondary hover:text-white"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="card p-6">
                  <h2 className="font-display font-bold text-white text-lg mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-400" />About this Exam</h2>
                  <p className="text-secondary leading-relaxed">{exam.description}</p>
                </div>
                <div className="card p-6">
                  <h2 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" />Eligibility</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {exam.eligibility.ageMin !== undefined && exam.eligibility.ageMax !== undefined && exam.eligibility.ageMax > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-surface-border">
                        <p className="text-xs text-muted-custom mb-1">Age Limit</p>
                        <p className="text-white font-semibold">{exam.eligibility.ageMin}–{exam.eligibility.ageMax} years</p>
                      </div>
                    )}
                    <div className="p-4 rounded-xl bg-white/5 border border-surface-border col-span-full">
                      <p className="text-xs text-muted-custom mb-1">Education</p>
                      <p className="text-white font-semibold">{exam.eligibility.education}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-surface-border">
                      <p className="text-xs text-muted-custom mb-1">Nationality</p>
                      <p className="text-white font-semibold">{exam.eligibility.nationality}</p>
                    </div>
                  </div>
                </div>
                <div className="card p-6">
                  <h2 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-accent-400" />Selection Process</h2>
                  <div className="flex flex-wrap gap-2">
                    {exam.selectionProcess.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-surface-border text-sm text-white">
                          <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {step}
                        </div>
                        {i < exam.selectionProcess.length - 1 && <ChevronRight className="w-4 h-4 text-muted-custom hidden sm:block" />}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pattern Tab */}
            {activeTab === "pattern" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {exam.examPattern.stages.map((stage, i) => (
                  <div key={i} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-white">{stage.name}</h3>
                      <span className="badge-brand capitalize">{stage.type}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {stage.duration && (<div className="text-center p-3 rounded-xl bg-white/5"><p className="text-xs text-muted-custom">Duration</p><p className="text-white font-bold">{stage.duration} min</p></div>)}
                      {stage.marks && (<div className="text-center p-3 rounded-xl bg-white/5"><p className="text-xs text-muted-custom">Total Marks</p><p className="text-white font-bold">{stage.marks}</p></div>)}
                      {exam.examPattern.negativeMark && (<div className="text-center p-3 rounded-xl bg-white/5"><p className="text-xs text-muted-custom">Negative Mark</p><p className="text-red-400 font-bold">Yes (−⅓)</p></div>)}
                    </div>
                    {stage.subjects && (
                      <div>
                        <p className="text-xs text-muted-custom mb-2">Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {stage.subjects.map((s) => (<span key={s} className="badge-brand text-xs">{s}</span>))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Syllabus Tab */}
            {activeTab === "syllabus" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {exam.syllabus.map((section, i) => (
                  <div key={i} className="card overflow-hidden">
                    <button onClick={() => setOpenSyllabusIdx(openSyllabusIdx === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-600/30 flex items-center justify-center text-sm font-bold text-brand-300">{i + 1}</div>
                        <h3 className="font-display font-bold text-white">{section.name}</h3>
                        <span className="badge-brand text-xs">{section.topics.length} Topics</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-secondary transition-transform ${openSyllabusIdx === i ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {openSyllabusIdx === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                          className="overflow-hidden border-t border-surface-border">
                          <div className="p-5 flex flex-wrap gap-2">
                            {section.topics.map((topic) => (
                              <span key={topic} className="px-3 py-1.5 rounded-lg text-xs text-secondary bg-white/5 border border-surface-border hover:border-brand-500/30 transition-all">{topic}</span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Papers Tab */}
            {activeTab === "papers" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {papers.length === 0 ? (
                  <div className="card p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-custom mx-auto mb-4" />
                    <p className="text-secondary">Predicted papers coming soon for this exam.</p>
                  </div>
                ) : (
                  papers.map((paper) => {
                    const diff = DIFFICULTY_CONFIG[paper.difficultyLevel];
                    const isOwned = paper.hasPurchased;
                    return (
                      <div key={paper._id} className="card p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Thumbnail */}
                          <div className="w-full sm:w-32 h-32 rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            <FileText className="w-10 h-10 text-brand-300" />
                            {!isOwned && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="w-6 h-6 text-white/60" /></div>)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <h3 className="font-display font-bold text-white text-base">{paper.title}</h3>
                              {isOwned && (<span className="badge-success"><Unlock className="w-3 h-3" />Unlocked</span>)}
                            </div>
                            <p className="text-sm text-secondary mb-3 line-clamp-2">{paper.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-secondary mb-4">
                              <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{paper.totalQuestions} Questions</div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-brand-400" />
                                <span>Prediction: </span>
                                <span className="text-brand-400 font-bold">{paper.predictionScore}%</span>
                              </div>
                              <span className={`${diff.color} text-xs`}>{diff.label}</span>
                              {paper.year && <span>Year: {paper.year}</span>}
                            </div>
                            {/* Prediction Score Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-custom">AI Confidence</span>
                                <span className="text-brand-400 font-bold">{paper.predictionScore}%</span>
                              </div>
                              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${paper.predictionScore}%` }}
                                  transition={{ duration: 1, delay: 0.3 }}
                                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                {isOwned ? (
                                  <span className="text-emerald-400 font-bold text-sm">Access Granted ✓</span>
                                ) : (
                                  <div>
                                    <span className="text-2xl font-display font-bold text-white">{formatPrice(paper.price)}</span>
                                    <span className="text-muted-custom text-xs ml-2">one-time</span>
                                  </div>
                                )}
                              </div>
                              {isOwned ? (
                                <div className="flex gap-2">
                                  <button className="btn-primary flex items-center gap-2 text-sm py-2 px-4"><Eye className="w-4 h-4" />View</button>
                                  <button className="btn-ghost flex items-center gap-2 text-sm py-2 px-4"><Download className="w-4 h-4" />Download</button>
                                </div>
                              ) : (
                                <button onClick={() => handleUnlockPaper(paper)} disabled={!!paymentLoading}
                                  className="btn-accent flex items-center gap-2 text-sm py-2 px-5">
                                  {paymentLoading === paper._id ? (
                                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span>
                                  ) : (<><Lock className="w-4 h-4" />Unlock Paper</>)}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            {/* Quick Stats */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-accent-400" />Exam Snapshot</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Category", value: exam.category.toUpperCase() },
                  { label: "Conducting Body", value: exam.conductingBody },
                  { label: "Vacancies", value: exam.vacancies?.toLocaleString() || "Varies" },
                  { label: "Papers Available", value: `${papers.length} Predicted Papers` },
                  { label: "Exam Stages", value: `${exam.examPattern.stages.length} Stage${exam.examPattern.stages.length > 1 ? "s" : ""}` },
                  { label: "Negative Marking", value: exam.examPattern.negativeMark ? "Yes" : "No" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className="text-muted-custom">{item.label}</span>
                    <span className="text-white font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Dates */}
            {exam.importantDates && exam.importantDates.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-400" />Important Dates</h3>
                <div className="space-y-2">
                  {exam.importantDates.map((date, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-secondary">{date.event}</span>
                      <span className="text-white font-medium">{date.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Box */}
            {papers.length > 0 && !papers.every(p => p.hasPurchased) && (
              <div className="card p-5 border-brand-500/30 bg-gradient-to-b from-brand-900/40 to-transparent">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-display font-bold text-white mb-2">Unlock AI Predictions</h3>
                  <p className="text-xs text-secondary mb-4">Get predicted papers with {papers[0]?.predictionScore || 90}%+ accuracy for {exam.shortName}.</p>
                  <button onClick={() => setActiveTab("papers")} className="btn-primary w-full">View Papers</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock papers for static demo
const MOCK_PAPERS: Record<string, PredictedPaper[]> = {
  "jee-main": [
    { _id: "jm1", examId: "jee-main", title: "JEE Main January 2025 — Session 1 Predicted Paper", description: "AI-predicted paper for JEE Main January session. Physics heavily weighted on Modern Physics & Optics. Chemistry: Coordination Compounds. Math: Calculus & Vectors.", pdfUrl: "", price: 9900, difficultyLevel: "hard", predictionScore: 91, totalQuestions: 90, paperType: "predicted", year: 2025, isActive: true, hasPurchased: false, createdAt: "" },
    { _id: "jm2", examId: "jee-main", title: "JEE Main April 2025 — Session 2 Predicted Paper", description: "Expected April session paper focusing on topics not heavily covered in Jan session.", pdfUrl: "", price: 9900, difficultyLevel: "hard", predictionScore: 88, totalQuestions: 90, paperType: "predicted", year: 2025, isActive: true, hasPurchased: false, createdAt: "" },
  ],
  "neet-ug": [
    { _id: "nu1", examId: "neet-ug", title: "NEET UG 2025 Full Predicted Paper", description: "Complete predicted paper for NEET UG 2025. Biology: Genetics, Ecology. Physics: Modern Physics. Chemistry: Organic mechanisms.", pdfUrl: "", price: 11900, difficultyLevel: "hard", predictionScore: 93, totalQuestions: 200, paperType: "predicted", year: 2025, isActive: true, hasPurchased: false, createdAt: "" },
    { _id: "nu2", examId: "neet-ug", title: "NEET UG 2025 Biology Special Predicted Paper", description: "Focused predicted paper for Biology — highest weightage section in NEET.", pdfUrl: "", price: 7900, difficultyLevel: "medium", predictionScore: 95, totalQuestions: 100, paperType: "predicted", year: 2025, isActive: true, hasPurchased: false, createdAt: "" },
  ],
  "upsc-cse": [
    { _id: "uc1", examId: "upsc-cse", title: "UPSC Prelims GS Paper I 2025 Predicted", description: "AI-predicted GS Paper I for UPSC Prelims 2025 based on 15 years of trend analysis.", pdfUrl: "", price: 14900, difficultyLevel: "hard", predictionScore: 87, totalQuestions: 100, paperType: "predicted", year: 2025, isActive: true, hasPurchased: false, createdAt: "" },
  ],
};

function ExamDetailSkeleton() {
  return (
    <div className="pt-20 pb-16 animate-pulse">
      <div className="h-48 bg-surface-card border-b border-surface-border" />
      <div className="max-w-7xl mx-auto px-4 mt-8 flex gap-8">
        <div className="flex-1 space-y-4">
          <div className="h-12 bg-surface-card rounded-xl" />
          <div className="h-48 bg-surface-card rounded-2xl" />
          <div className="h-48 bg-surface-card rounded-2xl" />
        </div>
        <div className="w-80 space-y-4 hidden lg:block">
          <div className="h-48 bg-surface-card rounded-2xl" />
          <div className="h-32 bg-surface-card rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="pt-32 pb-16 text-center min-h-screen flex flex-col items-center justify-center">
      <AlertCircle className="w-16 h-16 text-muted-custom mx-auto mb-4" />
      <h2 className="text-2xl font-display font-bold text-white mb-2">Exam Not Found</h2>
      <p className="text-secondary mb-6">No exam found for &quot;{slug}&quot;</p>
      <Link href="/exams" className="btn-primary">Browse All Exams</Link>
    </div>
  );
}
