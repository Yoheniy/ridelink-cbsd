import { lazy, Suspense } from "react";
import { Hero } from "../sections/Hero";
import { HowItWorks } from "../sections/HowItWorks";
import { Features } from "../sections/Features";
import { Commuters } from "../sections/Commuters";
import { Showcase } from "../sections/Showcase";
import { Impact } from "../sections/Impact";
import { Testimonials } from "../sections/Testimonials";
import { AppPreview } from "../sections/AppPreview";
import { CallToAction } from "../sections/CallToAction";
import { Footer } from "../sections/Footer";

const MapSection = lazy(() =>
  import("../sections/MapSection").then((m) => ({ default: m.MapSection }))
);

function MapFallback() {
  return (
    <div className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="h-[520px] rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading map...</p>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Commuters />
      <Suspense fallback={<MapFallback />}>
        <MapSection />
      </Suspense>
      <Features />
      <Showcase />
      <Impact />
      <Testimonials />
      <AppPreview />
      <CallToAction />
      <Footer />
    </>
  );
}

export default Landing;
