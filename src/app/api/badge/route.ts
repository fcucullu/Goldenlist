import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const { count } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_reminder_at", new Date().toISOString());

  return NextResponse.json({ count: count ?? 0 });
}
