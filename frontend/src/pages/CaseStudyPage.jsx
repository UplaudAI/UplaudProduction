import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { ArrowLeft, Share2, Clock, ArrowUpRight } from "lucide-react";
import Nav from "@/components/business/Nav";
import Footer from "@/components/business/Footer";

export default function CaseStudyPage() {
  const { slug, csSlug } = useParams();
  const [cs, setCs] = useState(null);
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    const contentRequest = api
      .get(`/business/public/${slug}/content/${csSlug}`)
      .then(({ data }) => contentPostToCaseStudy(data))
      .catch(() =>
        api.get(`/business/public/${slug}/case-studies/${csSlug}`).then(({ data }) => data)
      );

    Promise.all([contentRequest, api.get(`/business/public/${slug}`)])
      .then(([csRes, bRes]) => {
        if (ignore) return;
        setCs(csRes);
        setBusiness(bRes.data);
      })
      .catch(() => !ignore && setError(true));
    return () => { ignore = true; };
  }, [slug, csSlug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="cs-not-found">
        <div className="text-center max-w-md px-6">
          <h1 className="font-display text-3xl font-semibold mb-3">Story not found</h1>
          <Link to={`/business/public/${slug}`} className="u-btn u-btn-ghost mt-4 inline-flex">← Back to business</Link>
        </div>
      </div>
    );
  }
  if (!cs || !business) return <div className="min-h-screen flex items-center justify-center text-[color:var(--u-muted)]">Loading…</div>;

  return (
    <div className="min-h-screen bg-grain" data-testid="case-study-page">
      <Nav businessName={business.name} audience={business.audience} />

      <article className="max-w-[820px] mx-auto px-6 lg:px-10 py-14 lg:py-20">
        <Link
          to={`/business/public/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-[color:var(--u-muted)] hover:text-[color:var(--u-ink)] mb-8"
          data-testid="cs-back-link"
        >
          <ArrowLeft size={15} /> Back to {business.name}
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: "var(--u-violet-soft)", color: "var(--u-violet-2)" }}
          >
            {cs.tag}
          </span>
          <span className="text-xs text-[color:var(--u-muted)] inline-flex items-center gap-1.5">
            <Clock size={12} /> {cs.read_time}
          </span>
        </div>

        <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-[1.05] tracking-tight" data-testid="cs-title">
          {cs.title}
        </h1>

        <p className="mt-5 text-lg text-[color:var(--u-muted)] leading-relaxed">
          {cs.excerpt}
        </p>

        <div className="mt-8 flex items-center justify-between border-y border-[color:var(--u-line)] py-4">
          <div className="text-sm">
            <span className="text-[color:var(--u-muted)]">Featured customer · </span>
            <span className="font-medium">{cs.hero_quote_author}</span>
          </div>
          <button className="u-btn u-btn-ghost text-sm" data-testid="cs-share-btn">
            <Share2 size={14} /> Share
          </button>
        </div>

        <div
          className="prose-uplaud mt-10"
          dangerouslySetInnerHTML={{ __html: cs.body_html }}
          data-testid="cs-body"
        />

        <div
          className="mt-14 rounded-2xl p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #EEE9FF 0%, #DFF7EE 100%)" }}
        >
          <p className="font-serif-italic text-2xl leading-snug text-[color:var(--u-ink)] max-w-lg">
            “{cs.hero_quote}”
          </p>
          <p className="mt-3 text-sm text-[color:var(--u-ink-2)]">— {cs.hero_quote_author}</p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--u-line)] pt-8">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--u-muted)] mb-1">Explore</p>
            <p className="font-display text-xl font-semibold">More stories from {business.name}</p>
          </div>
          <Link to={`/business/public/${slug}#stories`} className="u-btn u-btn-dark" data-testid="cs-more-stories">
            Browse all stories <ArrowUpRight size={16} />
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}

function contentPostToCaseStudy(post) {
  return {
    id: post.id || post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || post.meta_description,
    tag: post.content_type || "Buyer guide",
    read_time: estimateReadTime(post.content_html),
    body_html: post.content_html || "",
    hero_quote: post.buyer_question || post.meta_description || post.excerpt || "",
    hero_quote_author: "Uplaud Content Agent",
  };
}

function estimateReadTime(contentHtml) {
  const text = (contentHtml || "").replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}
