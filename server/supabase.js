const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://sfgjehytihrratxthdkk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_n83hih6b4wS-ui22rnryNA_mpg0TYTs';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
