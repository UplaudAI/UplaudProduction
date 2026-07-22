import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/blog?limit=50`)
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div data-testid="blog-list-page" className="min-h-screen bg-white text-[#111827]">
      <Navbar />
      <main className="pt-28 md:pt-36 pb-24">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10">
          <div className="max-w-3xl">
            <span className="section-label">Uplaud journal</span>
            <h1 className="mt-4 font-display text-[44px] sm:text-[56px] lg:text-[68px] leading-[1.02] font-semibold tracking-tight">
              Notes on trust,
              <br />
              <span className="mint-underline">growth &amp; AI</span>.
            </h1>
            <p className="mt-6 text-[16px] leading-relaxed text-[#4b5563]">
              Playbooks, teardowns and things we&apos;re learning about turning
              customer trust into acquisition.
            </p>
          </div>

          {loading ? (
            <div data-testid="blog-loading" className="mt-20 text-[14px] text-[#9ca3af]">
              Loading&hellip;
            </div>
          ) : posts.length === 0 ? (
            <div
              data-testid="blog-empty"
              className="mt-20 border border-dashed border-[#eeeaf6] rounded-2xl p-12 text-center bg-[#faf9ff]"
            >
              <p className="font-display text-[22px] text-[#111827]">
                First post coming soon.
              </p>
              <p className="mt-2 text-[14px] text-[#4b5563] max-w-md mx-auto">
                We&apos;re cooking up our first stories on trust-powered growth.
                Check back soon or book a demo.
              </p>
              <Link to="/#demo" className="btn-primary mt-6 inline-flex">
                Book a demo
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>
          ) : (
            <div className="mt-16 space-y-16">
              {featured && (
                <Link
                  to={`/blog/${featured.slug}`}
                  data-testid="blog-featured"
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#eeeaf6] pb-16"
                >
                  <div className="lg:col-span-7">
                    <CoverImage post={featured} large />
                  </div>
                  <div className="lg:col-span-5">
                    <PostMeta post={featured} />
                    <h2 className="mt-4 font-display text-[30px] sm:text-[36px] lg:text-[42px] leading-[1.05] font-semibold tracking-tight text-[#111827] group-hover:text-[#6d46c6] transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-[#4b5563]">
                      {featured.excerpt}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6d46c6]">
                      Read post
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function PostCard({ post, testIdPrefix = "blog-post" }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      data-testid={`${testIdPrefix}-${post.slug}`}
      className="group flex flex-col rounded-2xl border border-[#eeeaf6] overflow-hidden bg-white hover:border-[#6d46c6] hover:shadow-[0_20px_50px_-30px_rgba(38,28,77,0.35)] transition-all"
    >
      <CoverImage post={post} />
      <div className="p-6">
        <PostMeta post={post} />
        <h3 className="mt-3 font-display text-[19px] leading-snug font-semibold tracking-tight text-[#111827] group-hover:text-[#6d46c6] transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#4b5563] line-clamp-3">
          {post.excerpt}
        </p>
      </div>
    </Link>
  );
}

function CoverImage({ post, large = false }) {
  const cls = large
    ? "aspect-[16/10] rounded-2xl"
    : "aspect-[16/10] rounded-none border-b border-[#eeeaf6]";
  if (post.cover_image) {
    return (
      <div
        className={`${cls} bg-cover bg-center bg-[#faf9ff]`}
        style={{ backgroundImage: `url("${post.cover_image}")` }}
      />
    );
  }
  return (
    <div
      className={`${cls} bg-gradient-to-br from-[#f5f3ff] via-[#ecfdf7] to-[#faf9ff] flex items-center justify-center`}
    >
      <span className="font-display text-[#6d46c6]/40 text-[36px] font-semibold tracking-tight">
        uplaud
      </span>
    </div>
  );
}

function PostMeta({ post }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-[#4b5563]">
      {post.tag && (
        <span className="px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#6d46c6]">
          {post.tag}
        </span>
      )}
      <span>{formatDate(post.created_at)}</span>
    </div>
  );
}
