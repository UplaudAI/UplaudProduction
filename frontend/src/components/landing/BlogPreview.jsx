import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PostCard } from "@/pages/BlogListPage";
import { API } from "@/lib/api";

export default function BlogPreview() {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/blog/latest?limit=3`)
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || posts.length === 0) return null;

  return (
    <section
      id="journal"
      data-testid="blog-preview-section"
      className="relative py-24 md:py-32 bg-white border-t border-[#eeeaf6]"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="section-label">06 / journal</span>
            <h2 className="mt-4 font-display text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-tight text-[#111827]">
              What we&apos;re thinking about.
            </h2>
          </div>
          <Link
            to="/blog"
            data-testid="blog-preview-all"
            className="btn-secondary"
          >
            All posts
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} testIdPrefix="blog-preview-post" />
          ))}
        </div>
      </div>
    </section>
  );
}
