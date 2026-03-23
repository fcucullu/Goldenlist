import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-5xl font-bold gold-shimmer mb-4">Golden List</h1>
        <p className="text-gold-muted mb-8 text-sm leading-relaxed">
          Never forget to stay in touch with the people who matter most.
          Set reminders, track interactions, and nurture your relationships.
        </p>

        <Link
          href="/login"
          className="inline-block w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#111] font-semibold py-3 px-8 rounded-xl hover:from-[#F5C542] hover:to-[#D4AF37] transition-all shadow-lg shadow-[#D4AF37]/20"
        >
          Get Started
        </Link>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gold">1</div>
            <p className="text-[10px] text-gold-muted mt-1">
              Add your contacts
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">2</div>
            <p className="text-[10px] text-gold-muted mt-1">
              Set reminder frequency
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">3</div>
            <p className="text-[10px] text-gold-muted mt-1">
              Stay in touch
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
