"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard, BookOpen, FileText, Users, ShoppingBag,
  Plus, Edit2, Trash2, Upload, TrendingUp, DollarSign,
  BarChart3, Eye, CheckCircle2, XCircle, Loader2, Save, X
} from "lucide-react";
import { adminApi, examApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/razorpay";
import type { AdminAnalytics, Exam, PredictedPaper, User, Order, ExamCategory } from "@/types";
import { CATEGORY_META } from "@/types";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

type AdminTab = "dashboard" | "exams" | "papers" | "users" | "orders";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [papers, setPapers] = useState<PredictedPaper[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingPaper, setEditingPaper] = useState<PredictedPaper | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin"))) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setDataLoading(true);
      try {
        switch (tab) {
          case "dashboard": { const { data } = await adminApi.getDashboard(); setAnalytics(data.data || null); break; }
          case "exams":     { const { data } = await examApi.getAll({ limit: 100 }); setExams(data.data?.data || []); break; }
          case "papers":    { const res = await adminApi.getPapers(); setPapers(res.data.data?.data || []); break; }
          case "users":     { const { data } = await adminApi.getUsers(); setUsers(data.data?.data || []); break; }
          case "orders":    { const { data } = await adminApi.getOrders(); setOrders(data.data?.data || []); break; }
        }
      } catch { toast.error("Failed to load data"); }
      finally { setDataLoading(false); }
    };
    load();
  }, [tab, isAuthenticated]);

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    try { await adminApi.deleteExam(id); setExams(e => e.filter(x => x._id !== id)); toast.success("Exam deleted"); }
    catch { toast.error("Failed to delete exam"); }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm("Delete this paper?")) return;
    try { await adminApi.deletePaper(id); setPapers(p => p.filter(x => x._id !== id)); toast.success("Paper deleted"); }
    catch { toast.error("Failed to delete paper"); }
  };

  if (isLoading) return <AdminSkeleton />;
  if (!user) return null;

  const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "exams",     label: "Exams",     icon: BookOpen },
    { id: "papers",    label: "Papers",    icon: FileText },
    { id: "users",     label: "Users",     icon: Users },
    { id: "orders",    label: "Orders",    icon: ShoppingBag },
  ];

  return (
    <div className="pt-16 min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 fixed top-16 left-0 h-[calc(100vh-4rem)] bg-surface-card border-r border-surface-border flex flex-col py-6 z-40">
          <div className="px-4 mb-6">
            <h2 className="font-display font-bold text-white text-sm">Admin Panel</h2>
            <p className="text-xs text-muted-custom">{user.role}</p>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === id ? "bg-brand-600 text-white" : "text-secondary hover:text-white hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="ml-56 flex-1 p-8 min-h-screen">
          {dataLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
          ) : (
            <>
              {/* DASHBOARD */}
              {tab === "dashboard" && analytics && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-display font-bold text-white">Analytics Dashboard</h1>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      { label: "Total Users", value: analytics.totalUsers.toLocaleString(), icon: Users, color: "from-blue-500 to-blue-700", glow: "rgba(59,130,246,0.3)" },
                      { label: "Total Revenue", value: formatPrice(analytics.totalRevenue), icon: DollarSign, color: "from-emerald-500 to-emerald-700", glow: "rgba(16,185,129,0.3)" },
                      { label: "Total Orders", value: analytics.totalOrders.toLocaleString(), icon: ShoppingBag, color: "from-violet-500 to-violet-700", glow: "rgba(139,92,246,0.3)" },
                      { label: "Exams Listed", value: analytics.totalExams.toLocaleString(), icon: BookOpen, color: "from-orange-500 to-orange-700", glow: "rgba(249,115,22,0.3)" },
                    ].map((s) => (
                      <div key={s.label} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-secondary">{s.label}</p>
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}
                            style={{ boxShadow: `0 0 15px ${s.glow}` }}>
                            <s.icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <p className="text-2xl font-display font-bold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="card p-6">
                      <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-brand-400" />Revenue (Last 6 Months)
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={analytics.revenueByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" tick={{ fill: "#A09CC0", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#A09CC0", fontSize: 11 }} tickFormatter={v => `₹${(v/100).toFixed(0)}`} />
                          <Tooltip
                            formatter={(value: number | string) => [formatPrice(Number(value)), "Revenue"]}
                            contentStyle={{ background: "#1A1928", border: "1px solid #2D2B45", borderRadius: 12 }}
                            labelStyle={{ color: "#F8F7FF" }} />
                          <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={{ fill: "#6366F1", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="card p-6">
                      <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-accent-400" />User Growth
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={analytics.usersByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" tick={{ fill: "#A09CC0", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#A09CC0", fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: "#1A1928", border: "1px solid #2D2B45", borderRadius: 12 }}
                            labelStyle={{ color: "#F8F7FF" }} />
                          <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="card p-6">
                    <h3 className="font-display font-semibold text-white mb-4">Recent Orders</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-xs text-muted-custom border-b border-surface-border">
                          {["User", "Paper", "Amount", "Status", "Date"].map(h => (<th key={h} className="pb-3 pr-4 font-medium">{h}</th>))}
                        </tr></thead>
                        <tbody className="divide-y divide-surface-border">
                          {(analytics.recentOrders || []).slice(0, 5).map((o) => (
                            <tr key={o._id} className="hover:bg-white/5">
                              <td className="py-3 pr-4 text-secondary">{o.userId}</td>
                              <td className="py-3 pr-4 text-white truncate max-w-[200px]">{typeof o.paperId === "object" ? (o.paperId as PredictedPaper).title : o.paperId}</td>
                              <td className="py-3 pr-4 text-white font-semibold">{formatPrice(o.amount)}</td>
                              <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                              <td className="py-3 text-secondary">{format(new Date(o.createdAt), "dd MMM")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EXAMS */}
              {tab === "exams" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-display font-bold text-white">Manage Exams</h1>
                    <button onClick={() => { setEditingExam(null); setShowExamForm(true); }} className="btn-primary flex items-center gap-2">
                      <Plus className="w-4 h-4" />Add Exam
                    </button>
                  </div>
                  <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-muted-custom border-b border-surface-border">
                        {["Exam", "Category", "Slug", "Status", "Actions"].map(h => (<th key={h} className="px-5 py-3 font-medium">{h}</th>))}
                      </tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {exams.map((exam) => {
                          const catMeta = CATEGORY_META[exam.category];
                          return (
                            <tr key={exam._id} className="hover:bg-white/5 transition-all">
                              <td className="px-5 py-4">
                                <p className="text-white font-medium">{exam.title}</p>
                                <p className="text-xs text-muted-custom">{exam.conductingBody}</p>
                              </td>
                              <td className="px-5 py-4"><span className={`badge text-xs ${catMeta.color}`}>{catMeta.label}</span></td>
                              <td className="px-5 py-4 text-secondary font-mono text-xs">{exam.slug}</td>
                              <td className="px-5 py-4">
                                <span className={`badge text-xs ${exam.isActive ? "badge-success" : "bg-gray-500/20 text-gray-400 badge"}`}>
                                  {exam.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => { setEditingExam(exam); setShowExamForm(true); }}
                                    className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteExam(exam._id)}
                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* PAPERS */}
              {tab === "papers" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-display font-bold text-white">Manage Papers</h1>
                    <button onClick={() => { setEditingPaper(null); setShowPaperForm(true); }} className="btn-primary flex items-center gap-2">
                      <Upload className="w-4 h-4" />Upload Paper
                    </button>
                  </div>
                  {showPaperForm && (
                    <PaperUploadForm exams={exams} onClose={() => setShowPaperForm(false)}
                      onSuccess={(p) => { setPapers(prev => [p, ...prev]); setShowPaperForm(false); toast.success("Paper uploaded!"); }} />
                  )}
                  <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-muted-custom border-b border-surface-border">
                        {["Title", "Exam", "Price", "Difficulty", "Score", "Actions"].map(h => (<th key={h} className="px-5 py-3 font-medium">{h}</th>))}
                      </tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {papers.map((p) => (
                          <tr key={p._id} className="hover:bg-white/5">
                            <td className="px-5 py-4"><p className="text-white font-medium max-w-xs truncate">{p.title}</p></td>
                            <td className="px-5 py-4 text-secondary">{typeof p.examId === "object" ? p.examId.shortName : "—"}</td>
                            <td className="px-5 py-4 text-white font-semibold">{formatPrice(p.price)}</td>
                            <td className="px-5 py-4"><DiffBadge level={p.difficultyLevel} /></td>
                            <td className="px-5 py-4 text-brand-400 font-bold">{p.predictionScore}%</td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                <button className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10"><Eye className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeletePaper(p._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {papers.length === 0 && (
                          <tr><td colSpan={6} className="px-5 py-12 text-center text-secondary">No papers uploaded yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* USERS */}
              {tab === "users" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-display font-bold text-white">Manage Users</h1>
                  <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-muted-custom border-b border-surface-border">
                        {["User", "Email", "Role", "Verified", "Joined", "Actions"].map(h => (<th key={h} className="px-5 py-3 font-medium">{h}</th>))}
                      </tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-white/5">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-secondary">{u.email}</td>
                            <td className="px-5 py-3"><span className={`badge text-xs ${u.role === "admin" ? "badge-accent" : "badge-brand"}`}>{u.role}</span></td>
                            <td className="px-5 py-3">{u.isEmailVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</td>
                            <td className="px-5 py-3 text-secondary">{format(new Date(u.createdAt), "dd MMM yyyy")}</td>
                            <td className="px-5 py-3"><button className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10"><Eye className="w-3.5 h-3.5" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ORDERS */}
              {tab === "orders" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-display font-bold text-white">All Orders</h1>
                  <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-muted-custom border-b border-surface-border">
                        {["Order ID", "User", "Amount", "Status", "Date"].map(h => (<th key={h} className="px-5 py-3 font-medium">{h}</th>))}
                      </tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {orders.map((o) => (
                          <tr key={o._id} className="hover:bg-white/5">
                            <td className="px-5 py-3 font-mono text-xs text-muted-custom">{o.razorpayOrderId || o._id.slice(-8)}</td>
                            <td className="px-5 py-3 text-secondary">{o.userId}</td>
                            <td className="px-5 py-3 text-white font-semibold">{formatPrice(o.amount)}</td>
                            <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                            <td className="px-5 py-3 text-secondary">{format(new Date(o.createdAt), "dd MMM yyyy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Exam Form Modal */}
      {showExamForm && (
        <ExamFormModal exam={editingExam} onClose={() => setShowExamForm(false)}
          onSuccess={(e) => { setExams(prev => editingExam ? prev.map(x => x._id === e._id ? e : x) : [e, ...prev]); setShowExamForm(false); toast.success(editingExam ? "Exam updated!" : "Exam created!"); }} />
      )}
    </div>
  );
}

// ── Paper Upload Form ─────────────────────────────────────────
function PaperUploadForm({ exams, onClose, onSuccess }: { exams: Exam[]; onClose: () => void; onSuccess: (p: PredictedPaper) => void }) {
  const [form, setForm] = useState({ examId: "", title: "", description: "", price: "", difficultyLevel: "medium", predictionScore: "90", totalQuestions: "100", paperType: "predicted", year: new Date().getFullYear().toString() });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examId || !form.title || !form.price || !pdfFile) return toast.error("Fill all required fields and upload PDF");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("pdf", pdfFile);
      if (thumbFile) fd.append("thumbnail", thumbFile);
      const { data } = await adminApi.createPaper(fd);
      if (data.data) onSuccess(data.data);
    } catch { toast.error("Failed to upload paper"); } finally { setSaving(false); }
  };

  return (
    <div className="card p-6 border-brand-500/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-white text-lg">Upload Predicted Paper</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm text-secondary mb-1.5 block">Exam *</label>
          <select value={form.examId} onChange={e => setForm(f => ({ ...f, examId: e.target.value }))}
            className="input-base">
            <option value="">Select Exam</option>
            {exams.map(e => (<option key={e._id} value={e._id}>{e.title}</option>))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-secondary mb-1.5 block">Paper Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" placeholder="UPSC Prelims 2025 Predicted Paper" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-secondary mb-1.5 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} className="input-base resize-none" placeholder="Brief description of the paper..." />
        </div>
        {[
          { label: "Price (₹) *", field: "price", type: "number", placeholder: "99" },
          { label: "Total Questions *", field: "totalQuestions", type: "number", placeholder: "100" },
          { label: "Prediction Score (%)", field: "predictionScore", type: "number", placeholder: "90" },
          { label: "Year", field: "year", type: "number", placeholder: "2025" },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field}>
            <label className="text-sm text-secondary mb-1.5 block">{label}</label>
            <input type={type} value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              className="input-base" placeholder={placeholder} />
          </div>
        ))}
        <div>
          <label className="text-sm text-secondary mb-1.5 block">Difficulty</label>
          <select value={form.difficultyLevel} onChange={e => setForm(f => ({ ...f, difficultyLevel: e.target.value }))} className="input-base">
            {["easy", "medium", "hard"].map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-secondary mb-1.5 block">Paper Type</label>
          <select value={form.paperType} onChange={e => setForm(f => ({ ...f, paperType: e.target.value }))} className="input-base">
            {["predicted", "model", "pyq", "practice"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {/* PDF Upload */}
        <div className="md:col-span-2">
          <label className="text-sm text-secondary mb-1.5 block">PDF File *</label>
          <div onClick={() => pdfRef.current?.click()}
            className="border-2 border-dashed border-surface-border rounded-xl p-6 text-center cursor-pointer hover:border-brand-500/50 transition-all">
            {pdfFile ? (
              <div className="flex items-center justify-center gap-2 text-brand-400">
                <FileText className="w-5 h-5" /><span className="text-sm font-medium">{pdfFile.name}</span>
              </div>
            ) : (
              <div className="text-secondary text-sm"><Upload className="w-6 h-6 mx-auto mb-2 text-muted-custom" />Click to upload PDF</div>
            )}
          </div>
          <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
        </div>
        <div className="md:col-span-2 flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Uploading..." : "Upload Paper"}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Exam Form Modal ───────────────────────────────────────────
function ExamFormModal({ exam, onClose, onSuccess }: { exam: Exam | null; onClose: () => void; onSuccess: (e: Exam) => void }) {
  const [form, setForm] = useState({
    title: exam?.title || "", slug: exam?.slug || "", shortName: exam?.shortName || "",
    category: exam?.category || "upsc" as ExamCategory, conductingBody: exam?.conductingBody || "",
    description: exam?.description || "", isTrending: exam?.isTrending || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      const { data } = exam ? await adminApi.updateExam(exam._id, fd) : await adminApi.createExam(fd);
      if (data.data) onSuccess(data.data);
    } catch { toast.error("Failed to save exam"); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-white text-lg">{exam ? "Edit Exam" : "Add New Exam"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Exam Title *", field: "title", placeholder: "UPSC Civil Services Examination" },
            { label: "Slug *", field: "slug", placeholder: "upsc-cse" },
            { label: "Short Name", field: "shortName", placeholder: "UPSC CSE" },
            { label: "Conducting Body", field: "conductingBody", placeholder: "Union Public Service Commission" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="text-sm text-secondary mb-1.5 block">{label}</label>
              <input value={form[field as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="input-base" placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="text-sm text-secondary mb-1.5 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExamCategory }))} className="input-base">
              {Object.entries(CATEGORY_META).map(([id, meta]) => (<option key={id} value={id}>{meta.label}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-secondary mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="input-base resize-none" placeholder="Brief description of the exam..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isTrending} onChange={e => setForm(f => ({ ...f, isTrending: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm text-secondary">Mark as Trending</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : exam ? "Update Exam" : "Create Exam"}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    refunded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return <span className={`badge text-xs border ${configs[status] || "badge-brand"} capitalize`}>{status}</span>;
}

function DiffBadge({ level }: { level: string }) {
  const c = { easy: "badge-success", medium: "badge-accent", hard: "bg-red-500/20 text-red-300 border border-red-500/30 badge" };
  return <span className={`badge text-xs ${c[level as keyof typeof c] || "badge-brand"} capitalize`}>{level}</span>;
}

function AdminSkeleton() {
  return <div className="flex"><div className="w-56 h-screen bg-surface-card" /><div className="flex-1 p-8"><div className="h-8 w-48 bg-surface-card rounded mb-6 animate-pulse" /><div className="grid grid-cols-4 gap-4"><div className="h-24 bg-surface-card rounded-2xl animate-pulse" /><div className="h-24 bg-surface-card rounded-2xl animate-pulse" /><div className="h-24 bg-surface-card rounded-2xl animate-pulse" /><div className="h-24 bg-surface-card rounded-2xl animate-pulse" /></div></div></div>;
}
