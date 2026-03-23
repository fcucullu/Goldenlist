"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, BellOff, LogOut, User } from "lucide-react";
import type { Profile } from "@/lib/types/database";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    });

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  const togglePush = async () => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setPushEnabled(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setPushLoading(false);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        setPushEnabled(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    }
    setPushLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

      {/* Profile */}
      <div className="bg-surface rounded-xl p-4 border border-border mb-4">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <User className="w-5 h-5 text-gold" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">
              {profile?.display_name || "User"}
            </p>
            <p className="text-xs text-gold-muted">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface rounded-xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pushEnabled ? (
              <Bell className="w-5 h-5 text-gold" />
            ) : (
              <BellOff className="w-5 h-5 text-gold-muted" />
            )}
            <div>
              <p className="font-medium text-foreground text-sm">
                Push Notifications
              </p>
              <p className="text-xs text-gold-muted">
                {pushSupported
                  ? pushEnabled
                    ? "Enabled"
                    : "Get reminders to reach out"
                  : "Not supported in this browser"}
              </p>
            </div>
          </div>
          {pushSupported && (
            <button
              onClick={togglePush}
              disabled={pushLoading}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                pushEnabled ? "bg-gold" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#111] transition-transform ${
                  pushEnabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-surface rounded-xl p-4 border border-border flex items-center gap-3 text-red-400 hover:border-red-400/30 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium text-sm">Sign Out</span>
      </button>
    </div>
  );
}
