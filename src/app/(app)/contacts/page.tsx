"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { getReminderStatus, cn } from "@/lib/utils";
import type { Contact, Category } from "@/lib/types/database";

export default function ContactsPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("goldenlist_contacts")
        .select("*, goldenlist_categories(*)")
        .order("name"),
      supabase.from("goldenlist_categories").select("*").order("sort_order"),
    ]).then(([contactsRes, categoriesRes]) => {
      if (contactsRes.data) setContacts(contactsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    });
  }, []);

  const filtered = contacts.filter((c) => {
    const matchesCategory = !selectedCategory || c.category_id === selectedCategory;
    const matchesSearch =
      !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Contacts</h1>
        <Link
          href="/contacts/new"
          className="p-2.5 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50"
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
            !selectedCategory
              ? "bg-gold text-[#111] font-semibold"
              : "bg-surface border border-border text-gold-muted"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
              selectedCategory === cat.id
                ? "font-semibold"
                : "bg-surface border border-border text-gold-muted"
            )}
            style={
              selectedCategory === cat.id
                ? { backgroundColor: cat.color || "#D4AF37", color: "#111" }
                : undefined
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface rounded-xl p-4 border border-border animate-pulse h-14"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gold-muted">
            {search || selectedCategory
              ? "No contacts match your filter"
              : "No contacts yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => {
            const status = getReminderStatus(contact.next_reminder_at);
            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="block bg-surface rounded-xl p-4 border border-border hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {contact.name}
                    </span>
                    {contact.categories && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${contact.categories.color || "#8B7355"}20`,
                          color: contact.categories.color || "#8B7355",
                        }}
                      >
                        {contact.categories.name}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      status.overdue ? "text-red-400" : "text-gold-muted"
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
