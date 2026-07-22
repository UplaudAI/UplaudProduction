import { useState, useRef } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

const ACCEPT = ".txt,.doc,.docx,.pdf";

export default function SourcesTab({ sources, refreshSources, onAnalyze }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const inputRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;
    const okExt = ["txt", "doc", "docx", "pdf"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!okExt.includes(ext)) {
      toast.error("Unsupported file. Use .txt, .doc, .docx or .pdf");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/sources", form, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshSources();
      toast.success(`Uploaded "${file.name}"`);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFile(e.dataTransfer.files?.[0]);
  };

  const analyze = async (id) => {
    setAnalyzingId(id);
    try {
      await api.post(`/sources/${id}/analyze`);
      await refreshSources();
      toast.success("Insights generated");
      onAnalyze(id);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl" data-testid="sources-tab">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Sources</h2>
        <p className="text-slate-500 text-sm mt-1">Upload a client demo call transcript (.txt, .doc, .docx or .pdf).</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        data-testid="upload-dropzone"
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-50/60" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          data-testid="upload-file-input"
          onChange={(e) => uploadFile(e.target.files?.[0])}
        />
        {uploading ? (
          <Loader2 className="h-9 w-9 text-indigo-500 mx-auto animate-spin" />
        ) : (
          <UploadCloud className="h-9 w-9 text-slate-400 mx-auto" />
        )}
        <p className="mt-4 text-sm font-medium text-slate-700">
          {uploading ? "Uploading & parsing…" : "Drag & drop a transcript, or click to browse"}
        </p>
        <p className="text-xs text-slate-400 mt-1">Supports .txt, .doc, .docx, .pdf</p>
      </div>

      <div>
        <h3 className="font-heading text-lg font-bold text-slate-900 mb-3">Uploaded transcripts</h3>
        {sources.length === 0 ? (
          <p className="text-sm text-slate-400">No transcripts uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <Card key={s.id} className="p-4 border-slate-200 shadow-sm flex items-center justify-between" data-testid={`source-row-${s.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.client_name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.filename} · {s.word_count} words · {s.file_type.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === "analyzed" ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Analyzed
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => analyze(s.id)}
                    disabled={analyzingId === s.id}
                    data-testid={`analyze-button-${s.id}`}
                    className="bg-indigo-600 hover:bg-indigo-700 transition-transform hover:-translate-y-[1px]"
                  >
                    {analyzingId === s.id ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing…</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-1" /> {s.status === "analyzed" ? "Re-run" : "Generate Insights"}</>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
