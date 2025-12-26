import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import PostCard from '../components/PostCard';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:users(name, image), postLikes(*), comments(count)')
        .eq('userId', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('❌ Profile posts fetch error:', error);
      Alert.alert('Error', 'Failed to load your posts');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
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

  const onDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const ProfileHeader = () => (
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
      <View style={{ gap: 10, marginTop: 20, marginBottom: 30 }}>
        <InfoRow icon="info" value={user?.user_metadata?.bio || 'No bio added yet'} />
        <InfoRow icon="phone" value={user?.user_metadata?.phone_number || 'No phone number'} />
        <InfoRow icon="map-pin" value={user?.user_metadata?.address || 'No address added'} />
        <InfoRow icon="mail" value={user?.email} />
      </View>

      <Text style={[styles.headerTitle, { marginBottom: 15 }]}>My Posts</Text>
    </View>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: wp(4) }}>
            <PostCard item={item} currentUser={user} router={router} onDelete={onDeletePost} />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<ProfileHeader />}
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={styles.infoText}>You haven't posted anything yet.</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshing={loading}
        onRefresh={fetchUserPosts}
      />
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
