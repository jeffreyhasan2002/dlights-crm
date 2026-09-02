import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mqubrlzjbtlumskdgcdp.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_e6fMOVwUJyhRWN0wC8dNjw__HwPtfzv";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabasePublishableKey,
  );
