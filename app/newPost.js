import { Feather } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const NewPost = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null); 
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const editorRef = useRef(null);

  const onPick = async (mediaType) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'image' 
        ? 'images' 
        : 'videos',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const getFileExtension = (uri, mimeType) => {
      if (mimeType) {
          return mimeType.split('/')[1];
      }
      return uri.split('.').pop();
  }

  const onSubmit = async () => {
    if (!body && !file) {
      Alert.alert('Post', 'Please add some text or media.');
      return;
    }

    setLoading(true);

    try {
      let filePath = null;

      if (file) {
        const { decode } = require('base64-arraybuffer');
        const isImage = file.type === 'image';
        const ext = getFileExtension(file.uri, file.mimeType);
        const fileName = `${Date.now()}.${ext}`;
        const storagePath = `post-images/${user.id}/${fileName}`; 

        const fileUri = file.uri;
        const resp = await fetch(fileUri);
        const blob = await resp.blob();

        const { data, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(storagePath, blob, {
            contentType: file.mimeType || (isImage ? 'image/jpeg' : 'video/mp4'),
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(storagePath);
        
        filePath = urlData.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          userId: user.id,
          body: body,
          file: filePath,
        });

      if (dbError) throw dbError;

      setLoading(false);
      Alert.alert('Success', 'Post created successfully!');
      router.back();

    } catch (error) {
      setLoading(false);
      console.log('Post Error: ', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const removeFile = () => {
      setFile(null);
  }



  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Create Post</Text>
          <Button 
            title="Post" 
            loading={loading} 
            hasShadow={false}
            onPress={onSubmit} 
            buttonStyle={{ height: hp(4), width: hp(10) }}
            textStyle={{ fontSize: hp(1.8) }}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.editorContainer}>
                {/* User Info */}
                <View style={styles.userRow}>
                    <Avatar 
                        uri={user?.user_metadata?.image} 
                        size={hp(6)} 
                        rounded={theme.radius.xl} 
                    />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>
                            {user?.user_metadata?.full_name || 'User'}
                        </Text>
                        <Text style={styles.publicText}>Public</Text>
                    </View>
                </View>

                {/* Toolbar */}
                <RichToolbar 
                    editor={editorRef}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.insertOrderedList,
                        actions.insertBulletsList,
                        actions.alignLeft,
                        actions.alignCenter,
                        actions.alignRight,
                        actions.heading1,
                    ]}
                    iconMap={{
                        [actions.heading1]: ({ tintColor }) => (<Text style={{ color: tintColor }}>H1</Text>),
                    }}
                    style={styles.richToolbar}
                    flatContainerStyle={styles.listStyle}
                    selectedIconTint={theme.colors.primary}
                    editor={editorRef}
                    disabled={false}
                />

                {/* Rich Editor */}
                <RichEditor 
                    ref={editorRef}
                    containerStyle={styles.editor}
                    editorStyle={styles.editorContent}
                    placeholder={"What's on your mind?"}
                    onChange={(descriptionText) => {
                        setBody(descriptionText);
                    }}
                />

                {/* Media Preview */}
                {file && (
                    <View style={styles.filePreview}>
                        {file.type === 'video' ? (
                            <Video
                                ref={videoRef}
                                style={{ flex: 1 }}
                                source={{ uri: file.uri }}
                                useNativeControls
                                resizeMode={ResizeMode.COVER}
                                isLooping
                            />
                        ) : (
                            <Image 
                                source={{ uri: file.uri }} 
                                style={{ flex: 1 }} 
                                resizeMode="cover" 
                            />
                        )}
                        
                        <Pressable style={styles.removeBtn} onPress={removeFile}>
                            <Feather name="x" size={20} color="white" />
                        </Pressable>
                    </View>
                )}
            </View>

        </ScrollView>

        {/* Bottom Add Bar */}
        <View style={styles.bottomBar}>
             <Text style={styles.addText}>Add to your post</Text>
             <View style={styles.mediaIcons}>
                <TouchableOpacity onPress={() => onPick('image')}>
                    <Feather name="image" size={26} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onPick('video')}>
                    <Feather name="video" size={26} color={theme.colors.dark} />
                </TouchableOpacity>
             </View>
        </View>

      </View>
    </ScreenWrapper>
  );
};

export default NewPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingBottom: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  scrollContent: {
      flexGrow: 1,
  },
  editorContainer: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: '#f0f0f0',
      padding: 15,
      gap: 15,
  },
  userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 5
  },
  username: {
      fontSize: hp(2.2),
      fontWeight: theme.fonts.semibold,
      color: theme.colors.text
  },
  publicText: {
      fontSize: hp(1.6),
      fontWeight: theme.fonts.medium,
      color: theme.colors.textLight
  },
  richToolbar: {
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      backgroundColor: '#f9f9f9',
  },
  listStyle: {
      paddingHorizontal: 10,
      gap: 10
  },
  editor: {
      minHeight: hp(25),
      flex: 1
  },
  editorContent: {
      color: theme.colors.text, 
      placeholderColor: theme.colors.textLight
  },
  filePreview: {
      height: hp(35),
      width: '100%',
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.05)',
      marginTop: 10
  },
  removeBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 7,
      borderRadius: 50
  },
  bottomBar: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 15,
     backgroundColor: 'white',
     borderRadius: theme.radius.xl,
     borderWidth: 1,
     borderColor: '#f0f0f0',
     marginBottom: 10,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 5,
     elevation: 2
  },
  addText: {
      fontSize: hp(2),
      fontWeight: theme.fonts.semibold,
      color: theme.colors.text
  },
  mediaIcons: {
      flexDirection: 'row',
      gap: 20,
      alignItems: 'center'
  }
});