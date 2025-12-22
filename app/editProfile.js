import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/themes';
import { useAuth } from '../contexts/authContext';
import { hp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const EditProfile = () => {
  const router = useRouter();
  const { user, setUserData } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    image: null,
    bio: '',
    address: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.user_metadata?.full_name || '',
      phoneNumber: user.user_metadata?.phone_number || '',
      image: user.user_metadata?.image || null,
      bio: user.user_metadata?.bio || '',
      address: user.user_metadata?.address || '',
    });
  }, [user]);

  const handleImageSelection = async () => {
    console.log('📸 Opening Image Picker...');
    console.log('Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('🌐 Using web file input');
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1];
              setForm((prev) => ({ 
                ...prev, 
                image: {
                  uri: reader.result,
                  base64: base64,
                  mimeType: file.type,
                }
              }));
              console.log('✅ Image selected (web)');
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
      } catch (error) {
        console.error('❌ Web file picker error:', error);
        Alert.alert('Error', 'Failed to open file picker');
      }
      return;
    }

    console.log('📱 Using mobile image picker');
    
    if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
      console.error('❌ ImagePicker not available');
      Alert.alert('Error', 'Image picker is not available');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', permissionResult.status);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const mediaType = ImagePicker.MediaTypeOptions?.Images || 'Images';
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      console.log('Picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('✅ Image selected (mobile):', asset.uri);
        setForm((prev) => ({ ...prev, image: asset }));
      }
    } catch (error) {
      console.error('❌ Mobile image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (asset) => {
    try {
      console.log('⬆️ Starting upload...');
      const { decode } = require('base64-arraybuffer');
      
      // Get proper file extension from mimeType or URI
      let ext = 'jpg'; // default
      if (asset.mimeType) {
        // Convert mime type to extension (e.g., 'image/jpeg' -> 'jpg')
        ext = asset.mimeType.split('/')[1].replace('jpeg', 'jpg');
      } else if (asset.uri && !asset.uri.startsWith('data:')) {
        // Only extract from URI if it's a real file path, not a data URI
        ext = asset.uri.split('.').pop().split('?')[0];
      }
      
      const path = `profiles/${user.id}/${Date.now()}.${ext}`;
      console.log(`⬆️ Uploading to ${path}`);
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(path, decode(asset.base64), { 
            upsert: true,
            contentType: asset.mimeType || 'image/jpeg'
        });

      if(error){
          console.log('❌ Upload Supabase Error:', error);
          return null;
      }

      const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(path);
      console.log('✅ Upload Success. URL:', publicData.publicUrl);
      return publicData.publicUrl;
    } catch (error) {
      console.log('❌ Image upload exception:', error);
      return null;
    }
  };

  const onSubmit = async () => {
    const { name, phoneNumber, bio, address } = form;

    if (!name || !phoneNumber || !bio || !address) {
      Alert.alert('Profile', 'Please fill all fields');
      return;
    }

    setLoading(true);

    let imageUrl = typeof form.image === 'string' ? form.image : null;
    if (form.image && typeof form.image === 'object') {
      const uploaded = await uploadImage(form.image);
      if (!uploaded) {
        setLoading(false);
        Alert.alert('Error', 'Image upload failed');
        return;
      }
      imageUrl = uploaded;
    }

    const { error: dbError } = await supabase.from('users').upsert({
      id: user.id,
      name,
      phoneNumber,
      bio,
      address,
      image: imageUrl,
      email: user.email,
    });

    if (dbError) {
      console.error('❌ DB Update error:', dbError);
      setLoading(false);
      Alert.alert('Error', 'Failed to update profile');
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        phone_number: phoneNumber,
        bio,
        address,
        image: imageUrl,
      }
    });

    setLoading(false);

    if (authError) {
      console.error('❌ Auth Update error:', authError);
      Alert.alert('Error', 'Failed to update profile metadata');
      return;
    }

    console.log('✅ Profile updated successfully');

    setUserData({
      name,
      phoneNumber,
      bio,
      address,
      image: imageUrl,
    });

    Alert.alert('Success', 'Profile updated successfully');
    router.back();
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BackButton router={router} />
              <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <Avatar
                uri={typeof form.image === 'object' ? form.image?.uri : form.image}
                size={hp(14)}
                rounded={theme.radius.xxl * 1.5}
              />
              <Pressable style={styles.cameraIcon} onPress={handleImageSelection}>
                <Feather name="camera" size={20} color={theme.colors.dark} />
              </Pressable>
            </View>

            <Input
              icon={<Feather name="user" size={24} />}
              placeholder="Name"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <Input
              icon={<Feather name="phone" size={24} />}
              placeholder="Phone"
              value={form.phoneNumber}
              onChangeText={(v) => setForm({ ...form, phoneNumber: v })}
            />
            <Input
              icon={<Feather name="map-pin" size={24} />}
              placeholder="Address"
              value={form.address}
              onChangeText={(v) => setForm({ ...form, address: v })}
            />
            <Input
              icon={<Feather name="file-text" size={24} />}
              placeholder="Bio"
              value={form.bio}
              multiline
              onChangeText={(v) => setForm({ ...form, bio: v })}
            />

            <Button title="Save Changes" loading={loading} onPress={onSubmit} />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: hp(2.6), fontWeight: '700', color: theme.colors.text },
  form: { gap: 18 },
  avatarContainer: { alignSelf: 'center', height: hp(14), width: hp(14), position: 'relative' },
  cameraIcon: { position: 'absolute', bottom: 0, right: -10, padding: 8, borderRadius: 50, backgroundColor: 'white', elevation: 5 },
});