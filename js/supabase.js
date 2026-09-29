const SUPABASE_URL = "https://amdoknqsjyhoiwhqppzc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hbK8wtno8t_wwlV9BAv42Q_b2MBmhYf";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);