import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const screens = [
  { label: "Find rides", src: "/images/mobile/screen-1.jpg" },
  { label: "Dark mode", src: "/images/mobile/screen-3.jpg" },
  { label: "Live tracking", src: "/images/mobile/screen-2.jpg" },
];

const appFeatures = [
  {
    title: "Smart route search",
    description: "Find rides along your exact commute corridor with time-window matching.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
    ),
  },
  {
    title: "Live GPS tracking",
    description: "Share your trip in real time with contacts. SOS button always accessible.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>
    ),
  },
  {
    title: "Instant notifications",
    description: "Get notified when a ride is available, when your driver is near, or when seats fill up.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>
    ),
  },
];

export function AppPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-50/30 to-transparent dark:via-accent-950/10 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 mb-4">
            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Mobile App</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">
            Your commute, in your pocket
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            The RideLink mobile app gives riders and drivers everything they need on the go.
          </p>
        </motion.div>

        {/* Phone mockups */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="flex justify-center mb-20"
        >
          <div className="flex items-end justify-center gap-5 sm:gap-8">
            {screens.map((screen, i) => (
              <motion.div
                key={screen.label}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, delay: i * 0.6, repeat: Infinity, ease: "easeInOut" }}
                className={i === 1 ? "relative z-20 -mt-6" : "relative z-10"}
              >
                <div
                  className={`rounded-[2rem] border-[5px] border-slate-800 dark:border-slate-600 bg-slate-900 shadow-2xl overflow-hidden ${
                    i === 1
                      ? "w-48 h-[24rem] sm:w-56 sm:h-[28rem]"
                      : "w-40 h-[20rem] sm:w-48 sm:h-[24rem] opacity-80"
                  }`}
                >
                  <div className="h-6 bg-black flex items-center justify-center">
                    <div className="w-16 h-3 rounded-full bg-slate-800" />
                  </div>
                  <img
                    src={screen.src}
                    alt={screen.label}
                    className="w-full h-[calc(100%-1.5rem)] object-cover"
                  />
                </div>
                <p className="text-xs text-center font-medium text-slate-500 dark:text-slate-400 mt-3">{screen.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <div className="grid sm:grid-cols-3 gap-8">
            {appFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + 0.1 * i, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-10">
            <button className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:-translate-y-0.5 transition-transform cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.3-3.74 4.25z"/></svg>
              App Store
            </button>
            <button className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:-translate-y-0.5 transition-transform cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
              Google Play
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
