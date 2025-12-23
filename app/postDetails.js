import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BackButton from '../components/BackButton';
import CommentItem from '../components/CommentItem';
import PostCard from '../components/PostCard';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';
import { createComment, fetchPostDetails, removeComment } from '../service/postService';

const PostDetails = () => {
    const { postId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [startLoading, setStartLoading] = useState(true);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState("");
    const inputRef = useRef(null);

    const handleNewComment = async (payload) => {
        if (payload.new) {
            let newComment = { ...payload.new };
            let res = await supabase.from('users').select('id, name, image').eq('id', newComment.userId).single();
            newComment.user = res.data ? res.data : {};
            setPost(prevPost => {
                return {
                    ...prevPost,
                    comments: [newComment, ...prevPost.comments]
                }
            })
        }
    }

    useEffect(() => {
        getPostDetails();

        // Subscribe to real-time comments for THIS post
        const commentChannel = supabase
            .channel(`comments-${postId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'comments',
                filter: `postId=eq.${postId}` 
            }, handleNewComment)
            .subscribe();

        return () => {
            supabase.removeChannel(commentChannel);
        }
    }, [])

    const getPostDetails = async () => {
        let res = await fetchPostDetails(postId);
        if (res.success) setPost(res.data);
        setStartLoading(false);
    }

    const onNewComment = async () => {
        if (!comment) return;
        let data = {
            userId: user?.id,
            postId: postId,
            text: comment
        }
        setLoading(true);
        let res = await createComment(data);
        setLoading(false);
        if (res.success) {
            setComment("");
            inputRef.current?.clear();
        } else {
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeleteComment = async (comment) => {
        let res = await removeComment(comment.id);
        if (res.success) {
            setPost(prevPost => {
                let updatedPost = { ...prevPost };
                updatedPost.comments = updatedPost.comments.filter(c => c.id !== res.data.commentId);
                return updatedPost;
            })
        } else {
            Alert.alert('Comment', res.msg);
        }
    }

    if (startLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        )
    }

    if (!post) {
        return (
            <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                <Text style={styles.notFound}>Post not found!</Text>
            </View>
        )
    }

    return (
        <ScreenWrapper bg="white">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <BackButton router={router} />
                        <Text style={styles.headerTitle}>Post</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listStyle}>
                        <PostCard
                            item={{ ...post, comments: [{ count: post?.comments?.length }] }}
                            currentUser={user}
                            router={router}
                            hasShadow={false}
                        />

                        {/* Comment Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={inputRef}
                                value={comment}
                                onChangeText={value => setComment(value)}
                                placeholder="Type a comment..."
                                placeholderTextColor={theme.colors.textLight}
                                style={styles.input}
                            />
                            {
                                loading ? (
                                    <View style={styles.loading}>
                                        <ActivityIndicator size="small" color={theme.colors.primary} />
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
                                        <Feather name="send" size={hp(2.8)} color={theme.colors.primary} />
                                    </TouchableOpacity>
                                )
                            }
                        </View>

                        {/* Comment List */}
                        <View style={{ marginVertical: 15, gap: 17 }}>
                            {
                                post?.comments?.map(comment =>
                                    <CommentItem
                                        key={comment.id.toString()}
                                        item={comment}
                                        canDelete={user.id === comment.userId || user.id === post.userId}
                                        onDelete={onDeleteComment}
                                    />
                                )
                            }
                            {
                                post?.comments?.length === 0 && (
                                    <Text style={{ color: theme.colors.textLight, marginLeft: 5 }}>
                                        Be the first to comment!
                                    </Text>
                                )
                            }
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    )
}

export default PostDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: hp(0.7),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: wp(4),
        paddingBottom: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.gray,
    },
    headerTitle: {
        fontSize: hp(2.4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 10,
    },
    listStyle: {
        paddingHorizontal: wp(4),
        paddingBottom: 20,
    },
    input: {
        flex: 1,
        height: hp(6.2),
        borderRadius: theme.radius.md,
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        paddingHorizontal: 15,
        fontSize: hp(1.8),
        color: theme.colors.textDark,
        backgroundColor: 'white',
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.sm,
        height: hp(5.8),
        width: hp(5.8),
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium,
    },
    loading: {
        height: hp(5.8),
        width: hp(5.8),
        justifyContent: 'center',
        alignItems: 'center',
    },
});
