import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/themes';
import { hp } from '../helpers/common';
import Avatar from './Avatar';

const CommentItem = ({
    item,
    canDelete = false,
    onDelete = () => { },
    highlight = false
}) => {
    const createdAt = moment(item?.created_at).format('MMM D');

    const handleDelete = () => {
        Alert.alert('Confirm', "Are you sure you want to delete this comment?", [
            {
                text: 'Cancel',
                onPress: () => console.log('modal cancelled'),
                style: 'cancel'
            },
            {
                text: 'Delete',
                onPress: () => onDelete(item),
                style: 'destructive'
            }
        ])
    }

    return (
        <View style={styles.container}>
            <Avatar
                uri={item?.user?.image}
                size={hp(4.5)}
                rounded={theme.radius.md}
            />
            <View style={[styles.content, highlight && styles.highlight]}>
                <View style={styles.header}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.name}>{item?.user?.name}</Text>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.time}>{createdAt}</Text>
                    </View>
                    {
                        canDelete && (
                            <TouchableOpacity onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={20} color={theme.colors.rose} />
                            </TouchableOpacity>
                        )
                    }
                </View>
                <Text style={styles.text}>{item?.text}</Text>
            </View>
        </View>
    );
};

export default CommentItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        gap: 10,
    },
    content: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        flex: 1,
        gap: 5,
        paddingHorizontal: 14,
        paddingBottom: 10,
        paddingTop: 6,
        borderRadius: theme.radius.md,
        borderCurve: 'continuous',
    },
    highlight: {
        borderWidth: 0.2,
        backgroundColor: 'white',
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    name: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textDark,
    },
    time: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
    },
    bullet: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.bold,
    },
    text: {
        fontSize: hp(1.7),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium,
    },
});
