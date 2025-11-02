import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://yiogftbgycgilipzwnkv.supabase.co'
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2dmdGJneWNnaWxpcHp3bmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODIzMzQsImV4cCI6MjA3Njg1ODMzNH0.Kwp8MDSryaEnWaSIre1zUL3GirFhpyim1E2nBlobWCM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Debug: Check connection and table existence
const checkConnection = async () => {
  try {
    // Test the connection
    const { data, error } = await supabase
      .from('Profile')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test error:', error)
      console.log('Current project URL:', supabaseUrl)
      return false
    }
    
    console.log('Supabase connection successful')
    return true
  } catch (err) {
    console.error('Supabase connection test exception:', err)
    return false
  }
}

// Run the check immediately
checkConnection()