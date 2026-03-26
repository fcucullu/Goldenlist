import { NextResponse } from "next/server";
import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

function initVapid() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:hello@goldenlist.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
}

export async function POST(request: Request) {
  initVapid();
  // Verify the request is from our Edge Function or cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all users with overdue contacts who have push subscriptions
  const { data: overdueContacts } = await supabase
    .from("goldenlist_contacts")
    .select("user_id, name")
    .lte("next_reminder_at", new Date().toISOString());

  if (!overdueContacts?.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by user
  const byUser: Record<string, string[]> = {};
  for (const c of overdueContacts) {
    if (!byUser[c.user_id]) byUser[c.user_id] = [];
    byUser[c.user_id].push(c.name);
  }

  let sent = 0;

  for (const [userId, names] of Object.entries(byUser)) {
    const { data: subscriptions } = await supabase
      .from("goldenlist_push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions?.length) continue;

    const body =
      names.length === 1
        ? `Time to reach out to ${names[0]}!`
        : `You have ${names.length} people to reach out to: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}`;

    const payload = JSON.stringify({
      title: "Golden List",
      body,
      url: "/dashboard",
    });

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        );
        sent++;
      } catch (err: unknown) {
        // Remove invalid subscriptions
        if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          await supabase
            .from("goldenlist_push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      }
    }
  }

  return NextResponse.json({ sent });
}
