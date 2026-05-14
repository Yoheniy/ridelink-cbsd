import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { saveAdminSession } from "../auth/adminAuth";

type AuthMode = "login" | "forgot";

function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const data = new FormData(event.currentTarget);
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    try {
      if (authMode === "forgot") {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/auth/forget-password`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, redirectTo: window.location.origin + "/login" }),
          }
        );
        if (!res.ok) throw new Error("Failed to send reset email");
        setMessage("If an admin account exists with that email, a reset link has been sent.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/auth/sign-in/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Invalid credentials");
      }

      const session = await res.json();
      if (session?.user?.role !== "admin") {
        setError("Access denied. Admin accounts only.");
        return;
      }

      const user = session.user;
      saveAdminSession(session.token ?? "cookie", {
        name: user?.name ?? email.split("@")[0],
        email,
        role: user?.role ?? "admin",
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24 relative">
      <div className="absolute inset-0 gradient-bg animate-gradient-shift opacity-5 dark:opacity-10" />
      <div className="absolute top-20 -left-32 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-80 h-80 bg-accent-400/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl grid lg:grid-cols-5 gap-8 items-start"
      >
        {/* Login form */}
        <div className="lg:col-span-3 glass-strong rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="mb-8">
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Admin Portal</span>
            <h1 className="mt-2 font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Sign in to the dashboard
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              This login is for RideLink administrators only.
            </p>
          </div>

          <div className="flex gap-2 mb-8">
            {(["login", "forgot"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setAuthMode(mode); setError(""); setMessage(""); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  authMode === mode
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {mode === "login" ? "Sign in" : "Reset password"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
              <input
                name="email"
                type="email"
                placeholder="admin@ridelink.com"
                required
                className="px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
              />
            </label>

            {authMode === "login" && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                />
              </label>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="px-4 py-3 rounded-xl bg-eco-500/10 border border-eco-500/20 text-eco-600 dark:text-eco-400 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Connecting..." : authMode === "login" ? "Sign in" : "Send reset link"}
            </button>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">Admin access only</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This portal is restricted to RideLink administrators. Contact your system admin if you need access.
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3">For riders and drivers</h3>
            <ul className="space-y-2.5">
              {[
                "Download the RideLink mobile app",
                "Register with your National ID",
                "Drivers submit license for review",
                "Start commuting once approved",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <svg className="w-4 h-4 text-eco-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
