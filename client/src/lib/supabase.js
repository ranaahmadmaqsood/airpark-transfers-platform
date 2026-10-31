import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sfgjehytihrratxthdkk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n83hih6b4wS-ui22rnryNA_mpg0TYTs';

export const supabase = createClient(supabaseUrl, supabaseKey);
