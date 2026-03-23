export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
};

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  category_id: string | null;
  reminder_frequency_days: number;
  last_contacted_at: string | null;
  next_reminder_at: string | null;
  last_skipped: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
};

export type Interaction = {
  id: string;
  contact_id: string;
  user_id: string;
  type: "contact" | "skip";
  notes: string | null;
  created_at: string;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  created_at: string;
};
