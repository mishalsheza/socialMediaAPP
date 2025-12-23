import { Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { theme } from '../constants/themes';
import { hp, wp } from '../helpers/common';
import { createPostLike, removePostLike } from '../service/postService';
import Avatar from './Avatar';

const PostCard = ({
    item,
    currentUser,
    router,
    hasShadow = true,
}) => {
  const [postLikes, setPostLikes] = useState(item?.postLikes || []);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setPostLikes(item?.postLikes || []);
  }, [item?.postLikes]);

  const shadowStyles = {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 1
  }

  const createdAt = moment(item?.created_at).fromNow();
  
  const isVideo = item?.file && item?.file.match(/\.(mp4|mov)$/i);
  const player = useVideoPlayer(isVideo ? item?.file : null, (p) => {
    p.loop = true;
    p.play();
  });

  const openPostDetails = () => {
      router.push({pathname: 'postDetails', params: {postId: item?.id}})
  }

  const onLike = async () => {
    if (isLiking) return; // Prevent double-clicks
    setIsLiking(true);

    if (liked) {
      // Unlike - optimistic update
      const updatedLikes = postLikes.filter(like => like.userId !== currentUser?.id);
      setPostLikes(updatedLikes);
      
      const res = await removePostLike(item?.id, currentUser?.id);
      
      if (!res.success) {
        // Rollback on error
        setPostLikes(postLikes);
        console.error('Failed to unlike post');
      }
    } else {
      // Like - optimistic update
      const newLike = {
        userId: currentUser?.id,
        postId: item?.id
      };
      setPostLikes([...postLikes, newLike]);
      
      const res = await createPostLike(newLike);
      
      if (!res.success) {
        // Rollback on error
        setPostLikes(postLikes);
        console.error('Failed to like post');
      }
    }
    
    setIsLiking(false);
  }

  const liked = postLikes?.some(like => like.userId === currentUser?.id);
  const likesCount = postLikes?.length || 0;

  return (
    <View style={[styles.container, hasShadow && shadowStyles]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar size={hp(4.5)} uri={item?.user?.image} rounded={theme.radius.md} />
          <View style={{ gap: 2 }}>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openPostDetails}>
          <Feather name="more-horizontal" size={hp(3.4)} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.postBody}>
          {item?.body ? (
            <RenderHtml 
              contentWidth={wp(100)}
              source={{ html: item?.body }}
              tagsStyles={tagsStyles}
            />
          ) : null}
        </View>

        {item?.file ? (
          <View style={styles.postMedia}>
            {isVideo ? (
              Platform.OS !== 'web' ? (
                <VideoView
                  style={styles.media}
                  player={player}
                  allowsFullscreen
                  allowsPictureInPicture
                />
              ) : (
                <video
                  src={item.file}
                  controls
                  loop
                  style={{ width: '100%', height: '100%', borderRadius: theme.radius.xl }}
                />
              )
            ) : (
              <Image source={{ uri: item.file }} style={styles.media} resizeMode="cover" />
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike} disabled={isLiking}>
            <Feather 
              name="heart" 
              size={24} 
              fill={liked ? theme.colors.rose : 'transparent'}
              color={liked ? theme.colors.rose : theme.colors.textLight} 
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likesCount}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={openPostDetails}>
            <Feather name="message-circle" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{item?.comments?.[0]?.count || 0}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity>
            <Feather name="share-2" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PostCard

const styles = StyleSheet.create({
    container: {
        gap: 10,
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        padding: 10,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        shadowColor: theme.colors.dark
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    username: {
        fontSize: hp(1.7),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium
    },
    postTime: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium
    },
    content: {
        gap: 10,
    },
    postMedia: {
        height: hp(40),
        width: '100%',
        borderRadius: theme.radius.xl,
        overflow: 'hidden'
    },
    media: {
        width: '100%',
        height: '100%',   
    },
    postBody: {
        marginLeft: 5,
    },
    postBodyText: {
        fontSize: hp(1.8),
        color: theme.colors.text
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    footerButton: {
        marginLeft: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8)
    }
})

const tagsStyles = {
    p: {
        color: theme.colors.textDark,
        fontSize: hp(1.8)
    },
    div: {
         color: theme.colors.textDark,
         fontSize: hp(1.8)
    }
}