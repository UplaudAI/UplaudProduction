import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

              <div className="mt-16 pt-10 border-t border-[#eeeaf6] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
