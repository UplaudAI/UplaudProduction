import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import PainPoint from "@/components/landing/PainPoint";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustGraph from "@/components/landing/TrustGraph";
import Surfaces from "@/components/landing/Surfaces";
import Outcomes from "@/components/landing/Outcomes";
import FAQ from "@/components/landing/FAQ";
import LeadForm from "@/components/landing/LeadForm";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div data-testid="landing-page" className="min-h-screen bg-white text-[#111827]">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <PainPoint />
        <HowItWorks />
        <TrustGraph />
        <Surfaces />
        <Outcomes />
        <FAQ />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
}
