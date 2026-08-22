import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (
    !supabaseUrl ||
    !supabaseAnonKey
) {
    console.warn(
        "NiceThings Supabase public environment variables are not configured yet."
    );
}

const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(
            supabaseUrl,
            supabaseAnonKey
        )
        : null;

export default supabase;