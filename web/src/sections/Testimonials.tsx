import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const testimonials = [
  {
    name: "Sara Mengistu",
    role: "Daily commuter, Bole → Piassa",
    quote: "RideLink cut my commute cost in half. I ride with the same people every morning — it feels like a carpool family.",
    rating: 5,
    initials: "SM",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    name: "Dawit Tekle",
    role: "Driver, CMC → Mexico",
    quote: "I was spending too much on fuel alone. Now I share the ride and the cost. The verification process gave me confidence in my passengers.",
    rating: 5,
    initials: "DT",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    name: "Hana Girma",
    role: "University student, Ayat → AAU",
    quote: "As a student, every birr counts. RideLink is cheaper than a minibus and way more comfortable. The safety features make my parents happy too.",
    rating: 5,
    initials: "HG",
    gradient: "from-emerald-400 to-teal-500",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(count)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6 relative bg-slate-50/60 dark:bg-white/[0.02]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Testimonials</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">
            Loved by commuters
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-lg">
            Hear from riders and drivers who made the switch to smarter commuting.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.12 * i, duration: 0.5 }}
              className="glass rounded-2xl p-6 glow-hover flex flex-col gap-4"
            >
              <Stars count={t.rating} />
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed flex-1 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
