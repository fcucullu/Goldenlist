"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function InteractionForm({
  contactName,
  onSubmit,
  onClose,
}: {
  contactName: string;
  onSubmit: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Contacted {contactName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover text-gold-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you talk about? (optional)"
            className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50 resize-none h-24"
          />
          <button
            onClick={() => onSubmit(notes)}
            className="w-full mt-3 bg-gradient-to-r from-gold to-gold-dark text-[#111] font-semibold py-2.5 rounded-xl hover:from-gold-light hover:to-gold transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
