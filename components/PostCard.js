import { Feather } from '@expo/vector-icons'
import { ResizeMode, Video } from 'expo-av'
import moment from 'moment'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import RenderHtml from 'react-native-render-html'
import { theme } from '../constants/themes'
import { hp } from '../helpers/common'
import Avatar from './Avatar'

const PostCard = ({
    item,
    currentUser,
    router,
    hasShadow = true,
}) => {
  const shadowStyles = {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 1
  }

  const createdAt = moment(item?.created_at).fromNow();

  const openPostDetails = () => {
      // router.push({pathname: 'postDetails', params: {postId: item?.id}})
  }

  return (
    <View style={[styles.container, hasShadow && shadowStyles]}>
      <View style={styles.header}>
        {/* User Info */}
        <View style={styles.userInfo}>
            <Avatar 
                size={hp(4.5)} 
                uri={item?.user?.image} 
                rounded={theme.radius.md} 
            />
            <View style={{ gap: 2 }}>
                <Text style={styles.username}>{item?.user?.name}</Text>
                <Text style={styles.postTime}>{createdAt}</Text>
            </View>
        </View>

        <TouchableOpacity onPress={openPostDetails}>
            <Feather name="more-horizontal" size={hp(3.4)} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Post Body & Media */}
      <View style={styles.content}>
          <View style={styles.postBody}>
              {item?.body && (
                  <RenderHtml 
                      contentWidth={wp(100)}
                      source={{ html: item?.body }}
                      tagsStyles={tagsStyles}
                  />
              )}
          </View>

          {/* Image / Video */}
          {item?.file && item?.file.includes('post-images') && (
              <View style={styles.postMedia}>
                   {/* Simple check for video extension or metadata if available. 
                       Since we don't have fileType in DB, we'll try to guess or just assume image for now 
                       unless we add extension checking logic. 
                       For now, let's assume image if it doesn't look like a video.
                   */}
                   {item?.file.match(/\.(mp4|mov)$/i) ? (
                        <Video
                            style={styles.media}
                            source={{ uri: item?.file }}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            isLooping
                        />
                   ) : (
                       <Image 
                            source={{ uri: item?.file }} 
                            style={styles.media}
                            resizeMode="cover"
                       />
                   )}
              </View>
          )}
      </View>

      {/* Footer (Likes/Comments) */}
      <View style={styles.footer}>
          <View style={styles.footerButton}>
                <TouchableOpacity>
                    <Feather name="heart" size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.count}>{0}</Text>
          </View>
          <View style={styles.footerButton}>
                <TouchableOpacity>
                    <Feather name="message-circle" size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.count}>{0}</Text>
          </View>
          <View style={styles.footerButton}>
                <TouchableOpacity>
                    <Feather name="share-2" size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
          </View>
      </View>
    </View>
  )
}

export default PostCard

const styles = StyleSheet.create({
    container: {
        gap: 10,
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        borderCurve: 'continuous',
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
        flex: 1
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
