import { supabase } from "../lib/supabase";
import { createNotification } from "./notificationService";

export const createPostLike = async (postLike) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .insert(postLike)
            .select()
            .single();

        if (error) {
            console.log('postLike error: ', error);
            return { success: false, msg: 'Could not like the post' };
        }

        // Trigger notification for post owner
        // We need to fetch the post owner ID if not provided, but usually it's in the item
        // For simplicity, let's assume the caller will handle notifications if they have post owner ID,
        // or we fetch it here. Let's fetch the post to get the owner.
        const {data: postData} = await supabase.from('posts').select('userId').eq('id', postLike.postId).single();
        
        if(postData && postData.userId !== postLike.userId){
            await createNotification({
                senderId: postLike.userId,
                receiverId: postData.userId,
                title: 'liked your post',
                data: JSON.stringify({postId: postLike.postId})
            });
        }

        return { success: true, data };
    } catch (error) {
        console.log('postLike error: ', error);
        return { success: false, msg: 'Could not like the post' };
    }
}

export const removePostLike = async (postId, userId) => {
    try {
        const { error } = await supabase
            .from('postLikes')
            .delete()
            .eq('postId', postId)
            .eq('userId', userId);

        if (error) {
            console.log('postLike remove error: ', error);
            return { success: false, msg: 'Could not remove the post like' };
        }

        return { success: true };
    } catch (error) {
        console.log('postLike remove error: ', error);
        return { success: false, msg: 'Could not remove the post like' };
    }
}

export const createComment = async (comment) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert(comment)
            .select('*, user:users(id, name, image)')
            .single();

        if (error) {
            console.log('createComment error: ', error);
            return { success: false, msg: 'Could not create the comment' };
        }

        // Trigger notification for post owner
        const {data: postData} = await supabase.from('posts').select('userId').eq('id', comment.postId).single();
        
        if(postData && postData.userId !== comment.userId){
            await createNotification({
                senderId: comment.userId,
                receiverId: postData.userId,
                title: 'commented on your post',
                data: JSON.stringify({postId: comment.postId})
            });
        }

        return { success: true, data };
    } catch (error) {
        console.log('createComment error: ', error);
        return { success: false, msg: 'Could not create the comment' };
    }
}

export const removeComment = async (commentId) => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.log('removeComment error: ', error);
            return { success: false, msg: 'Could not remove the comment' };
        }

        return { success: true, data: { commentId } };
    } catch (error) {
        console.log('removeComment error: ', error);
        return { success: false, msg: 'Could not remove the comment' };
    }
}

export const fetchPostDetails = async (postId) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*, user:users(id, name, image), postLikes(*), comments(*, user:users(id, name, image))')
            .eq('id', postId)
            .order('created_at', { foreignTable: 'comments', ascending: false })
            .single();

        if (error) {
            console.log('fetchPostDetails error: ', error);
            return { success: false, msg: 'Could not fetch post details' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('fetchPostDetails error: ', error);
        return { success: false, msg: 'Could not fetch post details' };
    }
}
