"use client";

import Link from "next/link";
import { Check, SkipForward, Clock } from "lucide-react";
import { cn, getReminderStatus } from "@/lib/utils";
import type { Contact } from "@/lib/types/database";

export function ContactCard({
  contact,
  onContact,
  onSkip,
}: {
  contact: Contact;
  onContact: (id: string) => void;
  onSkip: (id: string) => void;
}) {
  const status = getReminderStatus(contact.next_reminder_at);
  const categoryColor = contact.categories?.color || "#8B7355";

  return (
    <div className="bg-surface rounded-xl p-4 border border-border hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/contacts/${contact.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {contact.name}
            </h3>
            {contact.categories && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                }}
              >
                {contact.categories.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" style={{ color: status.overdue ? "#ef4444" : "#8B7355" }} />
            <span
              className={cn(
                "text-xs",
                status.overdue ? "text-red-400 font-medium" : "text-gold-muted"
              )}
            >
              {status.label}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              onContact(contact.id);
            }}
            className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
            title="Mark as contacted"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onSkip(contact.id);
            }}
            disabled={contact.last_skipped}
            className={cn(
              "p-2 rounded-lg transition-colors",
              contact.last_skipped
                ? "bg-border/50 text-border cursor-not-allowed"
                : "bg-gold-muted/10 text-gold-muted hover:bg-gold-muted/20"
            )}
            title={
              contact.last_skipped
                ? "Can't skip twice in a row"
                : "Skip this reminder"
            }
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
