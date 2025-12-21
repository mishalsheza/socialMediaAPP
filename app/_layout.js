import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AuthContextProvider, useAuth } from '../contexts/authContext';
import { supabase } from '../lib/supabase';

const MainLayout = () => {
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.onAuthStateChange((_event, session) => {
            if(session){
                setAuth(session.user);
                setUserData(session.user);
                router.replace('/home');
            } else {
                setAuth(null);
                router.replace('/welcome');
            }
        })
    }, []);

    return (
        <Stack screenOptions={{headerShown: false}} />
    );
}

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <MainLayout />
    </AuthContextProvider>
  );
}