import { Feather } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Import editor only on native or client-side web
let RichEditor, RichToolbar, actions;
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
    const RichEditorLib = require('react-native-pell-rich-editor');
    RichEditor = RichEditorLib.RichEditor;
    RichToolbar = RichEditorLib.RichToolbar;
    actions = RichEditorLib.actions;
}

import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const EditPost = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { postId } = useLocalSearchParams();

  const [body, setBody] = useState('');
  const [file, setFile] = useState(null); 
  const [existingFile, setExistingFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mounted, setMounted] = useState(false);

  const editorRef = useRef(null);

  const player = useVideoPlayer(
    file?.type === 'video' ? file.uri : (existingFile?.match(/\.(mp4|mov|m4v|webm|ogv)$/i) || existingFile?.includes('/post-videos/') ? existingFile : null),
    (p) => {
      if (p) {
        p.loop = true;
        p.play();
      }
    }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch existing post data
  useEffect(() => {
    if (postId && user) {
      fetchPost();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    if (!user || !postId) return;

    try {
      setFetching(true);
      console.log('📥 Fetching post:', postId);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('userId', user?.id)
        .single();

      if (error) {
        console.error('❌ Fetch error:', error);
        Alert.alert('Error', 'Failed to load post');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/home');
        }
        return;
      }

      console.log('✅ Post loaded:', data);

      setBody(data.body || '');
      setExistingFile(data.file || null);
      setFetching(false);

    } catch (error) {
      console.error('❌ Fetch exception:', error);
      Alert.alert('Error', 'Failed to load post');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    }
  };

  const onPick = async (mediaType) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mediaType === 'image'
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: mediaType === 'image',
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (result.canceled) return;

    let pickedFile = result.assets[0];

    // Convert HEIC/HEIF images to JPEG
    if (pickedFile.type === 'image' && pickedFile.uri.toLowerCase().match(/\.(heic|heif)$/)) {
      const manipResult = await ImageManipulator.manipulateAsync(
        pickedFile.uri,
        [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      pickedFile.uri = manipResult.uri;
      pickedFile.mimeType = 'image/jpeg';
    }

    setFile(pickedFile);
    setExistingFile(null); 
  };

  const uploadFile = async (fileToUpload) => {
    try {
      const isImage = fileToUpload.type === 'image';
      const bucket = isImage ? 'uploads' : 'post-videos';

      let fileData;
      let contentType;

      const response = await fetch(fileToUpload.uri);
      fileData = await response.blob();

      if (Platform.OS === 'web') {
        contentType = fileData.type;
      } else {
        contentType = fileToUpload.mimeType || (isImage ? 'image/jpeg' : 'video/mp4');
      }

      // Determine clean extension from contentType
      let ext = 'jpg';
      if (contentType) {
        const match = contentType.match(/\/([a-zA-Z0-9]+)/);
        if (match) {
          ext = match[1].replace('jpeg', 'jpg');
        }
      } else if (!isImage) {
        ext = 'mp4';
      }

      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user?.id}/${fileName}`;

      console.log('⬆️ Uploading to Supabase (Edit):', { bucket, filePath, contentType });

      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileData, {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return urlData.publicUrl;

    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const deleteOldFile = async (fileUrl) => {
    try {
      if (!fileUrl) return;

      const isVideoType = fileUrl.match(/\.(mp4|mov|m4v|webm|ogv)$/i) || fileUrl.includes('/post-videos/');
      const bucket = isVideoType ? 'post-videos' : 'uploads';
      const fileName = fileUrl.split('/').pop();
      const filePath = `${user?.id}/${fileName}`;

      console.log('🗑️ Deleting old file:', bucket, filePath);

      await supabase.storage.from(bucket).remove([filePath]);
      console.log('✅ Old file deleted');
    } catch (error) {
      console.log('⚠️ Error deleting old file (non-critical):', error);
    }
  };

  const onSubmit = async () => {
    if (!body && !file && !existingFile) {
      Alert.alert('Post', 'Please add some text or media.');
      return;
    }

    setLoading(true);

    try {
      let filePath = existingFile;

      if (file) {
        filePath = await uploadFile(file);
        if (existingFile) {
          await deleteOldFile(existingFile);
        }
      }

      const { error: dbError } = await supabase
        .from('posts')
        .update({
          body: body,
          file: filePath,
        })
        .eq('id', postId)
        .eq('userId', user?.id);

      if (dbError) throw dbError;

      setLoading(false);
      Alert.alert('Success', 'Post updated successfully!');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }

    } catch (error) {
      setLoading(false);
      console.error('❌ Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update post');
    }
  };

  const removeFile = () => {
    setFile(null);
    setExistingFile(null);
  };

  if (!user || !postId) {
    return (
      <ScreenWrapper bg="white">
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (fetching) {
    return (
      <ScreenWrapper bg="white">
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading post...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const displayFile = file || existingFile;
  const isDisplayVideo = typeof displayFile === 'string' 
    ? (displayFile.match(/\.(mp4|mov|m4v|webm|ogv)$/i) || displayFile.includes('/post-videos/'))
    : displayFile?.type === 'video';

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Edit Post</Text>
          <Button 
            title="Save" 
            loading={loading} 
            hasShadow={false}
            onPress={onSubmit} 
            buttonStyle={{ height: hp(4), width: hp(10) }}
            textStyle={{ fontSize: hp(1.8) }}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.editorContainer}>
            <View style={styles.userRow}>
              <Avatar uri={user?.user_metadata?.image} size={hp(6)} rounded={theme.radius.xl} />
              <View style={{ gap: 2 }}>
                <Text style={styles.username}>
                  {user?.user_metadata?.full_name || 'User'}
                </Text>
                <Text style={styles.publicText}>Public</Text>
              </View>
            </View>

            {mounted && (RichEditor && Platform.OS !== 'web') ? (
              <>
                <RichToolbar 
                  editor={editorRef}
                  actions={[
                    actions?.setBold,
                    actions?.setItalic,
                    actions?.insertOrderedList,
                    actions?.insertBulletsList,
                    actions?.alignLeft,
                    actions?.alignCenter,
                    actions?.alignRight,
                    actions?.heading1,
                  ]}
                  iconMap={{
                    [actions?.heading1]: ({ tintColor }) => (<Text style={{ color: tintColor }}>H1</Text>),
                  }}
                  style={styles.richToolbar}
                  flatContainerStyle={styles.listStyle}
                  selectedIconTint={theme.colors.primary}
                />
                <RichEditor 
                  ref={editorRef}
                  containerStyle={styles.editor}
                  editorStyle={styles.editorContent}
                  placeholder={"What's on your mind?"}
                  initialContentHTML={body}
                  onChange={(descriptionText) => setBody(descriptionText)}
                />
              </>
            ) : (
              <TextInput
                placeholder="What's on your mind?"
                style={styles.textInput}
                multiline
                placeholderTextColor={theme.colors.textLight}
                value={body}
                onChangeText={setBody}
                textAlignVertical="top"
              />
            )}

            {displayFile && (
              <View style={styles.filePreview}>
                {isDisplayVideo ? (
                  Platform.OS === 'web' && typeof displayFile === 'string' ? (
                    <video src={displayFile} controls loop style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <VideoView
                      player={player}
                      style={{ flex: 1 }}
                      allowsFullscreen
                      allowsPictureInPicture
                    />
                  )
                ) : (
                  <Image 
                    source={{ uri: file?.uri || existingFile }} 
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

        <View style={styles.bottomBar}>
          <Text style={styles.addText}>Change media</Text>
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

export default EditPost;

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
  textInput: {
      fontSize: hp(2),
      color: theme.colors.text,
      minHeight: hp(20),
      textAlignVertical: 'top' 
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