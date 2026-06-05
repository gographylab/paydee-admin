import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (): SupabaseClient<Database> =>
    createBrowserClient<Database>(
        supabaseUrl!,
        supabaseKey!,
    );
