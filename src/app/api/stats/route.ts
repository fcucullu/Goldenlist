import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  // Count unique users who have contacts in GoldenList
  const { data } = await supabase
    .from("goldenlist_contacts")
    .select("user_id")
    .limit(1000);

  const uniqueUsers = new Set((data ?? []).map((d) => d.user_id));

  const { data: latest } = await supabase
    .from("goldenlist_interactions")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return Response.json(
    { users: uniqueUsers.size, lastActivity: latest?.created_at ?? null },
    {
      headers: {
        "Access-Control-Allow-Origin": "https://franciscocucullu.com",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://franciscocucullu.com",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
