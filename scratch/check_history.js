import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function checkHistory() {
    const { data, error, count } = await supabase
        .from('challenge_history')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Count:", count);
    }
}

checkHistory();
