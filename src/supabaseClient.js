import { createClient } from "@supabase/supabase-js";

// 🔐 القيم تُقرأ من متغيرات البيئة (.env) - لا تضع مفاتيح هنا مباشرة
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);