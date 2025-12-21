import { Octicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Input from '../components/Input'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/themes'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'



const Login = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (!emailRef.current || !passwordRef.current) {
            Alert.alert('Login', 'Please fill all the fields');
            return;
        }
        const email = emailRef.current.trim();
        const password = passwordRef.current.trim();

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            setLoading(false);

            console.log('Login Data:', data);
            console.log('Login Error:', error);

            if (error) {
                Alert.alert('Login', error.message);
                return;
            }

            if (data.session) {
                router.replace('/home');
            }
        } catch (error) {
            console.log('Login Exception:', error);
            Alert.alert('Login', 'An unexpected error occurred');
            setLoading(false);
        }
    }

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* Welcome Text */}
        <View>
            <Text style={styles.welcomeText}>Hey,</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                Please login to continue
            </Text>
            
            <Input 
                icon={<Octicons name="mail" size={26} color={theme.colors.text} />}
                placeholder='Enter your email'
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={value=> emailRef.current = value}
            />

            <View style={{gap: 10}}>
                <Input 
                    icon={<Octicons name="lock" size={26} color={theme.colors.text} />}
                    placeholder='Enter your password'
                    secureTextEntry
                    onChangeText={value=> passwordRef.current = value}
                />
                <Text style={styles.forgotPassword}>
                    Forgot Password?
                </Text>
            </View>

            {/* Button */}
            <Button title={'Login'} loading={loading} onPress={onSubmit} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Don't have an account?
            </Text>
            <Pressable onPress={()=> router.push('/signUp')}>
                <Text style={[styles.footerText, {color: theme.colors.primary, fontWeight: theme.fonts.semibold}]}>Sign up</Text>
            </Pressable>
        </View>

      </View>
    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5)
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    },
    form: {
        gap: 25,
    },
    forgotPassword: {
        textAlign: 'right',
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }
})