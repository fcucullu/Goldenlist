import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { count: users } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { data: latest } = await supabase
    .from("interactions")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return Response.json(
    { users: users ?? 0, lastActivity: latest?.created_at ?? null },
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
