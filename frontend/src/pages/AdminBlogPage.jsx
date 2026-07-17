import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  LogOut,
  Upload,
  ImageIcon,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "uplaud_admin_token";

function authHeaders() {
  const t = localStorage.getItem(TOKEN_KEY) || "";
  return { "X-Admin-Token": t };
}

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  tag: "",
  author: "Uplaud Team",
  published: true,
};

export default function AdminBlogPage() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [token, setToken] = useState("");

  const signIn = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    localStorage.setItem(TOKEN_KEY, token.trim());
    // ping
    try {
      await axios.get(`${API}/admin/blog?limit=1`, { headers: authHeaders() });
      setAuthed(true);
      toast.success("Signed in");
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      toast.error("Invalid token");
    }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
    setToken("");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-white text-[#111827]">
        <Navbar />
        <main className="pt-32 pb-24">
          <div className="max-w-md mx-auto px-6">
            <span className="section-label">admin</span>
            <h1 className="mt-4 font-display text-[36px] font-semibold tracking-tight">
              Sign in to manage the blog.
            </h1>
            <form onSubmit={signIn} className="mt-8 space-y-4">
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#4b5563]">
                  Admin token
                </span>
                <input
                  type="password"
                  data-testid="admin-token-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-2 w-full bg-white border border-[#eeeaf6] rounded-xl px-3 py-3 text-[14px] focus:border-[#6d46c6] focus:outline-none"
                />
              </label>
              <button
                type="submit"
                data-testid="admin-signin-btn"
                className="btn-primary w-full justify-center"
              >
                Sign in
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return <AdminBlogDashboard onSignOut={signOut} />;
}

function AdminBlogDashboard({ onSignOut }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // slug or "new"
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/blog?limit=200`, {
        headers: authHeaders(),
      });
      setPosts(res.data.posts || []);
    } catch {
      toast.error("Could not load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setForm(EMPTY);
    setEditing("new");
  };
  const startEdit = (p) => {
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      cover_image: p.cover_image || "",
      tag: p.tag || "",
      author: p.author || "Uplaud Team",
      published: p.published,
    });
    setEditing(p.slug);
  };
  const cancel = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const update = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error("Title, excerpt and content are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        cover_image: form.cover_image || null,
        tag: form.tag || null,
      };
      if (editing === "new") {
        await axios.post(`${API}/blog`, payload, { headers: authHeaders() });
        toast.success("Post created");
      } else {
        await axios.put(`${API}/blog/${editing}`, payload, {
          headers: authHeaders(),
        });
        toast.success("Post updated");
      }
      cancel();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await axios.delete(`${API}/blog/${slug}`, { headers: authHeaders() });
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="section-label">admin · blog</span>
              <h1 className="mt-3 font-display text-[36px] font-semibold tracking-tight">
                Journal admin
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="admin-new-post-btn"
                onClick={startNew}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                New post
              </button>
              <button
                type="button"
                data-testid="admin-signout-btn"
                onClick={onSignOut}
                className="btn-secondary"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </div>

          {editing !== null && (
            <form
              onSubmit={save}
              data-testid="admin-post-form"
              className="mt-10 border border-[#eeeaf6] rounded-2xl p-6 md:p-8 bg-[#faf9ff]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Title" required>
                  <input
                    data-testid="admin-title"
                    value={form.title}
                    onChange={update("title")}
                    className="admin-input"
                  />
                </F>
                <F
                  label="Slug"
                  hint={editing === "new" ? "auto from title if empty" : ""}
                >
                  <input
                    data-testid="admin-slug"
                    value={form.slug}
                    onChange={update("slug")}
                    className="admin-input"
                  />
                </F>
                <F label="Tag">
                  <input
                    data-testid="admin-tag"
                    value={form.tag}
                    onChange={update("tag")}
                    placeholder="Growth · Playbook · Case study"
                    className="admin-input"
                  />
                </F>
                <F label="Author">
                  <input
                    data-testid="admin-author"
                    value={form.author}
                    onChange={update("author")}
                    className="admin-input"
                  />
                </F>
              </div>
              <F label="Cover image" className="mt-4">
                <CoverUploader
                  value={form.cover_image}
                  onChange={(url) =>
                    setForm((f) => ({ ...f, cover_image: url }))
                  }
                />
              </F>
              <F label="Excerpt" required className="mt-4">
                <textarea
                  data-testid="admin-excerpt"
                  value={form.excerpt}
                  onChange={update("excerpt")}
                  rows={2}
                  className="admin-input"
                />
              </F>
              <F label="Content (Markdown)" required className="mt-4">
                <MarkdownEditor
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                />
              </F>
              <label className="mt-4 flex items-center gap-2 text-[13px] text-[#111827]">
                <input
                  type="checkbox"
                  data-testid="admin-published"
                  checked={form.published}
                  onChange={update("published")}
                />
                Published
              </label>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  data-testid="admin-save-btn"
                  disabled={saving}
                  className="btn-primary disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      Save
                      <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  data-testid="admin-cancel-btn"
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-12">
            <div className="section-label mb-4">All posts</div>
            {loading ? (
              <div className="text-[14px] text-[#9ca3af]">Loading&hellip;</div>
            ) : posts.length === 0 ? (
              <div className="text-[14px] text-[#9ca3af]">No posts yet.</div>
            ) : (
              <div className="border border-[#eeeaf6] rounded-2xl divide-y divide-[#eeeaf6]">
                {posts.map((p) => (
                  <div
                    key={p.slug}
                    data-testid={`admin-post-row-${p.slug}`}
                    className="p-5 flex items-center justify-between gap-4 hover:bg-[#faf9ff] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[16px] font-semibold text-[#111827] truncate">
                          {p.title}
                        </span>
                        {!p.published && (
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af] px-2 py-0.5 border border-[#eeeaf6] rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[12px] text-[#4b5563] truncate">
                        /blog/{p.slug} · {p.tag || "no tag"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/blog/${p.slug}`}
                        target="_blank"
                        className="text-[12px] text-[#6d46c6] hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => startEdit(p)}
                        data-testid={`admin-edit-${p.slug}`}
                        className="w-8 h-8 rounded-full border border-[#eeeaf6] hover:border-[#6d46c6] hover:text-[#6d46c6] flex items-center justify-center transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => remove(p.slug)}
                        data-testid={`admin-delete-${p.slug}`}
                        className="w-8 h-8 rounded-full border border-[#eeeaf6] hover:border-red-500 hover:text-red-500 flex items-center justify-center transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .admin-input {
          margin-top: 6px;
          width: 100%;
          background: #ffffff;
          border: 1px solid #eeeaf6;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color 150ms ease;
        }
        .admin-input:focus {
          border-color: #6d46c6;
        }
      `}</style>
    </div>
  );
}

function F({ label, hint, required, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-mono text-[11px] uppercase tracking-widest text-[#4b5563]">
        {label}
        {required && <span className="text-[#6d46c6]"> *</span>}
        {hint && (
          <span className="normal-case tracking-normal ml-2 text-[#9ca3af]">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

async function uploadImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    toast.error("Please choose an image file.");
    return null;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast.error("Image is over 8MB.");
    return null;
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await axios.post(`${API}/admin/upload`, fd, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

function CoverUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        onChange(url);
        toast.success("Image uploaded");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer?.files?.[0];
          if (file) handle(file);
        }}
        onClick={() => inputRef.current?.click()}
        data-testid="admin-cover-dropzone"
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 flex items-center gap-4 transition-colors ${
          dragOver
            ? "border-[#6d46c6] bg-[#f5f3ff]"
            : "border-[#d9d1ee] bg-white hover:border-[#6d46c6]"
        }`}
      >
        {value ? (
          <div
            className="w-24 h-16 rounded-lg bg-cover bg-center border border-[#eeeaf6]"
            style={{ backgroundImage: `url("${value}")` }}
          />
        ) : (
          <div className="w-24 h-16 rounded-lg bg-[#faf9ff] border border-[#eeeaf6] flex items-center justify-center text-[#9ca3af]">
            <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#111827]">
            {value ? "Replace cover image" : "Drag or click to upload"}
          </div>
          <div className="text-[11px] text-[#4b5563] truncate">
            {value || "PNG, JPG, WebP · up to 8MB · hosted on fal.ai CDN"}
          </div>
        </div>
        <button
          type="button"
          data-testid="admin-cover-upload-btn"
          disabled={uploading}
          className="btn-secondary shrink-0 disabled:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" strokeWidth={1.75} />
              {value ? "Replace" : "Upload"}
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          data-testid="admin-cover-file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          data-testid="admin-cover-clear"
          className="mt-2 text-[11px] font-mono uppercase tracking-widest text-[#4b5563] hover:text-red-500"
        >
          Remove cover
        </button>
      )}
    </div>
  );
}

/**
 * Markdown editor with inline image upload via drag-drop or paste.
 * Uploaded images become Markdown `![alt](url)` at the cursor position.
 */
function MarkdownEditor({ value, onChange }) {
  const taRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const insertAtCursor = (text) => {
    const ta = taRef.current;
    if (!ta) {
      onChange((value || "") + text);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = (value || "").slice(0, start) + text + (value || "").slice(end);
    onChange(next);
    // Restore cursor position after React updates
    requestAnimationFrame(() => {
      const pos = start + text.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleFile = async (file, altHint = "") => {
    if (!file) return;
    setUploading(true);
    // insert a placeholder so authors see progress inline
    const placeholder = `![uploading ${file.name}...]()`;
    insertAtCursor(placeholder);
    try {
      const url = await uploadImage(file);
      const currentVal = taRef.current?.value ?? "";
      if (url) {
        const alt = altHint || file.name.replace(/\.[^.]+$/, "");
        const md = `![${alt}](${url})`;
        onChange(currentVal.replace(placeholder, md));
        toast.success("Image inserted");
      } else {
        onChange(currentVal.replace(placeholder, ""));
      }
    } catch (err) {
      const currentVal = taRef.current?.value ?? "";
      onChange(currentVal.replace(placeholder, ""));
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    e.preventDefault();
    setDragOver(false);
    files.forEach((f) => handleFile(f));
  };

  const onPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgs = items
      .filter((i) => i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter(Boolean);
    if (imgs.length === 0) return;
    e.preventDefault();
    imgs.forEach((f) => handleFile(f, "pasted-image"));
  };

  return (
    <div className="mt-2">
      <div
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer?.types || []).includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-xl border transition-colors ${
          dragOver ? "border-[#6d46c6] bg-[#f5f3ff]" : "border-[#eeeaf6] bg-white"
        }`}
      >
        <textarea
          ref={taRef}
          data-testid="admin-content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          rows={16}
          spellCheck={true}
          className="w-full bg-transparent rounded-t-xl px-3 py-3 font-mono text-[13px] text-[#111827] outline-none resize-y"
          placeholder={
            "Write your post in Markdown. Drag or paste images anywhere in the text to upload and embed them."
          }
        />
        <div className="flex items-center justify-between gap-3 border-t border-[#eeeaf6] px-3 py-2 rounded-b-xl bg-[#faf9ff]">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#4b5563]">
            <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
            drag &middot; paste &middot; or
            <button
              type="button"
              data-testid="admin-content-image-btn"
              onClick={() => fileRef.current?.click()}
              className="text-[#6d46c6] hover:underline normal-case tracking-normal"
            >
              upload
            </button>
            image
          </div>
          {uploading && (
            <span className="text-[11px] text-[#6d46c6] font-mono flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              uploading
            </span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          data-testid="admin-content-file"
          className="hidden"
          multiple
          onChange={(e) => {
            Array.from(e.target.files || []).forEach((f) => handleFile(f));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
