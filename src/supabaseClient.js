import { createClient } from "@supabase/supabase-js";

// تم وضع القيم هنا مباشرةً للتجربة
const supabaseUrl = "https://timeeqkhoxhvxlgcxlcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbWVlcWtob3hodnhsZ2N4bGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzU0NjIsImV4cCI6MjA3MTU1MTQ2Mn0.mfythKLAtslNyESIXqqem9NfxIEY4kx9sKmC6bc44l0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);