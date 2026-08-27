import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Nav from "@/components/business/Nav";
import Hero from "@/components/business/Hero";
import Insights from "@/components/business/Insights";
import ReviewsSection from "@/components/business/ReviewsSection";
import CaseStudies from "@/components/business/CaseStudies";
import ShareCTA from "@/components/business/ShareCTA";
import Footer from "@/components/business/Footer";
import TrustStrip from "@/components/business/TrustStrip";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BusinessPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [stats, setStats] = useState(null);
  const [caseStudies, setCaseStudies] = useState([]);
  const [topReviews, setTopReviews] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      axios.get(`${API}/business/${slug}`),
      axios.get(`${API}/business/${slug}/stats`),
      axios.get(`${API}/business/${slug}/case-studies`),
      axios.get(`${API}/business/${slug}/reviews?sort=top&limit=4`),
    ])
      .then(([b, s, cs, rv]) => {
        if (ignore) return;
        setBusiness(b.data);
        setStats(s.data);
        setCaseStudies(cs.data.case_studies || []);
        setTopReviews(rv.data.reviews || []);
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
      <ShareCTA slug={slug} businessName={business.name} />
      <Footer />
    </div>
  );
}
