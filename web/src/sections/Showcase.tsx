import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const images = [
  {
    src: "/images/addis-road-night.webp",
    alt: "Addis Ababa road at night with city lights and traffic",
    label: "Streets of Addis",
  },
  {
    src: "/images/ethipianstudentpic.jpeg",
    alt: "Ethiopian university students on campus ready for their shared commute",
    label: "Students riding together",
  },
  {
    src: "/images/rain-queue.jpg",
    alt: "Commuters queuing in the rain for minibus taxis in Addis Ababa",
    label: "Rain or shine",
    tall: true,
  },
  {
    src: "/images/ethiopiancaremptydrive.jpeg",
    alt: "Ethiopian driver with empty seats ready to offer a carpool ride",
    label: "Seats waiting for you",
  },
  {
    src: "/images/merkato-bus-station.jpg",
    alt: "Crowded Merkato bus station in Addis Ababa with commuters and buses",
    label: "Merkato rush",
    tall: true,
  },
  {
    src: "/images/taxiline.jpeg",
    alt: "Commuters crowding around minibus taxis during peak hours in Addis Ababa",
    label: "Minibus rush hour",
  },
];

export function Showcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-24 px-6 relative overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            Carpooling in action
          </span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">
            More than just a ride
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            From students heading to campus to professionals arriving at the office,
            shared commutes build real connections across the city.
          </p>
        </motion.div>

        {/* Masonry-style image grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {images.map((img, i) => (
            <motion.div
              key={img.label}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 * i, duration: 0.5 }}
              className={`relative group rounded-2xl overflow-hidden ${
                img.tall ? "row-span-2" : ""
              }`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ minHeight: img.tall ? "100%" : "200px" }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-white font-display font-bold text-sm sm:text-base">{img.label}</span>
              </div>

              {/* Corner accent */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-center"
        >
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["AK", "SM", "DT", "HG"].map((initials, i) => (
                <div
                  key={initials}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{
                    background: ["linear-gradient(135deg,#08a6c4,#5ee2f5)", "linear-gradient(135deg,#6f9f9c,#afd0ce)", "linear-gradient(135deg,#559e99,#91cdc8)", "linear-gradient(135deg,#0ccfed,#9aeffa)"][i],
                    zIndex: 4 - i,
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">5,200+</span> commuters already riding
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
