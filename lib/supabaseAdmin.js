import { createClient } from "@supabase/supabase-js";

const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
    throw new Error(
        "NiceThings server Supabase environment variables are missing."
    );
}

const supabaseAdmin =
    createClient(
        url,
        secret,
        {
            auth: {
                autoRefreshToken:
                    false,
                persistSession:
                    false,
            },
        }
    );

export default supabaseAdmin;