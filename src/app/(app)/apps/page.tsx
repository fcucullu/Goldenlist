"use client";

import {
  ExternalLink,
  Sparkles,
  ListChecks,
  MessageSquare,
  Wallet,
  Dumbbell,
  Globe,
} from "lucide-react";

const apps = [
  {
    name: "Golden List",
    tagline: "Never lose touch with who matters",
    description:
      "Smart contact reminder system. Set frequencies, track interactions, and keep your relationships alive.",
    icon: ListChecks,
    color: "#D4AF37",
    url: "/dashboard",
    status: "live" as const,
  },
  {
    name: "CashFlow",
    tagline: "Track every dollar effortlessly",
    description:
      "Minimal expense tracker with smart categorization and monthly insights. No clutter, just clarity.",
    icon: Wallet,
    color: "#4ADE80",
    url: null,
    status: "building" as const,
  },
  {
    name: "FitLog",
    tagline: "Your gym, your data, your gains",
    description:
      "Workout logger built for lifters. Track sets, reps, and PRs with zero friction.",
    icon: Dumbbell,
    color: "#F97316",
    url: null,
    status: "soon" as const,
  },
  {
    name: "Lingua",
    tagline: "Learn languages by doing",
    description:
      "Conversational language practice powered by AI. Real scenarios, real progress.",
    icon: MessageSquare,
    color: "#818CF8",
    url: null,
    status: "soon" as const,
  },
];

const statusConfig = {
  live: { label: "Live", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  building: { label: "Building", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  soon: { label: "Coming Soon", bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" },
};

export default function AppsPage() {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          Indie Dev
        </div>
        <h1 className="text-3xl font-bold gold-shimmer mb-3 mx-auto w-fit">Apps I Build</h1>
        <p className="text-sm text-gold-muted leading-relaxed max-w-xs mx-auto">
          Side projects shipped from scratch. Designed, coded, and maintained solo.
        </p>
      </div>

      {/* App Cards */}
      <div className="space-y-4">
        {apps.map((app) => {
          const status = statusConfig[app.status];
          const Icon = app.icon;

          return (
            <div
              key={app.name}
              className="bg-surface rounded-2xl border border-border hover:border-gold/20 transition-all duration-300 overflow-hidden"
            >
              <div className="p-5">
                {/* Top row: icon + name + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${app.color}15` }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: app.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base leading-tight">
                        {app.name}
                      </h3>
                      <p
                        className="text-xs mt-0.5 font-medium"
                        style={{ color: app.color }}
                      >
                        {app.tagline}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text} shrink-0`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gold-muted leading-relaxed">
                  {app.description}
                </p>

                {/* CTA */}
                {app.url && (
                  <a
                    href={app.url}
                    className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-gold hover:text-gold-light transition-colors"
                  >
                    Open App
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center mt-8 mb-4">
        <p className="text-[11px] text-gold-muted/60">
          More apps shipping soon. Stay tuned.
        </p>
      </div>
    </div>
  );
}
