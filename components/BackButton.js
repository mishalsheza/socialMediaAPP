import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'
import { theme } from '../constants/themes'

const BackButton = ({ size=26, router }) => {
  const navigation = useRouter();
  return (
    <Pressable onPress={()=> navigation.back()} style={styles.button}>
      <Ionicons name="caret-back-outline" size={size} color={theme.colors.text} />
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        alignSelf: 'flex-start',
        padding: 5,
        borderRadius: theme.radius.sm,
        backgroundColor: 'rgba(0,0,0,0.07)'
    }
})
