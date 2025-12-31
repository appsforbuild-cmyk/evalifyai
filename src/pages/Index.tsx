import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import HowItWorks from "@/components/HowItWorks";
import KeyFeatures from "@/components/KeyFeatures";
import WhyEvalifyAI from "@/components/WhyEvalifyAI";
import FutureVision from "@/components/FutureVision";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import { TestimonialsSection, PricingPreviewSection, FAQSection, CTASection } from "@/components/landing/LandingSections";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <div id="hero">
        <Hero />
      </div>
      <div id="problem">
        <Problem />
      </div>
      <div id="solution">
        <Solution />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="features">
        <KeyFeatures />
      </div>
      <WhyEvalifyAI />
      <TestimonialsSection />
      <PricingPreviewSection />
      <FAQSection />
      <CTASection />
      <FutureVision />
      <div id="waitlist">
        <Waitlist />
      </div>
      <Footer />
    </main>
  );
};

export default Index;
