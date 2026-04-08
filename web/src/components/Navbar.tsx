import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSection } from "../hooks/useActiveSection";
import { hasValidAdminSession } from "../auth/adminAuth";

type NavbarProps = {
  isDark: boolean;
  onToggleDark: () => void;
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
];

export function Navbar({ isDark, onToggleDark }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const activeSection = useActiveSection();
  const { pathname } = useLocation();

  useEffect(() => {
    setIsAdminSession(hasValidAdminSession());
    const onStorage = () => setIsAdminSession(hasValidAdminSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl"
    >
      <div className="glass-strong rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-sm font-display">
            RL
          </div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
            RideLink
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isRoute = link.href.startsWith("/");
            const sectionId = isRoute ? "" : link.href.replace("#", "");
            const isActive = isRoute
              ? pathname === link.href
              : activeSection === sectionId;
            const cls = `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5"
            }`;
            return isRoute ? (
              <Link key={link.href} to={link.href} className={cls}>
                {link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className={cls}>
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDark}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {isAdminSession ? (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 transition-all"
            >
              Admin Portal
            </Link>
          ) : (
            <a
              href="#download"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 transition-all"
            >
              Download App
            </a>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden mt-2 glass-strong rounded-2xl p-4 shadow-lg"
          >
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
            {isAdminSession ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block mt-2 px-4 py-3 rounded-xl text-sm font-semibold text-center bg-gradient-to-r from-primary-600 to-accent-500 text-white"
              >
                Admin Portal
              </Link>
            ) : (
              <a
                href="#download"
                onClick={() => setMobileOpen(false)}
                className="block mt-2 px-4 py-3 rounded-xl text-sm font-semibold text-center bg-gradient-to-r from-primary-600 to-accent-500 text-white"
              >
                Download App
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
