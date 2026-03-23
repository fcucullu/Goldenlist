import { ContactForm } from "@/components/contact-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewContactPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/contacts"
          className="p-2 rounded-lg hover:bg-surface text-gold-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Add Contact</h1>
      </div>
      <ContactForm />
    </div>
  );
}
