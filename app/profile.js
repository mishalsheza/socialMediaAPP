import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const { user, setAuth } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    // setAuth(null); // Centralized in _layout.js
    console.log('🚪 Sign out requested');
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out', 'Error signing out!');
  };

  const handleLogout = () => {
    Alert.alert('Confirm', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: onLogout, style: 'destructive' },
    ]);
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton router={router} />
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Feather name="log-out" size={hp(3.2)} color={theme.colors.rose} />
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={user?.user_metadata?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
            <Pressable style={styles.editIcon} onPress={() => router.push('/editProfile')}>
              <Feather name="edit-3" size={20} color={theme.colors.dark} />
            </Pressable>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={styles.userName}>{user?.user_metadata?.full_name}</Text>
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={{ gap: 10, marginTop: 20 }}>
          <InfoRow icon="info" value={user?.user_metadata?.bio || 'No bio added yet'} />
          <InfoRow icon="phone" value={user?.user_metadata?.phone_number || 'No phone number'} />
          <InfoRow icon="map-pin" value={user?.user_metadata?.address || 'No address added'} />
          <InfoRow icon="mail" value={user?.email} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Profile;

const InfoRow = ({ icon, value }) => (
  <View style={styles.infoRow}>
    <Feather name={icon} size={20} color={theme.colors.textLight} />
    <Text style={styles.infoText}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(4) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: hp(2.6), fontWeight: theme.fonts.bold, color: theme.colors.text },
  logoutButton: { padding: 5, borderRadius: theme.radius.sm, backgroundColor: '#fee2e2' },
  avatarContainer: { justifyContent: 'center', alignItems: 'center', gap: 15, marginBottom: 10 },
  avatarWrapper: { position: 'relative', height: hp(12), width: hp(12), alignSelf: 'center' },
  editIcon: { position: 'absolute', bottom: 0, right: -12, padding: 7, borderRadius: 50, backgroundColor: 'white', shadowColor: theme.colors.textLight, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 7 },
  userName: { fontSize: hp(3), fontWeight: '500', color: theme.colors.text },
  infoText: { fontSize: hp(1.6), fontWeight: '500', color: theme.colors.textLight },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
});
