import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/themes'
import { useAuth } from '../contexts/authContext'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'

const Home = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);

    const handlePostEvent = async (payload) => {
        if(payload.eventType === 'INSERT' && payload?.new?.id){
            let newPost = { ...payload.new };
            let res = await supabase.from('users').select('id, name, image').eq('id', newPost.userId).single();
            newPost.user = res.data ? res.data : {};
            newPost.postLikes = [];
            newPost.comments = [{count: 0}];
            setPosts(prevPosts => [newPost, ...prevPosts]);
        }
    }

    const onDeletePost = (id) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
    };

    const getPosts = async () => {
        // limit = 10 for now
        if(!hasMore) return null;

        const limit = 10;
        
        let { data, error } = await supabase
            .from('posts')
            .select('*, user:users(id, name, image), postLikes(*), comments(count)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if(error){
            console.log('fetchPosts error: ', error);
            // Alert.alert('Error', 'Could not fetch posts');
            return;
        }

        if(data){
             setPosts(data);
        }
    };

    useEffect(() => {
        getPosts();
        
        // Subscribe to real-time posts
        const postChannel = supabase
        .channel('posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
        .subscribe();

        // Subscribe to real-time comments to update local counts
        const commentChannel = supabase
        .channel('comments-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
             setPosts(prevPosts => {
                 return prevPosts.map(post => {
                     if(post.id === payload.new.postId){
                         let updatedPost = {...post};
                         let oldCount = (post.comments && post.comments[0]) ? post.comments[0].count : 0;
                         updatedPost.comments = [{count: oldCount + 1}];
                         return updatedPost;
                     }
                     return post;
                 })
             })
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) => {
            // Note: DELETE payload only contains old record ID usually, unless replica identity is set to FULL
            // For now we might skip decrementing on home feed if we don't have the postId in the old payload
        })
        .subscribe();

        // Subscribe to real-time likes
        const likeChannel = supabase
        .channel('likes-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'postLikes' }, (payload) => {
            setPosts(prevPosts => {
                return prevPosts.map(post => {
                    if(post.id === payload.new.postId){
                        let updatedPost = {...post};
                        let updatedLikes = [...post.postLikes, payload.new];
                        updatedPost.postLikes = updatedLikes;
                        return updatedPost;
                    }
                    return post;
                })
            })
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'postLikes' }, (payload) => {
            // Note: similar to comments, we need postId to update. 
            // If postId is not in payload, we might need a different strategy or FULL replica identity.
        })
        .subscribe();

        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(commentChannel);
            supabase.removeChannel(likeChannel);
        }
    }, []);

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
                                uri={user?.user_metadata?.image}
                                size={hp(4.3)}
                                rounded={true}
                                style={{ borderWidth: 2 }}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Posts Feed */}
                <FlatList 
                    data={posts}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listStyle}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({item}) => (
                        <PostCard 
                            item={item} 
                            currentUser={user} 
                            router={router} 
                            onDelete={onDeletePost} 
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.noPosts}>
                             <Text style={styles.noPostsText}>No posts yet</Text>
                        </View>
                    )}
                />
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
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4)
    },
    noPosts: {
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingTop: 20
    },
    noPostsText: {
        fontSize: hp(2), 
        color: theme.colors.text, 
        fontWeight: theme.fonts.medium
    }
})
