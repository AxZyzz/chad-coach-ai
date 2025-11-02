// @ts-check
import { createClient } from '@supabase/supabase-js'

const main = async () => {
  const supabase = createClient(
    'https://yiogftbgycgilipzwnkv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2dmdGJneWNnaWxpcHp3bmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODIzMzQsImV4cCI6MjA3Njg1ODMzNH0.Kwp8MDSryaEnWaSIre1zUL3GirFhpyim1E2nBlobWCM'
  )

  console.log('Checking database tables...')

  try {
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message)
    } else {
      console.log('✅ Profiles table exists')
    }

    // Check chat_history table
    const { data: chatHistory, error: chatError } = await supabase
      .from('chat_history')
      .select('count')
    
    if (chatError) {
      console.log('❌ Chat history table error:', chatError.message)
    } else {
      console.log('✅ Chat history table exists')
    }

    // Try to list all tables in public schema
    const { data, error } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
    
    if (error) {
      console.log('❌ Error listing tables:', error.message)
    } else {
      console.log('\nAll public tables:')
      console.log(data)
    }

  } catch (err) {
    console.error('❌ Error checking tables:', err)
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))