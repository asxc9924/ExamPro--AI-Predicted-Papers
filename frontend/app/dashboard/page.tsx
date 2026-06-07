"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, FileText, CreditCard, Heart, Download, Eye,
  Calendar, CheckCircle2, Clock, XCircle, Loader2,
  TrendingUp, BookOpen, Award, Settings
} from "lucide-react";
import { userApi, paymentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/razorpay";
import type { Purchase, PaymentHistory } from "@/types";
import Link from "next/link";
import { format } from "date-fns";

type DashTab = "purchases" | "payments" | "profile" | "wishlist";

const STATUS_CONFIG = {
  paid:     { label: "Paid",     icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  pending:  { label: "Pending",  icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  failed:   { label: "Failed",   icon: XCircle,      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  refunded: { label: "Refunded", icon: TrendingUp,   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<DashTab>("purchases");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth?redirect=/dashboard");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone || "" });
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        if (tab === "purchases") {
          const { data } = await userApi.getPurchases();
          setPurchases(data.data || []);
        } else if (tab === "payments") {
          const { data } = await paymentApi.getHistory();
          setPayments(data.data || []);
        }
      } catch { toast.error("Failed to load data"); }
      finally { setDataLoading(false); }
    };
    if (tab !== "profile" && tab !== "wishlist") fetchData();
  }, [tab, isAuthenticated]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await userApi.updateProfile(profileForm);
      toast.success("Profile updated!");
      setEditMode(false);
    } catch { toast.error("Failed to update profile"); }
    finally { setProfileSaving(false); }
  };

  const handleDownload = async (paperId: string) => {
    try {
      const { paperApi } = await import("@/lib/api");
      const dlRes = await paperApi.getDownloadUrl(paperId);
      if (dlRes.data.data?.url) window.open(dlRes.data.data.url, "_blank");
    } catch { toast.error("Download failed"); }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (!user) return null;

  const TABS = [
    { id: "purchases" as DashTab, label: "My Papers", icon: BookOpen },
    { id: "payments"  as DashTab, label: "Payments",  icon: CreditCard },
    { id: "wishlist"  as DashTab, label: "Wishlist",  icon: Heart },
    { id: "profile"   as DashTab, label: "Profile",   icon: Settings },
  ];

  const totalSpent = payments.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-8 border-b border-surface-border mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl font-display font-bold text-white shadow-glow">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">Hey, {user.name.split(" ")[0]}! 👋</h1>
              <p className="text-sm text-secondary">{user.email}</p>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-4">
            {[
              { label: "Papers Bought", value: purchases.length, icon: FileText },
              { label: "Total Spent", value: formatPrice(totalSpent), icon: CreditCard },
            ].map((stat) => (
              <div key={stat.label} className="card px-5 py-3 text-center">
                <p className="text-lg font-display font-bold text-white">{stat.value}</p>
                <p className="text-xs text-muted-custom">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Nav */}
          <nav className="lg:w-52 flex-shrink-0">
            <div className="flex lg:flex-col gap-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left ${
                    tab === id ? "bg-brand-600 text-white shadow-glow" : "text-secondary hover:text-white hover:bg-white/5"
                  }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
              <button onClick={logout}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full text-left mt-2 lg:mt-auto">
                <Award className="w-4 h-4" />Logout
              </button>
            </div>
          </nav>

          {/* Main Panel */}
          <div className="flex-1 min-w-0">
            {dataLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              </div>
            ) : (
              <>
                {/* PURCHASED PAPERS */}
                {tab === "purchases" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="font-display font-bold text-white text-lg mb-4">My Purchased Papers</h2>
                    {purchases.length === 0 ? (
                      <div className="card p-12 text-center">
                        <BookOpen className="w-12 h-12 text-muted-custom mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">No Papers Yet</h3>
                        <p className="text-secondary text-sm mb-6">Browse exams and purchase predicted papers to get started.</p>
                        <Link href="/exams" className="btn-primary">Browse Exams</Link>
                      </div>
                    ) : (
                      purchases.map((purchase) => {
                        const paper = purchase.paperId;
                        const exam = typeof paper.examId === "object" ? paper.examId : null;
                        return (
                          <div key={purchase._id} className="card p-5">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-7 h-7 text-brand-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-display font-semibold text-white text-sm leading-tight line-clamp-2">{paper.title}</h3>
                                  <span className="badge-success flex-shrink-0">Unlocked</span>
                                </div>
                                {exam && (<p className="text-xs text-muted-custom mb-2">{exam.title}</p>)}
                                <div className="flex flex-wrap gap-4 text-xs text-secondary mb-4">
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(purchase.purchasedAt), "dd MMM yyyy")}</span>
                                  <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />{formatPrice(purchase.amount)}</span>
                                  <span className="text-muted-custom">ID: {purchase.paymentId}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDownload(paper._id)}
                                    className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
                                    <Eye className="w-3.5 h-3.5" />View Paper
                                  </button>
                                  <button onClick={() => handleDownload(paper._id)}
                                    className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3">
                                    <Download className="w-3.5 h-3.5" />Download PDF
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}

                {/* PAYMENT HISTORY */}
                {tab === "payments" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="font-display font-bold text-white text-lg mb-4">Payment History</h2>
                    {payments.length === 0 ? (
                      <div className="card p-12 text-center">
                        <CreditCard className="w-12 h-12 text-muted-custom mx-auto mb-4" />
                        <p className="text-secondary">No payment history yet.</p>
                      </div>
                    ) : (
                      <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-surface-border">
                              <tr className="text-left text-xs text-muted-custom uppercase tracking-wider">
                                {["Paper", "Amount", "Date", "Status", "Payment ID"].map(h => (
                                  <th key={h} className="px-5 py-3 font-medium">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                              {payments.map((p) => {
                                const sc = STATUS_CONFIG[p.status];
                                const StatusIcon = sc.icon;
                                return (
                                  <tr key={p._id} className="hover:bg-white/5 transition-all">
                                    <td className="px-5 py-4">
                                      <p className="text-white font-medium line-clamp-1 max-w-xs">{p.paperId?.title || "—"}</p>
                                    </td>
                                    <td className="px-5 py-4 text-white font-semibold">{formatPrice(p.amount)}</td>
                                    <td className="px-5 py-4 text-secondary whitespace-nowrap">{format(new Date(p.createdAt), "dd MMM yyyy")}</td>
                                    <td className="px-5 py-4">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                                        <StatusIcon className="w-3 h-3" />{sc.label}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 text-muted-custom font-mono text-xs">{p.razorpayPaymentId || "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* WISHLIST */}
                {tab === "wishlist" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="font-display font-bold text-white text-lg mb-4">Wishlist</h2>
                    <div className="card p-12 text-center">
                      <Heart className="w-12 h-12 text-muted-custom mx-auto mb-4" />
                      <h3 className="text-white font-semibold mb-2">Wishlist Empty</h3>
                      <p className="text-secondary text-sm mb-6">Save papers to your wishlist to purchase later.</p>
                      <Link href="/exams" className="btn-primary">Browse Papers</Link>
                    </div>
                  </motion.div>
                )}

                {/* PROFILE */}
                {tab === "profile" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h2 className="font-display font-bold text-white text-lg">Profile Settings</h2>
                    <div className="card p-6">
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-border">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name}</p>
                          <p className="text-secondary text-sm">{user.email}</p>
                          <span className={`badge text-xs mt-1 ${user.role === "admin" || user.role === "super_admin" ? "badge-accent" : "badge-brand"}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { label: "Full Name", field: "name", type: "text", value: profileForm.name },
                          { label: "Phone Number", field: "phone", type: "tel", value: profileForm.phone },
                        ].map(({ label, field, type, value }) => (
                          <div key={field}>
                            <label className="text-sm text-secondary mb-1.5 block">{label}</label>
                            <input type={type} value={value} disabled={!editMode}
                              onChange={e => setProfileForm(f => ({ ...f, [field]: e.target.value }))}
                              className={`input-base ${!editMode ? "opacity-60 cursor-not-allowed" : ""}`} />
                          </div>
                        ))}

                        <div>
                          <label className="text-sm text-secondary mb-1.5 block">Email Address</label>
                          <input value={user.email} disabled className="input-base opacity-60 cursor-not-allowed" />
                          <p className="text-xs text-muted-custom mt-1">Email cannot be changed.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          {editMode ? (
                            <>
                              <button onClick={handleProfileSave} disabled={profileSaving} className="btn-primary flex items-center gap-2">
                                {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Changes
                              </button>
                              <button onClick={() => { setEditMode(false); setProfileForm({ name: user.name, phone: user.phone || "" }); }} className="btn-ghost">Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => setEditMode(true)} className="btn-ghost flex items-center gap-2">
                              <Settings className="w-4 h-4" />Edit Profile
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="card p-6">
                      <h3 className="font-display font-semibold text-white mb-4">Account Info</h3>
                      <div className="space-y-3 text-sm">
                        {[
                          { label: "Member Since", value: format(new Date(user.createdAt), "MMMM yyyy") },
                          { label: "Email Verified", value: user.isEmailVerified ? "✅ Verified" : "❌ Not Verified" },
                          { label: "Account Type", value: user.role === "admin" ? "Admin" : "Student" },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between">
                            <span className="text-muted-custom">{item.label}</span>
                            <span className="text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="pt-20 pb-16 max-w-6xl mx-auto px-4 animate-pulse">
      <div className="h-24 bg-surface-card rounded-2xl mb-8" />
      <div className="flex gap-8"><div className="w-52 h-64 bg-surface-card rounded-2xl" /><div className="flex-1 h-64 bg-surface-card rounded-2xl" /></div>
    </div>
  );
}
