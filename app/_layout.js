// app/_layout.js
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AuthContextProvider, useAuth } from '../contexts/authContext';
import { supabase } from '../lib/supabase';

// Separate component that USES the context
function AppContent() {
  const { setAuth, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 Auth listener setup');

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('👤 Initial session found');
        setAuth(session.user);
      }
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔐 Auth changed:', _event);
      
      if (session) {
        setAuth(session.user);
        router.replace('/home');
      } else {
        setAuth(null);
        router.replace('/welcome');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Debug: log when user updates
  useEffect(() => {
    if (user) {
      console.log('👤 User state:', user.user_metadata);
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="editProfile" options={{ presentation: 'modal' }} />
      {/* Add your other screens here */}
    </Stack>
  );
}

// Root layout that PROVIDES the context
export default function RootLayout() {
  return (
    <AuthContextProvider>
      <AppContent />
    </AuthContextProvider>
  );
}