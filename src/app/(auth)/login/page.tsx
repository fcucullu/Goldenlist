"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#F5C542] bg-clip-text text-transparent">
            Golden List
          </h1>
          <p className="text-[#8B7355] mt-2 text-sm">
            Stay in touch with the people who matter
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#111] font-semibold py-3 px-6 rounded-xl hover:from-[#F5C542] hover:to-[#D4AF37] transition-all duration-200 shadow-lg shadow-[#D4AF37]/20"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-xs text-[#8B7355]">or</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        {sent ? (
          <div className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-xl p-4">
            <Mail className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <p className="text-sm text-[#ededed]">Check your email!</p>
            <p className="text-xs text-[#8B7355] mt-1">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#ededed] placeholder:text-[#8B7355]/50 focus:outline-none focus:border-[#D4AF37]/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] font-medium py-3 px-6 rounded-xl hover:border-[#D4AF37]/50 transition-all disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {loading ? "Sending..." : "Sign in with magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
