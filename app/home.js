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
        // Real-time updates could go here in future
        if(payload.eventType === 'INSERT' && payload?.new?.id){
            let newPost = { ...payload.new };
            let res = await supabase.from('users').select('id, name, image').eq('id', newPost.userId).single();
            newPost.user = res.data;
            setPosts(prevPosts => [newPost, ...prevPosts]);
        }
    }

    const getPosts = async () => {
        // limit = 10 for now
        if(!hasMore) return null;

        const limit = 10;
        
        let { data, error } = await supabase
            .from('posts')
            .select('*, user:users(id, name, image)')
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

        // return () => {
        //     supabase.removeChannel(postChannel);
        // }
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
                    renderItem={({item}) => <PostCard item={item} currentUser={user} router={router} />}
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
