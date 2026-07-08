import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import PainPoint from "@/components/landing/PainPoint";
import TrustGraph from "@/components/landing/TrustGraph";
import HowItWorks from "@/components/landing/HowItWorks";
import Loops from "@/components/landing/Loops";
import FeatureGrid from "@/components/landing/FeatureGrid";
import Outcomes from "@/components/landing/Outcomes";
import FAQ from "@/components/landing/FAQ";
import LeadForm from "@/components/landing/LeadForm";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div
      data-testid="landing-page"
      className="min-h-screen bg-[#fdfdfb] text-[#0a0a0a]"
    >
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <PainPoint />
        <TrustGraph />
        <HowItWorks />
        <Loops />
        <FeatureGrid />
        <Outcomes />
        <FAQ />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
}
