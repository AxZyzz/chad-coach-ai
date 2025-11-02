// @ts-check
import { createClient } from '@supabase/supabase-js'

const main = async () => {
  const supabase = createClient(
    'https://yiogftbgycgilipzwnkv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2dmdGJneWNnaWxpcHp3bmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODIzMzQsImV4cCI6MjA3Njg1ODMzNH0.Kwp8MDSryaEnWaSIre1zUL3GirFhpyim1E2nBlobWCM'
  )

  console.log('Checking profiles table structure...')

  try {
    // Try to fetch one row from profiles to see structure
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message)
      console.log('Error details:', profileError)
    } else {
      console.log('✅ Profile table structure:')
      if (profile && profile.length > 0) {
        console.log('Columns:', Object.keys(profile[0]))
      } else {
        console.log('Table exists but no rows found')
      }
    }

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))