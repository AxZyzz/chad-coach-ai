import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/components/OnboardingFlow'

export const useSupabase = () => {
  const saveUserProfile = async (profile: UserProfile) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error saving user profile:', error)
      throw error
    }
  }

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  return {
    saveUserProfile,
    getUserProfile,
  }
}