import { Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import moment from 'moment';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

import { theme } from '../constants/themes';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';
import { createPostLike, removePostLike } from '../service/postService';
import Avatar from './Avatar';

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  onDelete = () => {},
}) => {
  const [postLikes, setPostLikes] = useState(item?.postLikes || []);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setPostLikes(item?.postLikes || []);
  }, [item?.postLikes]);

  const isMyPost = currentUser?.id === item?.userId;
  const createdAt = moment(item?.created_at).fromNow();

  // Improved video detection
  const isVideo = /\.(mp4|mov|m4v|webm|ogv)$/i.test(item?.file || '') || 
                  (item?.file || '').includes('/post-videos/');

  const player = useVideoPlayer(isVideo ? item?.file : null, (p) => {
    if (p) {
      p.loop = true;
      p.play();
    }
  });

  const liked = postLikes.some((l) => l.userId === currentUser?.id);
  const likesCount = postLikes.length;

  /* ------------------ ACTIONS ------------------ */

  const onLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    if (liked) {
      setPostLikes((prev) => prev.filter((l) => l.userId !== currentUser?.id));
      await removePostLike(item?.id, currentUser?.id);
    } else {
      const newLike = { userId: currentUser?.id, postId: item?.id };
      setPostLikes((prev) => [...prev, newLike]);
      await createPostLike(newLike);
    }

    setIsLiking(false);
  };

  const onShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    const message = item?.body
      ? item.body.replace(/<[^>]*>?/gm, '')
      : 'Check out this post';

    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: 'Post',
          text: message,
          url: window.location.href,
        });
      } else {
        await Share.share({ message });
      }
    } catch (e) {
      console.log(e);
    }

    setIsSharing(false);
  };

  const openMenu = () => {
    if (isMyPost) setShowMenu(true);
  };

  const onEdit = () => {
    setShowMenu(false);
    router.push({ pathname: 'editPost', params: { postId: item?.id } });
  };

  const performDelete = async () => {
    setIsDeleting(true);

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', item?.id)
      .eq('userId', currentUser?.id);

    if (error) {
      Alert.alert('Error', 'Failed to delete post');
      setIsDeleting(false);
      return;
    }

    if (item?.file) {
      const bucket = isVideo ? 'post-videos' : 'uploads';
      const fileName = item.file.split('/').pop();
      const path = `${item.userId}/${fileName}`;
      await supabase.storage.from(bucket).remove([path]);
    }

    setIsDeleting(false);
    onDelete(item?.id);
  };

  const onDeletePost = () => {
    setShowMenu(false);

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this post?')) performDelete();
    } else {
      Alert.alert('Delete Post', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <View style={[styles.container, hasShadow && styles.shadow]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar size={hp(4.5)} uri={item?.user?.image} rounded={theme.radius.md} />
          <View>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.time}>{createdAt}</Text>
          </View>
        </View>
        {isMyPost && (
          <TouchableOpacity onPress={openMenu} disabled={isDeleting}>
            <Feather name="more-horizontal" size={hp(3.4)} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
      {item?.body && (
        <View style={styles.bodyWrapper}>
          <RenderHtml
            contentWidth={wp(100)}
            source={{ html: item.body }}
            tagsStyles={tagsStyles}
          />
        </View>
      )}
      {item?.file && (
        <View style={styles.mediaWrapper}>
          {isVideo ? (
            <VideoView
              player={player}
              style={styles.media}
              allowsFullscreen
              allowsPictureInPicture
            />
          ) : (
            <Image source={{ uri: item.file }} style={styles.media} resizeMode="cover" />
          )}
        </View>
      )}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Feather
              name="heart"
              size={24}
              color={liked ? theme.colors.rose : theme.colors.textLight}
              fill={liked ? theme.colors.rose : 'transparent'}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likesCount}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: 'postDetails', params: { postId: item?.id } })
            }
          >
            <Feather name="message-circle" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{item?.comments?.[0]?.count || 0}</Text>
        </View>
        <TouchableOpacity onPress={onShare} disabled={isSharing}>
          <Feather name="share-2" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
              <Feather name="edit-2" size={20} />
              <Text style={styles.menuText}>Edit Post</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={onDeletePost}>
              <Feather name="trash-2" size={20} color={theme.colors.rose} />
              <Text style={[styles.menuText, { color: theme.colors.rose }]}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default PostCard;

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: theme.radius.xxl,
    padding: 12,
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    gap: 10,
  },
  shadow: {
    shadowColor: theme.colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: hp(1.7),
    fontWeight: '600',
  },
  time: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  bodyWrapper: {
    marginLeft: 5,
  },
  mediaWrapper: {
    height: hp(40),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: hp(1.8),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    width: wp(60),
  },
  menuItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    alignItems: 'center',
  },
  menuText: {
    fontSize: hp(1.9),
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray,
  },
});

const tagsStyles = {
  p: { fontSize: hp(1.8), color: theme.colors.textDark },
  div: { fontSize: hp(1.8), color: theme.colors.textDark },
};
