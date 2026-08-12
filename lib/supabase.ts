import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijzqqbybubruthargcnq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqenFxYnlidWJydXRoYXJnY25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Nzg1ODYsImV4cCI6MjA5NzU1NDU4Nn0.bCcb-d_hcXFRrWOhu7-3RrmQUWaeIQSntllowRUyBm4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan las variables de entorno de Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);