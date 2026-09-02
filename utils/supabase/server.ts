import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mqubrlzjbtlumskdgcdp.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_e6fMOVwUJyhRWN0wC8dNjw__HwPtfzv";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Middleware handles session refresh.
          }
        },
      },
    }
  );
};
