import Link from "next/link";
import { BookOpen, Twitter, Youtube, Instagram, Linkedin } from "lucide-react";

const FOOTER_LINKS = {
  "Exams": [
    { label: "UPSC CSE", href: "/exam/upsc-cse" },
    { label: "SSC CGL", href: "/exam/ssc-cgl" },
    { label: "IBPS PO", href: "/exam/ibps-po" },
    { label: "JEE Main", href: "/exam/jee-main" },
    { label: "JEE Advanced", href: "/exam/jee-advanced" },
    { label: "NEET UG", href: "/exam/neet-ug" },
    { label: "NEET PG", href: "/exam/neet-pg" },
    { label: "NDA", href: "/exam/nda" },
  ],
  "Categories": [
    { label: "Engineering", href: "/category/engineering" },
    { label: "Medical", href: "/category/medical" },
    { label: "UPSC", href: "/category/upsc" },
    { label: "SSC", href: "/category/ssc" },
    { label: "Banking", href: "/category/banking" },
    { label: "Railway", href: "/category/railway" },
    { label: "Defence", href: "/category/defence" },
    { label: "State Exams", href: "/category/state" },
  ],
  "Platform": [
    { label: "Browse Exams", href: "/exams" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Papers", href: "/dashboard" },
    { label: "Payment History", href: "/dashboard" },
    { label: "Sign In", href: "/auth" },
    { label: "Sign Up", href: "/auth?tab=register" },
  ],
  "Company": [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

const SOCIALS = [
  { icon: Twitter,   href: "#", label: "Twitter"   },
  { icon: Youtube,   href: "#", label: "YouTube"   },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin,  href: "#", label: "LinkedIn"  },
];

export default function Footer() {
  return (
    <footer className="bg-surface-card border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Top: Logo + Newsletter */}
        <div className="flex flex-col lg:flex-row gap-10 mb-12 pb-12 border-b border-surface-border">
          <div className="lg:max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Exam<span className="text-brand-400">Edge</span>
              </span>
            </Link>
            <p className="text-secondary text-sm leading-relaxed mb-6">
              India&apos;s most advanced AI exam prediction platform. Helping 2L+ students 
              crack government exams, JEE, NEET and more since 2022.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-surface-border flex items-center justify-center text-secondary hover:text-white hover:border-brand-500/50 hover:bg-brand-500/10 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex-1 lg:max-w-md ml-auto">
            <h4 className="font-display font-bold text-white mb-2">Stay Updated</h4>
            <p className="text-secondary text-sm mb-4">
              Get exam notifications, prediction alerts and study tips — straight to your inbox.
            </p>
            <div className="flex gap-2">
              <input type="email" placeholder="your@email.com"
                className="flex-1 input-base" />
              <button className="btn-primary flex-shrink-0 px-5">Subscribe</button>
            </div>
            <p className="text-xs text-muted-custom mt-2">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-display font-semibold text-white text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="text-secondary text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-border">
          <p className="text-secondary text-sm">
            © {new Date().getFullYear()} ExamEdge. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            All systems operational
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-custom">
            <span>Secured by</span>
            <span className="text-white font-semibold">Razorpay</span>
            <span>•</span>
            <span className="text-white font-semibold">256-bit SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
