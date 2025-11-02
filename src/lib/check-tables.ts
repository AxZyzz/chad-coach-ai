import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yiogftbgycgilipzwnkv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2dmdGJneWNnaWxpcHp3bmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODIzMzQsImV4cCI6MjA3Njg1ODMzNH0.Kwp8MDSryaEnWaSIre1zUL3GirFhpyim1E2nBlobWCM'
)

const checkTables = async () => {
  try {
    // Query to list all tables in the public schema
    const { data, error } = await supabase
      .rpc('list_tables')
      .select('*')

    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Tables:', data)
    }

    // Try to directly query profiles table
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    console.log('Profiles check:', { data: profilesCheck, error: profilesError })

    // Try to query chat_history table
    const { data: chatCheck, error: chatError } = await supabase
      .from('chat_history')
      .select('*')
      .limit(1)

    console.log('Chat history check:', { data: chatCheck, error: chatError })

  } catch (err) {
    console.error('Exception:', err)
  }
}

checkTables()