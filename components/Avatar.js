import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'
import { theme } from '../constants/themes'
import { getUserImageSrc } from '../service/imageService'

const Avatar = ({
    uri,
    size = 40,
    rounded = theme.radius.sm,
    style={}
}) => {
  const borderRadius = typeof rounded === 'boolean' ? (rounded ? size/2 : 0) : rounded;
  
  return (
   <Image 
     source={getUserImageSrc(uri)} 
     transition={100}
     style={[styles.avatar, {width: size, height: size, borderRadius: borderRadius}, style]}
   />
  )
}

export default Avatar

const styles = StyleSheet.create({
    avatar: {
        borderCurve: 'continuous',
        borderColor: theme.colors.darkLight,
        borderWidth: 1
    }
})