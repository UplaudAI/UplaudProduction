import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import Nav from "@/components/business/Nav";
import Hero from "@/components/business/Hero";
import Insights from "@/components/business/Insights";
import ReviewsSection from "@/components/business/ReviewsSection";
import CaseStudies from "@/components/business/CaseStudies";
import Footer from "@/components/business/Footer";
import TrustStrip from "@/components/business/TrustStrip";

export default function BusinessPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [stats, setStats] = useState(null);
  const [caseStudies, setCaseStudies] = useState([]);
  const [topReviews, setTopReviews] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    api
      .get(`/business/public/${slug}/page`)
      .then(({ data }) => {
        if (ignore) return;
        setBusiness(data.business);
        setStats(data.stats);
        setCaseStudies(data.case_studies || []);
        setTopReviews(data.top_reviews || []);
      })
      .catch(() => !ignore && setError(true));
    return () => { ignore = true; };
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="business-not-found">
        <div className="text-center max-w-md px-6">
          <h1 className="font-display text-3xl font-semibold mb-3">Business not found</h1>
          <p className="text-[color:var(--u-muted)]">We couldn&apos;t find a business with slug <span className="font-mono">{slug}</span>.</p>
        </div>
      </div>
    );
  }

  if (!business || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="business-loading">
        <div className="text-center">
          <div className="font-display text-lg text-[color:var(--u-muted)] animate-pulse">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain" data-testid="business-page">
      <Nav businessName={business.name} audience={business.audience} />
      <Hero business={business} stats={stats} topReviews={topReviews} />
      <TrustStrip business={business} stats={stats} />
      <ReviewsSection slug={slug} businessName={business.name} audience={business.audience} />
      <Insights stats={stats} />
      <CaseStudies slug={slug} caseStudies={caseStudies} />
      <Footer />
    </div>
  );
}
