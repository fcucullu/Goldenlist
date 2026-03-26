-- Rename all unprefixed tables to use app-name prefix
-- GoldenList tables
ALTER TABLE IF EXISTS public.categories RENAME TO goldenlist_categories;
ALTER TABLE IF EXISTS public.contacts RENAME TO goldenlist_contacts;
ALTER TABLE IF EXISTS public.interactions RENAME TO goldenlist_interactions;
ALTER TABLE IF EXISTS public.push_subscriptions RENAME TO goldenlist_push_subscriptions;

-- PatternFinder tables
ALTER TABLE IF EXISTS public.events RENAME TO patternfinder_events;
ALTER TABLE IF EXISTS public.occurrences RENAME TO patternfinder_occurrences;
ALTER TABLE IF EXISTS public.shared_events RENAME TO patternfinder_shared_events;

-- Shared table
ALTER TABLE IF EXISTS public.profiles RENAME TO global_profiles;
