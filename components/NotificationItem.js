import moment from 'moment';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/themes';
import { hp } from '../helpers/common';
import Avatar from './Avatar';

const NotificationItem = ({ item, router }) => {
  const handleClick = () => {
    try {
      if (item?.data) {
        const data = JSON.parse(item.data);
        router.push({ pathname: 'postDetails', params: { postId: data.postId } });
      } else {
        console.log('No data found in notification');
      }
    } catch (e) {
      console.log('Error parsing notification data:', e);
    }
  };

  const createdAt = moment(item?.created_at).format('MMM D');

  return (
    <TouchableOpacity
      style={[styles.container, !item?.isRead && styles.unread]}
      onPress={handleClick}
    >
      <Avatar
        uri={item?.sender?.image}
        size={hp(6)}
        rounded={theme.radius.md}
      />
      <View style={styles.content}>
        <View style={styles.header}>
            <Text style={styles.name}>{item?.sender?.name}</Text>
            <Text style={styles.time}>{createdAt}</Text>
        </View>
        <Text style={styles.title}>{item?.title}</Text>
      </View>
      {!item?.isRead && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
};

export default NotificationItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    padding: 15,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  unread: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    borderColor: theme.colors.primary,
  },
  unreadDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.rose,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  time: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  title: {
    fontSize: hp(1.6),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
});