console.log('🚀🚀🚀 EditProfile FILE LOADED 🚀🚀🚀');

import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  console.log('🎬 EditProfile COMPONENT RENDERING');
  
  const router = useRouter();
  const authContext = useAuth();
  const [loading, setLoading] = useState(false);

  // DEBUG: Check if context exists
  console.log('🔍 Auth context check:', {
    contextExists: !!authContext,
    hasUser: !!authContext?.user,
    setUserDataType: typeof authContext?.setUserData,
    setUserDataExists: !!authContext?.setUserData,
  });

  const { user, setUserData } = authContext || {};

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    image: null,
    bio: '',
    address: '',
  });

  // Load current profile
  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user found');
      return;
    }

    console.log('📱 Loading user data:', user.user_metadata);

    setForm({
      name: user.user_metadata?.full_name || '',
      phoneNumber: user.user_metadata?.phone_number || '',
      image: user.user_metadata?.image || null,
      bio: user.user_metadata?.bio || '',
      address: user.user_metadata?.address || '',
    });
  }, [user]);

  // Pick image from gallery
  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0] });
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (asset) => {
    try {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const ext = asset.uri.split('.').pop();
      const path = `profiles/${user.id}/${Date.now()}.${ext}`;

      await supabase.storage.from('uploads').upload(path, blob, { upsert: true });
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.log('Image upload error:', error);
      return null;
    }
  };

  // Submit profile changes
  const onSubmit = async () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('🎯 SUBMIT BUTTON CLICKED');
    console.log('='.repeat(50));
    console.log('🔍 setUserData check:', {
      type: typeof setUserData,
      exists: !!setUserData,
      isFunction: typeof setUserData === 'function',
    });

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

    // Update the users table
    console.log('💾 Updating database...');
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      name,
      phoneNumber,
      bio,
      address,
      image: imageUrl,
      email: user.email,
    });

    setLoading(false);

    if (error) {
      console.error('❌ DB Update error:', error);
      Alert.alert('Error', 'Failed to update profile');
      return;
    }

    console.log('✅ DB updated successfully');

    // Update context for real-time UI reflection
    const updatedData = {
      name,
      phoneNumber,
      bio,
      address,
      image: imageUrl,
    };

    console.log('📦 Data to update:', updatedData);

    if (setUserData) {
      console.log('✅ setUserData exists - calling it now...');
      try {
        setUserData(updatedData);
        console.log('✅ setUserData called successfully!');
      } catch (err) {
        console.error('❌ Error calling setUserData:', err);
      }
    } else {
      console.error('❌❌❌ setUserData is UNDEFINED! Context not working!');
    }

    console.log('='.repeat(50));
    console.log('');

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
              <Pressable style={styles.cameraIcon} onPress={onPickImage}>
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