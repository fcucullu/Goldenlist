"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ContactCard } from "@/components/contact-card";
import { InteractionForm } from "@/components/interaction-form";
import type { Contact } from "@/lib/types/database";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase
      .from("contacts")
      .select("*, categories(*)")
      .order("next_reminder_at", { ascending: true, nullsFirst: true });
    if (data) setContacts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleContact = async (notes: string) => {
    if (!contactingId) return;
    await supabase.rpc("record_contact", {
      p_contact_id: contactingId,
      p_notes: notes || null,
    });
    setContactingId(null);
    fetchContacts();
  };

  const handleSkip = async (id: string) => {
    await supabase.rpc("skip_contact", { p_contact_id: id });
    fetchContacts();
  };

  const now = new Date();
  const overdue = contacts.filter(
    (c) => c.next_reminder_at && new Date(c.next_reminder_at) <= now
  );
  const upcoming = contacts.filter(
    (c) => !c.next_reminder_at || new Date(c.next_reminder_at) > now
  );

  const contactingContact = contacts.find((c) => c.id === contactingId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gold-shimmer">Golden List</h1>
          <p className="text-xs text-gold-muted mt-0.5">
            {overdue.length > 0
              ? `${overdue.length} contact${overdue.length === 1 ? "" : "s"} overdue`
              : "You're all caught up!"}
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="p-2.5 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface rounded-xl p-4 border border-border animate-pulse h-16"
            />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gold-muted mb-4">
            No contacts yet. Add someone to your golden list!
          </p>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-dark text-[#111] font-semibold py-2.5 px-5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
                Overdue
              </h2>
              <div className="space-y-2">
                {overdue.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onContact={setContactingId}
                    onSkip={handleSkip}
                  />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gold-muted uppercase tracking-wider mb-3">
                Upcoming
              </h2>
              <div className="space-y-2">
                {upcoming.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onContact={setContactingId}
                    onSkip={handleSkip}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {contactingId && contactingContact && (
        <InteractionForm
          contactName={contactingContact.name}
          onSubmit={handleContact}
          onClose={() => setContactingId(null)}
        />
      )}
    </div>
  );
}
