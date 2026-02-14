import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzwpmcmwdskfsvvzukqr.supabase.co';
const supabaseKey = 'sb_publishable_ly9PosSYaZBw_pMCkDlouQ_ho-z1dsU';

export const supabase = createClient(supabaseUrl, supabaseKey);
