import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

export function CallToAction() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-24 px-6" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-0 gradient-bg animate-gradient-shift" />
        <div className="absolute inset-0 noise-overlay pointer-events-none" />

        <div className="relative z-10 px-8 sm:px-16 py-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight"
          >
            Start your first ride today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-4 text-lg text-white/80 max-w-xl mx-auto"
          >
            Join thousands of commuters who save money, reduce emissions,
            and enjoy better commutes every day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8"
          >
            {submitted ? (
              <div className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/20 backdrop-blur-md text-white font-medium">
                <svg className="w-5 h-5 text-eco-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                You&apos;re on the list! We&apos;ll notify you when the app launches.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-5 py-4 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder-white/50 font-medium focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-xl bg-white text-primary-700 font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Get Early Access
                </button>
              </form>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-4 text-sm text-white/50"
          >
            Free forever for basic use. No spam. Unsubscribe anytime.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
