import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nqvkhcrzxdonmmtjzqup.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_TTolYCpD5R_nBnxx1Dt7yw_Mk42tl_4";

export const supabase = createClient(supabaseUrl, supabaseKey);
