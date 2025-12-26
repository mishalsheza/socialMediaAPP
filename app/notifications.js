import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import NotificationItem from '../components/NotificationItem';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';
import { fetchNotifications, markNotificationsAsRead } from '../service/notificationService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      getNotifications();
      markNotificationsAsRead(user.id);
      
      // Real-time subscription for notifications
      const notificationChannel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `receiverId=eq.${user.id}`,
          },
          async (payload) => {
            if (payload.new) {
                // Fetch sender details for the new notification
                const {data: senderData} = await supabase
                    .from('users')
                    .select('id, name, image')
                    .eq('id', payload.new.senderId)
                    .single();
                
                const newNotification = {
                    ...payload.new,
                    sender: senderData
                };
                
                setNotifications(prev => [newNotification, ...prev]);
                // Mark as read if user is currently on the screen
                markNotificationsAsRead(user.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
      };
    }
  }, [user]);

  const getNotifications = async () => {
    setLoading(true);
    const res = await fetchNotifications(user.id);
    if (res.success) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={({ item }) => (
              <NotificationItem item={item} router={router} />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listStyle}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.noData}>No notifications yet</Text>
              </View>
            }
            onRefresh={getNotifications}
            refreshing={loading}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: hp(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: wp(4),
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: hp(2.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  listStyle: {
    paddingVertical: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noData: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
});
