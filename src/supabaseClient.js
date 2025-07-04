import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://atlbexxqdtztslzpkyyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bGJleHhxZHR6dHNsenBreXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Mjg5MTgsImV4cCI6MjA2NzIwNDkxOH0._kNZrjQPSzIHU8GC7LEnGXJHaudgHMpKC87j-2lZDZ4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 