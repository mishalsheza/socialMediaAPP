import { supabase } from "../lib/supabase";

export const createNotification = async (notification) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) {
            console.log('notification error: ', error);
            return { success: false, msg: 'Could not create notification' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('notification error: ', error);
        return { success: false, msg: 'Could not create notification' };
    }
}

export const fetchNotifications = async (receiverId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender: senderId (
                    id,
                    name,
                    image
                )
            `)
            .eq('receiverId', receiverId)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('fetchNotifications error: ', error);
            return { success: false, msg: 'Could not fetch notifications' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('fetchNotifications error: ', error);
        return { success: false, msg: 'Could not fetch notifications' };
    }
}

export const markNotificationsAsRead = async (receiverId) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ isRead: true })
            .eq('receiverId', receiverId)
            .eq('isRead', false);

        if (error) {
            console.log('markNotificationsAsRead error: ', error);
            return { success: false, msg: 'Could not mark notifications as read' };
        }

        return { success: true };
    } catch (error) {
        console.log('markNotificationsAsRead error: ', error);
        return { success: false, msg: 'Could not mark notifications as read' };
    }
}
