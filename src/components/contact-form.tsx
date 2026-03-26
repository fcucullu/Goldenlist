"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FREQUENCY_OPTIONS } from "@/lib/utils";
import type { Category, Contact } from "@/lib/types/database";

export function ContactForm({ contact }: { contact?: Contact }) {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: contact?.name || "",
    phone: contact?.phone || "",
    email: contact?.email || "",
    notes: contact?.notes || "",
    category_id: contact?.category_id || "",
    reminder_frequency_days: contact?.reminder_frequency_days || 14,
  });

  useEffect(() => {
    supabase
      .from("goldenlist_categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      category_id: form.category_id || null,
    };

    if (contact) {
      await supabase.from("goldenlist_contacts").update(payload).eq("id", contact.id);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("goldenlist_contacts")
        .insert({ ...payload, user_id: user!.id });
    }

    router.push("/contacts");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-gold-muted mb-1.5">Name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-xs text-gold-muted mb-1.5">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50"
          placeholder="+1 234 567 8900"
        />
      </div>

      <div>
        <label className="block text-xs text-gold-muted mb-1.5">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-xs text-gold-muted mb-1.5">Group</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold/50"
        >
          <option value="">No group</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gold-muted mb-1.5">
          Reminder Frequency
        </label>
        <select
          value={form.reminder_frequency_days}
          onChange={(e) =>
            setForm({
              ...form,
              reminder_frequency_days: Number(e.target.value),
            })
          }
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold/50"
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value={form.reminder_frequency_days}>
            Custom ({form.reminder_frequency_days} days)
          </option>
        </select>
        {!FREQUENCY_OPTIONS.some(
          (o) => o.value === form.reminder_frequency_days
        ) && (
          <input
            type="number"
            min={1}
            value={form.reminder_frequency_days}
            onChange={(e) =>
              setForm({
                ...form,
                reminder_frequency_days: Number(e.target.value),
              })
            }
            className="w-full mt-2 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold/50"
            placeholder="Days"
          />
        )}
      </div>

      <div>
        <label className="block text-xs text-gold-muted mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50 resize-none h-20"
          placeholder="Any notes about this contact..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-gold to-gold-dark text-[#111] font-semibold py-3 rounded-xl hover:from-gold-light hover:to-gold transition-all disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : contact
            ? "Update Contact"
            : "Add Contact"}
      </button>
    </form>
  );
}
