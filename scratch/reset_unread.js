const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetUnreadMessages() {
  console.log('Resetting all messages to unread...');
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: false })
    .neq('id', 0); // Hack to update all rows

  if (error) {
    console.error('Error resetting messages:', error);
  } else {
    console.log('Successfully reset all messages to unread.');
  }
}

resetUnreadMessages();
