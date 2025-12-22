import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import { supabasePublishableKey, supabaseUrl } from '../constants'

const SupabaseStorage = {
  getItem: (key) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve(null)
    }
    return AsyncStorage.getItem(key)
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve()
    }
    return AsyncStorage.setItem(key, value).catch(error => {
        console.log('Error saving session to storage', error);
        return Promise.resolve();
    });
  },
  removeItem: (key) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve()
    }
    return AsyncStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : SupabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})