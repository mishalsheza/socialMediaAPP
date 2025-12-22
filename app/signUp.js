import { Ionicons, Octicons } from '@expo/vector-icons'
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

const SignUp = () => {
    const router = useRouter();
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const nameRef = useRef("");
    const [loading, setLoading] = useState(false);
  
    const onSubmit = async () => {
  if (!emailRef.current || !passwordRef.current) {
    Alert.alert('Please fill all the fields');
    return;
  }

  const name = nameRef.current.trim();
  const email = emailRef.current.trim();
  const password = passwordRef.current.trim();

  setLoading(true);

  try {
       const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'SuperStrong123!',
  options: { data: { full_name: 'Test User' } }
});
console.log({ data, error });

    setLoading(false);

    console.log('SignUp Data:', data);
    console.log('SignUp Error:', error);



    if (error) {
      Alert.alert(error.message);
      return;
    }

    if (data.user) {
      console.log('User signed up:', data.user);
      router.replace('/home');
    } else {
      console.log('No session yet. Email verification may be required.');
      Alert.alert('Check your email for verification link.');
    }
  } catch (err) {
    setLoading(false);
    console.error('Unexpected SignUp error:', err);
  }
};

    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <BackButton router={router} />
  
          {/* Welcome Text */}
          <View>
              <Text style={styles.welcomeText}>Let's</Text>
              <Text style={styles.welcomeText}>Get Started</Text>
          </View>
  
          {/* Form */}
          <View style={styles.form}>
              <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                Please fill the details to create an account
              </Text>
              
              <Input 
                  icon={<Ionicons name="person-outline" size={26} color={theme.colors.text} />}
                  placeholder='Enter your name'
                  onChangeText={value=> nameRef.current = value}
              />

              <Input 
                  icon={<Octicons name="mail" size={26} color={theme.colors.text} />}
                  placeholder='Enter your email'
                  onChangeText={value=> emailRef.current = value}
              />
  
              <Input 
                  icon={<Octicons name="lock" size={26} color={theme.colors.text} />}
                  placeholder='Enter your password'
                  secureTextEntry
                  onChangeText={value=> passwordRef.current = value}
              />
  
              {/* Button */}
              <Button title={'Sign Up'} loading={loading} onPress={onSubmit} />
          </View>
  
          {/* Footer */}
          <View style={styles.footer}>
              <Text style={styles.footerText}>
                  Already have an account?
              </Text>
              <Pressable onPress={()=> router.push('/login')}>
                  <Text style={[styles.footerText, {color: theme.colors.primary, fontWeight: theme.fonts.semibold}]}>Login</Text>
              </Pressable>
          </View>
  
        </View>
      </ScreenWrapper>
    )
  }

export default SignUp

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