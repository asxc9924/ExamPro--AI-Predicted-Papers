"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  BookOpen,
  LayoutDashboard,
  Shield,
  Bell,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { examApi } from "@/lib/api";
import type { Exam } from "@/types";

const NAV_CATEGORIES = [
  { label: "UPSC", href: "/category/upsc", icon: "🏛️" },
  { label: "SSC", href: "/category/ssc", icon: "📋" },
  { label: "Banking", href: "/category/banking", icon: "🏦" },
  { label: "Railway", href: "/category/railway", icon: "🚂" },
  { label: "Defence", href: "/category/defence", icon: "⚔️" },
  { label: "Teaching", href: "/category/teaching", icon: "📚" },
  { label: "Engineering", href: "/category/engineering", icon: "⚙️" },
  { label: "Medical", href: "/category/medical", icon: "🩺" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Exam[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setCategoryMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Live search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await examApi.search(searchQuery);
        setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-surface-card/95 backdrop-blur-xl border-b border-surface-border shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white hidden sm:block">
              Exam<span className="text-brand-400">Edge</span>
            </span>
          </Link>

          {/* Categories Dropdown (desktop) */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:text-white hover:bg-white/5 transition-all"
            >
              Exams
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  categoryMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {categoryMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-72 card p-3 grid grid-cols-2 gap-1"
                >
                  {NAV_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary hover:text-white hover:bg-white/5 transition-all"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </Link>
                  ))}
                  <Link
                    href="/exams"
                    className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 mt-1 rounded-lg text-sm text-brand-400 hover:bg-brand-500/10 transition-all border border-brand-500/20"
                  >
                    View All Exams →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-md relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                <input
                  type="text"
                  placeholder="Search UPSC, SSC, JEE, NEET..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white/5 border border-surface-border text-white placeholder:text-muted-custom focus:outline-none focus:border-brand-500 focus:bg-brand-500/5 transition-all"
                />
              </div>
            </form>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchOpen && (searchResults.length > 0 || searching) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 right-0 mt-2 card py-2 max-h-80 overflow-y-auto z-50"
                >
                  {searching ? (
                    <div className="px-4 py-3 text-sm text-secondary">
                      Searching...
                    </div>
                  ) : (
                    searchResults.map((exam) => (
                      <Link
                        key={exam._id}
                        href={`/exam/${exam.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span className="text-lg">
                          {exam.category === "engineering"
                            ? "⚙️"
                            : exam.category === "medical"
                            ? "🩺"
                            : exam.category === "upsc"
                            ? "🏛️"
                            : exam.category === "banking"
                            ? "🏦"
                            : "📋"}
                        </span>
                        <div>
                          <p className="text-sm text-white font-medium">
                            {exam.title}
                          </p>
                          <p className="text-xs text-muted-custom capitalize">
                            {exam.category} • {exam.conductingBody}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 ml-auto">
            {isAuthenticated && user ? (
              <>
                {/* Notification Bell */}
                <button className="p-2 rounded-lg text-secondary hover:text-white hover:bg-white/5 transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/5 border border-surface-border hover:border-brand-500/50 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
                      <span className="text-xs font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-white font-medium hidden sm:block max-w-[100px] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-secondary" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute top-full right-0 mt-2 w-56 card py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-surface-border mb-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-custom truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 transition-all"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          My Dashboard
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 transition-all"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        {(user.role === "admin" ||
                          user.role === "super_admin") && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-brand-400 hover:text-white hover:bg-brand-500/10 transition-all"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-surface-border mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-red-500/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth" className="btn-ghost text-sm py-2 px-4">
                  Sign In
                </Link>
                <Link href="/auth?tab=register" className="btn-primary text-sm py-2 px-4">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-secondary hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-surface-border bg-surface-card/95 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              <p className="text-xs font-semibold text-muted-custom uppercase tracking-wider px-2 mb-2">
                Exam Categories
              </p>
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:text-white hover:bg-white/5 transition-all"
                >
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </Link>
              ))}
              <Link
                href="/exams"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-400 hover:bg-brand-500/10 transition-all"
              >
                <span>📄</span>
                <span className="font-medium">All Exams</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
