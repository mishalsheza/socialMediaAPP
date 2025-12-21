import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import Button from '../components/Button'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/themes'
import { supabase } from '../lib/supabase'

const Home = () => {
  const router = useRouter();

  const handleLogout = async ()=>{
      const {error} = await supabase.auth.signOut();
      // Router will be handled by the _layout listener
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Home Screen</Text>
        <Button title='Logout' onPress={handleLogout} />
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20
    },
    title: {
        fontSize: 24,
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    }
})
