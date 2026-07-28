import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { API } from "@/lib/api";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    setState("loading");
    axios
      .get(`${API}/blog/${slug}`)
      .then((res) => {
        setPost(res.data);
        setState("ready");
      })
      .catch(() => setState("not-found"));
  }, [slug]);

  return (
    <div data-testid="blog-post-page" className="min-h-screen bg-white text-[#111827]">
      <Navbar />
      <main className="pt-28 md:pt-36 pb-24">
        <div className="max-w-[820px] mx-auto px-6 md:px-10">
          <Link
            to="/blog"
            data-testid="blog-back"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4b5563] hover:text-[#6d46c6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            All posts
          </Link>

          {state === "loading" && (
            <div className="mt-20 text-[14px] text-[#9ca3af]">Loading&hellip;</div>
          )}

          {state === "not-found" && (
            <div className="mt-20 text-center">
              <p className="font-display text-[22px] text-[#111827]">
                Post not found.
              </p>
              <Link to="/blog" className="btn-primary mt-6 inline-flex">
                Back to blog
              </Link>
            </div>
          )}

          {state === "ready" && post && (
            <>
              <header className="mt-10">
                <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-[#4b5563]">
                  {post.tag && (
                    <span className="px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#6d46c6]">
                      {post.tag}
                    </span>
                  )}
                  <span>{formatDate(post.created_at)}</span>
                  <span>·</span>
                  <span>{post.author}</span>
                </div>
                <h1
                  data-testid="post-title"
                  className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] font-semibold tracking-tight text-[#111827]"
                >
                  {post.title}
                </h1>
                <p className="mt-5 text-[17px] leading-relaxed text-[#4b5563]">
                  {post.excerpt}
                </p>
              </header>

              {post.cover_image && (
                <div
                  className="mt-10 aspect-[16/9] rounded-2xl bg-cover bg-center border border-[#eeeaf6]"
                  style={{ backgroundImage: `url("${post.cover_image}")` }}
                />
              )}

              <article
                data-testid="post-body"
                className="mt-10 prose prose-neutral max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-[#111827] prose-p:text-[#374151] prose-p:leading-[1.7] prose-a:text-[#6d46c6] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#111827] prose-code:text-[#6d46c6] prose-code:bg-[#f5f3ff] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-[#5eead4] prose-blockquote:bg-[#faf9ff] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-li:marker:text-[#6d46c6]"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </article>

              {/* Lead Magnet Widget */}
              <div data-testid="lead-magnet-widget" className="mt-16 rounded-2xl border border-[#d9d1ee] bg-[#faf9ff] p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-[#6d46c6] bg-[#f5f3ff] px-2.5 py-0.5 rounded-full mb-3">
                      💡 exclusive guide
                    </span>
                    <h3 className="font-display text-[20px] font-semibold text-[#111827]">
                      Download "{post.title}" as a PDF Playbook
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4b5563]">
                      We'll compile this article, including all checklist items and formatting, into a clean PDF copy for you to read offline or share directly with your team.
                    </p>
                  </div>
                  <div className="w-full md:w-auto shrink-0 min-w-[280px]">
                    <LeadMagnetForm slug={slug} />
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-[#eeeaf6] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="font-display text-[20px] font-semibold text-[#111827]">
                    Turn your customer trust into your #1 acquisition channel.
                  </div>
                  <p className="mt-1 text-[14px] text-[#4b5563]">
                    See what Uplaud can do for your business in 20 minutes.
                  </p>
                </div>
                <Link
                  to="/#demo"
                  data-testid="post-cta"
                  className="btn-primary"
                >
                  Book a demo
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LeadMagnetForm({ slug }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/blog/lead-magnet`, { email: email.trim(), slug });
      setSubmitted(true);
      toast.success("PDF request received!", { description: "Check your inbox in a couple of minutes." });
    } catch (err) {
      toast.error("Couldn't request PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="lead-magnet-success" className="text-center md:text-left bg-white border border-[#c8f0e4] rounded-xl p-4 text-[#0f9b7c] text-[13px] font-medium">
        🎉 Playbook sent! Check your inbox shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="lead-magnet-form" className="space-y-2">
      <input
        type="email"
        required
        placeholder="Enter your work email"
        data-testid="lead-magnet-email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-white border border-[#eeeaf6] rounded-xl px-3 py-2.5 text-[13.5px] text-[#111827] focus:border-[#6d46c6] focus:outline-none"
      />
      <button
        type="submit"
        data-testid="lead-magnet-submit-btn"
        disabled={loading}
        className="btn-primary w-full justify-center h-10 text-[13px]"
      >
        {loading ? "Sending..." : "Download Playbook"}
      </button>
    </form>
  );
}
