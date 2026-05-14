import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.6, ease: "easeOut" },
  }),
};

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 px-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-bg animate-gradient-shift opacity-10 dark:opacity-20" />

      {/* Floating decorative blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 -right-32 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/10 rounded-full blur-3xl animate-float-slow" />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div className="flex flex-col gap-6">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit text-sm font-medium text-primary-600 dark:text-primary-400"
          >
            <span className="w-2 h-2 rounded-full bg-eco-500 animate-pulse-glow" />
            Eco-friendly commuting
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-slate-900 dark:text-white"
          >
            Commute Smarter.{" "}
            <span className="gradient-text">Ride Together.</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed"
          >
            Save money, cut emissions, and enjoy your daily commute with verified
            carpoolers on your exact route.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap gap-4 mt-2"
          >
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-xl shadow-primary-600/25 hover:shadow-2xl hover:shadow-primary-600/30 hover:-translate-y-1 transition-all"
            >
              Find a Ride
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-2xl text-base font-semibold glass text-slate-700 dark:text-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              Offer a Ride
            </a>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center gap-6 mt-4 text-sm text-slate-500 dark:text-slate-400"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-eco-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Free to use
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-eco-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Verified riders
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-eco-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Cost-capped
            </div>
          </motion.div>
        </div>

        {/* Right: animated route card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-8 bg-gradient-to-br from-primary-500/20 to-accent-400/20 rounded-3xl blur-2xl animate-pulse-glow hidden sm:block" />
          <div className="relative glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <span className="w-3 h-3 rounded-full bg-eco-500" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live route</span>
            </div>

            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <div className="px-3 sm:px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-display font-semibold text-sm sm:text-base">Bole</div>
              <div className="flex-1 relative h-0.5">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50"
                  animate={{ left: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="px-3 sm:px-4 py-2 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-display font-semibold text-sm sm:text-base">Piassa</div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: "Seats", value: "3 open" },
                { label: "Fare cap", value: "4 ETB/km" },
                { label: "Departs", value: "7:30 AM" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs sm:text-sm font-bold">AK</div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Abebe K.</p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                  <span className="text-xs text-slate-400 ml-1">4.9</span>
                </div>
              </div>
              <span className="ml-auto text-xs px-3 py-1 rounded-full bg-eco-500/10 text-eco-600 dark:text-eco-400 font-medium">Verified</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-start justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
