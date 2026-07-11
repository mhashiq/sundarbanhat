import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jatbzwuphyeyjundughh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdGJ6d3VwaHlleWp1bmR1Z2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODU4OTgsImV4cCI6MjA5OTM2MTg5OH0.sINOGPAcFTSXMcTZ30EYiDRliicroNOx41YPpsNnvuM';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.log(
    'Supabase environment variables are missing! Using default public fallback client credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
