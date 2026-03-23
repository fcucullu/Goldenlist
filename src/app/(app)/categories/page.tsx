"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import type { Category } from "@/lib/types/database";

const COLORS = ["#D4AF37", "#F5C542", "#B8860B", "#8B7355", "#ef4444", "#3b82f6", "#22c55e", "#a855f7"];

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#D4AF37");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#D4AF37");

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("categories").insert({
      user_id: user!.id,
      name: newName.trim(),
      color: newColor,
      sort_order: categories.length,
    });
    setNewName("");
    setShowNew(false);
    fetchCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase
      .from("categories")
      .update({ name: editName.trim(), color: editColor })
      .eq("id", id);
    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this group? Contacts in this group will become ungrouped.")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Groups</h1>
        <button
          onClick={() => setShowNew(true)}
          className="p-2.5 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-surface rounded-xl p-4 border border-border flex items-center justify-between"
          >
            {editingId === cat.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-gold/50"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-transform"
                      style={{
                        backgroundColor: c,
                        borderColor: editColor === c ? "#fff" : "transparent",
                        transform: editColor === c ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleUpdate(cat.id)}
                  className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1.5 rounded-lg text-gold-muted hover:bg-surface-hover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color || "#D4AF37" }}
                  />
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                      setEditColor(cat.color || "#D4AF37");
                    }}
                    className="p-1.5 rounded-lg text-gold-muted hover:bg-surface-hover"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {showNew && (
        <div className="mt-4 bg-surface rounded-xl p-4 border border-gold/30 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-gold-muted/50 focus:outline-none focus:border-gold/50"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? "#fff" : "transparent",
                  transform: newColor === c ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-[#111] font-semibold py-2 rounded-lg text-sm"
            >
              Add Group
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 rounded-lg text-gold-muted hover:bg-surface-hover text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 && !showNew && (
        <p className="text-center text-gold-muted py-12">
          No groups yet. Groups are created automatically when you sign in.
        </p>
      )}
    </div>
  );
}
