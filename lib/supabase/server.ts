// File: lib/supabase/server.ts (Fixed async cookies handling for Next.js 13+ App Router)

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase Client for Server Components and Route Handlers.
 * Properly handles cookies in async context.
 * In Next.js 13+ App Router, cookies() is synchronous but must be called
 * within the server component's execution context.
 */
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerComponentClient({
    cookies: () => cookieStore,
  });
};
