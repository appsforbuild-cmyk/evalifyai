import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import HowItWorks from "@/components/HowItWorks";
import KeyFeatures from "@/components/KeyFeatures";
import WhyEvalifyAI from "@/components/WhyEvalifyAI";
import FutureVision from "@/components/FutureVision";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <KeyFeatures />
      <WhyEvalifyAI />
      <FutureVision />
      <Waitlist />
      <Footer />
    </main>
  );
};

export default Index;
