-- Update functions to use renamed tables

-- lookup_profile_by_email
CREATE OR REPLACE FUNCTION public.lookup_profile_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM global_profiles WHERE email = lower(p_email) LIMIT 1;
$$;

-- PatternFinder functions
CREATE OR REPLACE FUNCTION public.is_event_owner(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patternfinder_events WHERE id = p_event_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patternfinder_events WHERE id = p_event_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM patternfinder_shared_events WHERE event_id = p_event_id AND shared_with_user_id = auth.uid()
  );
$$;

-- Listly function
CREATE OR REPLACE FUNCTION public.is_listly_member(p_list_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM listly_members WHERE list_id = p_list_id AND user_id = auth.uid()
  );
$$;

-- GoldenList functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.global_profiles (id, email, display_name, avatar_url)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      new.raw_user_meta_data->>'avatar_url'
    );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_contact(p_contact_id uuid, p_notes text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_freq int;
BEGIN
  SELECT reminder_frequency_days INTO v_freq FROM goldenlist_contacts WHERE id = p_contact_id AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO goldenlist_interactions (contact_id, user_id, type, notes)
    VALUES (p_contact_id, auth.uid(), 'contact', p_notes);
  UPDATE goldenlist_contacts SET next_reminder_at = now() + (v_freq || ' days')::interval WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.skip_contact(p_contact_id uuid)
RETURNS void AS $$
DECLARE
  v_freq int;
BEGIN
  SELECT reminder_frequency_days INTO v_freq FROM goldenlist_contacts WHERE id = p_contact_id AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  INSERT INTO goldenlist_interactions (contact_id, user_id, type)
    VALUES (p_contact_id, auth.uid(), 'skip');
  UPDATE goldenlist_contacts SET next_reminder_at = now() + (v_freq || ' days')::interval WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
