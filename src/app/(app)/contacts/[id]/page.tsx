"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InteractionForm } from "@/components/interaction-form";
import { getReminderStatus, formatRelativeDate, FREQUENCY_OPTIONS, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  SkipForward,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Clock,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { Contact, Interaction } from "@/lib/types/database";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [contactRes, interactionsRes] = await Promise.all([
      supabase
        .from("contacts")
        .select("*, categories(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (contactRes.data) setContact(contactRes.data);
    if (interactionsRes.data) setInteractions(interactionsRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleContact = async (notes: string) => {
    await supabase.rpc("record_contact", {
      p_contact_id: id,
      p_notes: notes || null,
    });
    setShowContactForm(false);
    fetchData();
  };

  const handleSkip = async () => {
    await supabase.rpc("skip_contact", { p_contact_id: id });
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    router.push("/contacts");
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface rounded w-1/3" />
        <div className="h-32 bg-surface rounded-xl" />
      </div>
    );
  }

  if (!contact) {
    return <p className="text-gold-muted">Contact not found</p>;
  }

  const status = getReminderStatus(contact.next_reminder_at);
  const freqLabel =
    FREQUENCY_OPTIONS.find((o) => o.value === contact.reminder_frequency_days)
      ?.label || `Every ${contact.reminder_frequency_days} days`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/contacts"
            className="p-2 rounded-lg hover:bg-surface text-gold-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">{contact.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/contacts/${id}/edit`}
            className="p-2 rounded-lg hover:bg-surface text-gold-muted"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-surface rounded-xl p-4 border border-border mb-4 space-y-3">
        {contact.categories && (
          <span
            className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${contact.categories.color || "#8B7355"}20`,
              color: contact.categories.color || "#8B7355",
            }}
          >
            {contact.categories.name}
          </span>
        )}

        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-sm text-gold-muted hover:text-gold"
          >
            <Phone className="w-4 h-4" />
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm text-gold-muted hover:text-gold"
          >
            <Mail className="w-4 h-4" />
            {contact.email}
          </a>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gold-muted" />
          <span className="text-gold-muted">{freqLabel}</span>
          <span className="text-gold-muted">·</span>
          <span className={status.overdue ? "text-red-400" : "text-gold-muted"}>
            {status.label}
          </span>
        </div>

        {contact.notes && (
          <p className="text-sm text-gold-muted/80 border-t border-border pt-3">
            {contact.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowContactForm(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-[#111] font-semibold py-2.5 rounded-xl hover:from-gold-light hover:to-gold transition-all"
        >
          <Check className="w-4 h-4" />
          Contacted
        </button>
        <button
          onClick={handleSkip}
          disabled={contact.last_skipped}
          className={cn(
            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors",
            contact.last_skipped
              ? "bg-border/50 text-border cursor-not-allowed"
              : "bg-gold-muted/10 text-gold-muted hover:bg-gold-muted/20"
          )}
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      </div>

      {/* Interaction History */}
      <div>
        <h2 className="text-sm font-semibold text-gold-muted mb-3">History</h2>
        {interactions.length === 0 ? (
          <p className="text-sm text-gold-muted/50 text-center py-6">
            No interactions yet
          </p>
        ) : (
          <div className="space-y-2">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="bg-surface rounded-xl p-3 border border-border"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {interaction.type === "contact" ? (
                      <MessageSquare className="w-3.5 h-3.5 text-gold" />
                    ) : (
                      <SkipForward className="w-3.5 h-3.5 text-gold-muted" />
                    )}
                    <span className="text-xs font-medium text-foreground capitalize">
                      {interaction.type === "contact"
                        ? "Contacted"
                        : "Skipped"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gold-muted">
                    {formatRelativeDate(interaction.created_at)}
                  </span>
                </div>
                {interaction.notes && (
                  <p className="text-xs text-gold-muted/80 ml-5.5">
                    {interaction.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showContactForm && (
        <InteractionForm
          contactName={contact.name}
          onSubmit={handleContact}
          onClose={() => setShowContactForm(false)}
        />
      )}
    </div>
  );
}
