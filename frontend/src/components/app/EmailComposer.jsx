import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";

export default function EmailComposer({ open, onOpenChange, initial }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initial) {
      setTo(initial.to || "");
      setSubject(initial.subject || "");
      setBody(initial.body || "");
    }
  }, [initial]);

  const send = () => {
    if (!to.trim()) {
      toast.error("Please add a recipient email");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onOpenChange(false);
      toast.success(`Email queued to ${to} (demo — not actually sent)`);
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="email-composer">
        <DialogHeader>
          <DialogTitle className="font-heading">Send to Customer</DialogTitle>
          <DialogDescription>Review and edit the pre-drafted email before sending.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="client@company.com"
              data-testid="email-to-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="email-subject-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-body">Message</Label>
            <Textarea id="email-body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} data-testid="email-body-input" className="text-sm leading-relaxed" />
          </div>
          {initial?.attachment_name && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 w-fit" data-testid="email-attachment">
              <Paperclip className="h-4 w-4 text-slate-400" />
              {initial.attachment_name}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="email-cancel-button">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button onClick={send} disabled={sending} data-testid="email-send-button" className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="h-4 w-4 mr-1" /> {sending ? "Sending…" : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
