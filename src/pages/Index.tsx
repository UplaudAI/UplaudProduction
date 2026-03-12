import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ForCustomers from "@/components/ForCustomers";
import ForBusinesses from "@/components/ForBusinesses";
import HowItWorks from "@/components/HowItWorks";
import UpcomingFeatures from "@/components/UpcomingFeatures";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    const handleScroll = () => {
      const fadeElements = document.querySelectorAll(".fade-in-scroll");

      fadeElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top <= window.innerHeight * 0.8;

        if (isInViewport) {
          element.classList.add("appear");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const canonicalUrl = "https://www.uplaud.ai/";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Uplaud",
    url: canonicalUrl,
    logo: "https://www.uplaud.ai/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png",
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Uplaud",
    applicationCategory: "MarketingApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
    description:
      "Uplaud turns WhatsApp conversations into authentic reviews, shareable social proof, and referral revenue.",
    url: canonicalUrl,
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Uplaud | Real Reviews. Real People. Real Growth.</title>
        <meta
          name="description"
          content="Collect authentic WhatsApp reviews, turn them into referrals, and reward your best advocates with Uplaud."
        />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify(organizationJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(softwareJsonLd)}
        </script>
      </Helmet>
      <Navbar />
      <Hero />
      <ForCustomers />
      <ForBusinesses />
      <HowItWorks />
      <UpcomingFeatures />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
