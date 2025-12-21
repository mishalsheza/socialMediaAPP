import { useRouter } from 'expo-router';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { hp, wp } from '../helpers/common';

export default function Welcome() {
    const router = useRouter();

    return (   <ScreenWrapper>
            <StatusBar style="dark" />
            <View style={styles.container}>
                {/* Welcome Image */}
                <Image 
                    style={styles.welcomeImage}
                    resizeMode='contain'
                    source={require('../assets/images/welcomeImg.avif')}
                />

                {/* Content */}
                <View style={{gap: 20}}>
                    <Text style={styles.title}>Let's Get Started!</Text>
                    <Text style={styles.punchline}>
                        Connect with the world and share your stories with microSocial.
                    </Text>
                </View>

                {/* Footer / Button */}
                <View style={styles.footer}>
                    <Button 
                        title="Getting Started"
                        buttonStyle={{marginHorizontal: wp(3)}}
                        onPress={() => router.push('/signUp')} 
                    />
                    <View style={styles.bottomTextContainer}>
                        <Text style={styles.loginText}>
                            Already have an account?
                        </Text>
                        {/* We will route to Login Page later */}
                        <Text style={[styles.loginText, {color: theme.colors.primary, fontWeight: theme.fonts.semibold}]} onPress={() => router.push('/login')}>
                            Login
                        </Text>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.background,
        paddingHorizontal: wp(4)
    },
    welcomeImage: {
        height: hp(30),
        width: wp(100),
        alignSelf: 'center',
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(4),
        textAlign: 'center',
        fontWeight: theme.fonts.extraBold,
    },
    punchline: {
        textAlign: 'center',
        paddingHorizontal: wp(10),
        fontSize: hp(1.7),
        color: theme.colors.text,
    },
    footer: {
        gap: 30,
        width: '100%',
    },
    bottomTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },
    loginText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }
});
