"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ContactForm } from "@/components/contact-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Contact } from "@/lib/types/database";

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    supabase
      .from("contacts")
      .select("*, categories(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setContact(data);
      });
  }, [id]);

  if (!contact) {
    return <div className="animate-pulse h-64 bg-surface rounded-xl" />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/contacts/${id}`}
          className="p-2 rounded-lg hover:bg-surface text-gold-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Edit Contact</h1>
      </div>
      <ContactForm contact={contact} />
    </div>
  );
}
