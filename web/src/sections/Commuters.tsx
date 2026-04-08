import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Persona = {
  type: string;
  name: string;
  title: string;
  route: string;
  schedule: string;
  soloCost: number;
  carpoolCost: number;
  monthlySavings: number;
  quote: string;
  initials: string;
  gradient: string;
  accent: string;
  icon: JSX.Element;
};

const personas: Persona[] = [
  {
    type: "University Student",
    name: "Sara M.",
    title: "Computer Science, AAU",
    route: "Ayat → AAU Campus",
    schedule: "Mon–Fri, 7:15 AM",
    soloCost: 120,
    carpoolCost: 35,
    monthlySavings: 1700,
    quote:
      "I used to spend half my allowance on minibuses. Now I save enough for textbooks and lunch.",
    initials: "SM",
    gradient: "from-primary-500 to-primary-300",
    accent: "#0ccfed",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    type: "Civil Servant",
    name: "Tadesse B.",
    title: "Ministry of Education",
    route: "CMC → Piassa Office",
    schedule: "Mon–Fri, 7:00 AM",
    soloCost: 150,
    carpoolCost: 40,
    monthlySavings: 2200,
    quote:
      "Reliable pick-up, fair price, and I get home 30 minutes earlier every day.",
    initials: "TB",
    gradient: "from-secondary-500 to-secondary-300",
    accent: "#afd0ce",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
  {
    type: "Professional",
    name: "Helen A.",
    title: "Marketing Lead, Bole Atlas",
    route: "Gerji → Bole Atlas",
    schedule: "Mon–Fri, 8:00 AM",
    soloCost: 100,
    carpoolCost: 30,
    monthlySavings: 1400,
    quote:
      "I've made real friends on my daily carpool. It turned a tedious commute into something I look forward to.",
    initials: "HA",
    gradient: "from-accent-500 to-accent-300",
    accent: "#74beb9",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    type: "Parent",
    name: "Dawit K.",
    title: "Father of two, Lideta",
    route: "Lideta → Megenagna School",
    schedule: "Mon–Fri, 6:45 AM",
    soloCost: 180,
    carpoolCost: 45,
    monthlySavings: 2700,
    quote:
      "Three neighborhood kids ride together. Their parents and I take turns — safe, simple, affordable.",
    initials: "DK",
    gradient: "from-amber-500 to-orange-400",
    accent: "#f59e0b",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
];

function CostBar({
  solo,
  carpool,
  accent,
  inView,
  delay,
}: {
  solo: number;
  carpool: number;
  accent: string;
  inView: boolean;
  delay: number;
}) {
  const pct = Math.round(((solo - carpool) / solo) * 100);

  return (
    <div className="space-y-2.5">
      {/* Solo cost bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Solo minibus
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {solo} ETB
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: "100%" } : {}}
            transition={{ delay, duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-slate-300 dark:bg-slate-600"
          />
        </div>
      </div>
      {/* Carpool cost bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: accent }}>
            With RideLink
          </span>
          <span className="text-xs font-bold" style={{ color: accent }}>
            {carpool} ETB
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: `${(carpool / solo) * 100}%` } : {}}
            transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>
      {/* Savings badge */}
      <div className="flex items-center gap-2 pt-1">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          -{pct}%
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">per trip</span>
      </div>
    </div>
  );
}

export function Commuters() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6 relative overflow-hidden bg-slate-50/60 dark:bg-white/[0.02]" ref={ref}>
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            Optimum pricing for everyone
          </span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">
            Every commuter. One platform.
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Students heading to class, civil servants going to the office, parents
            dropping off their kids — RideLink makes every daily trip affordable.
          </p>
        </motion.div>

        {/* Persona cards grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {personas.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="glass rounded-2xl overflow-hidden glow-hover"
            >
              {/* Accent strip */}
              <div className={`h-1 bg-gradient-to-r ${p.gradient}`} />

              <div className="p-6 sm:p-7">
                {/* Top: avatar + type */}
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white shrink-0`}
                  >
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                        {p.name}
                      </h3>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${p.accent}18`, color: p.accent }}
                      >
                        {p.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{p.title}</p>
                  </div>
                </div>

                {/* Route badge */}
                <div className="flex flex-wrap items-center gap-3 mb-5 py-3 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{p.route}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{p.schedule}</span>
                </div>

                {/* Cost comparison */}
                <CostBar
                  solo={p.soloCost}
                  carpool={p.carpoolCost}
                  accent={p.accent}
                  inView={isInView}
                  delay={0.3 + 0.15 * i}
                />

                {/* Monthly savings callout */}
                <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-eco-500/[0.06] border border-eco-500/10">
                  <svg className="w-5 h-5 text-eco-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-eco-600 dark:text-eco-400">
                      Saves {p.monthlySavings.toLocaleString()} ETB
                      <span className="font-normal text-eco-500/70"> /month</span>
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
                  "{p.quote}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom aggregate stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-14 text-center"
        >
          <div className="inline-flex items-center gap-4 glass-strong rounded-2xl px-8 py-5 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-eco-500 to-emerald-400 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
                2,000+ ETB
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                average monthly savings per commuter
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
