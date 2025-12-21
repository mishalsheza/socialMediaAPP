import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Avatar from '../components/Avatar'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/themes'
import { useAuth } from '../contexts/authContext'
import { hp, wp } from '../helpers/common'

const Home = () => {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Circl</Text>
                    <View style={styles.icons}>
                        <Pressable onPress={() => router.push('/notifications')}>
                            <Feather name="heart" size={hp(3.2)} color={theme.colors.text} />
                        </Pressable>
                        <Pressable onPress={() => router.push('/newPost')}>
                            <Feather name="plus-square" size={hp(3.2)} color={theme.colors.text} />
                        </Pressable>
                        <Pressable onPress={() => router.push('/profile')}>
                            <Avatar
                                uri={user?.image}
                                size={hp(4.3)}
                                rounded={true}
                                style={{ borderWidth: 2 }}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginHorizontal: wp(4)
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold
    },
    icons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18
    }
})
