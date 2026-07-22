import { useState, useEffect } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmailComposer from "@/components/app/EmailComposer";
import {
  Sparkles, Loader2, Quote, Pencil, Save, X, Send, TrendingUp,
  MessageSquareQuote, AlertTriangle, Target, Gauge,
} from "lucide-react";

function SentimentBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function GrowthSignalsTab({ sources, selectedId, setSelectedId, refreshSources, user }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState(null);

  const selected = sources.find((s) => s.id === selectedId) || null;
  const insights = selected?.insights;

  useEffect(() => {
    if (!selectedId && sources.length > 0) setSelectedId(sources[0].id);
  }, [sources, selectedId, setSelectedId]);

  useEffect(() => {
    setDraft(selected?.testimonial_draft || "");
    setEditing(false);
  }, [selectedId, selected?.testimonial_draft]);

  const analyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      await api.post(`/sources/${selected.id}/analyze`);
      await refreshSources();
      toast.success("Insights generated");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await api.put(`/sources/${selected.id}/testimonial`, { testimonial_draft: draft });
      await refreshSources();
      setEditing(false);
      toast.success("Testimonial updated");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openEmail = async () => {
    try {
      const res = await api.get(`/sources/${selected.id}/email-draft`);
      setEmailData(res.data);
      setEmailOpen(true);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not open email");
    }
  };

  if (sources.length === 0) {
    return (
      <div className="text-center py-20" data-testid="signals-empty">
        <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
        <p className="text-slate-500 mt-4">Upload a transcript in Sources to generate Growth Signals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="signals-tab">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Growth Signals</h2>
          <p className="text-slate-500 text-sm mt-1">AI insights & auto-drafted testimonial from your demo call.</p>
        </div>
        <Select value={selectedId || ""} onValueChange={setSelectedId}>
          <SelectTrigger className="w-64" data-testid="signals-source-select">
            <SelectValue placeholder="Select a transcript" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id} data-testid={`signals-option-${s.id}`}>
                {s.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!insights ? (
        <Card className="p-12 text-center border-slate-200 shadow-sm border-dashed" data-testid="signals-generate-panel">
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-slate-900 mt-4">Generate insights for {selected?.client_name}</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            We'll analyze the conversation, surface key themes & sentiment, and auto-draft a testimonial from the highest-sentiment moments.
          </p>
          <Button
            onClick={analyze}
            disabled={analyzing}
            data-testid="signals-generate-button"
            className="mt-5 bg-indigo-600 hover:bg-indigo-700 transition-transform hover:-translate-y-[1px]"
          >
            {analyzing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4 mr-1" /> Generate Insights</>}
          </Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Insights column */}
          <div className="space-y-6">
            <Card className="p-6 border-slate-200 shadow-sm" data-testid="insights-summary">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <h3 className="font-heading font-bold text-slate-900">Conversation summary</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{insights.summary}</p>
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Gauge className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Overall sentiment</span>
                </div>
                <SentimentBar score={insights.sentiment_score} />
                <p className="text-xs text-slate-500 mt-2">{insights.sentiment_overview}</p>
              </div>
            </Card>

            <Card className="p-6 border-slate-200 shadow-sm">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">Key themes</h4>
              <div className="flex flex-wrap gap-2">
                {insights.key_themes?.map((t, i) => (
                  <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">{t}</Badge>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareQuote className="h-4 w-4 text-emerald-600" />
                <h4 className="font-heading font-bold text-slate-900">Highest-sentiment highlights</h4>
              </div>
              <div className="space-y-3">
                {insights.highlights?.map((h, i) => (
                  <div key={i} className="pl-3 border-l-2 border-emerald-300" data-testid={`highlight-${i}`}>
                    <p className="text-sm text-slate-700 italic">"{h.quote}"</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">— {h.speaker}</span>
                      <span className="text-xs font-semibold text-emerald-600">{Math.round((h.sentiment_score || 0) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-5 border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Pain points</h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.pain_points?.map((p, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-amber-400">•</span>{p}</li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5 border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-indigo-500" />
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Buying signals</h4>
                </div>
                <ul className="space-y-1.5">
                  {insights.buying_signals?.map((p, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-indigo-400">•</span>{p}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* Testimonial column */}
          <div>
            <Card className="p-6 border-slate-200 shadow-sm sticky top-24" data-testid="testimonial-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                    <Quote className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading font-bold text-slate-900">Testimonial draft</h3>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">AI generated</Badge>
              </div>

              {editing ? (
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  data-testid="testimonial-textarea"
                  className="text-sm leading-relaxed"
                />
              ) : (
                <blockquote className="text-slate-700 text-[15px] leading-relaxed border-l-4 border-indigo-200 pl-4 py-1" data-testid="testimonial-text">
                  "{selected.testimonial_draft}"
                </blockquote>
              )}

              <p className="text-xs text-slate-400 mt-3">— {selected.client_name}, PayRewards demo</p>

              <div className="flex flex-wrap gap-2 mt-5">
                {editing ? (
                  <>
                    <Button size="sm" onClick={saveDraft} disabled={saving} data-testid="save-draft-button" className="bg-indigo-600 hover:bg-indigo-700">
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setDraft(selected.testimonial_draft || ""); setEditing(false); }} data-testid="cancel-edit-button">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="edit-draft-button" className="border-slate-300">
                      <Pencil className="h-4 w-4 mr-1" /> Edit Draft
                    </Button>
                    <Button size="sm" onClick={openEmail} data-testid="send-customer-button" className="bg-indigo-600 hover:bg-indigo-700 transition-transform hover:-translate-y-[1px]">
                      <Send className="h-4 w-4 mr-1" /> Send to Customer
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      <EmailComposer open={emailOpen} onOpenChange={setEmailOpen} initial={emailData} />
    </div>
  );
}
