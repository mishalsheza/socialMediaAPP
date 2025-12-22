import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Avatar from '../components/Avatar'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Input from '../components/Input'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/themes'
import { useAuth } from '../contexts/authContext'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'


const EditProfile = () => {
    const router = useRouter();
    const { user, setUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [userForm, setUserForm] = useState({
        name: '',
        phoneNumber: '',
        image: null,
        bio: '',
        address: ''
    });

    useEffect(() => {
        if(user){
            setUserForm({
                name: user.user_metadata?.full_name || '',
                phoneNumber: user.user_metadata?.phone_number || '',
                image: user.user_metadata?.image || null,
                address: user.user_metadata?.address || '',
                bio: user.user_metadata?.bio || ''
            });

            // Auto-repair profile if image data is corrupted (too large/base64 stored by mistake)
            const currentImage = user.user_metadata?.image;
            if (currentImage && (typeof currentImage === 'object' || (typeof currentImage === 'string' && currentImage.length > 5000))) {
                console.log('Detected corrupted image data. Repairing...');
                const repairProfile = async () => {
                    const { data, error } = await supabase.auth.updateUser({
                        data: { image: null }
                    });
                    if (data.user) {
                        setUserData(data.user);
                        Alert.alert('Profile Repaired', 'We fixed a glitch in your profile picture. Please upload it again.');
                    }
                };
                repairProfile();
            }
        }
    }, [user]);

const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: false, // VERY IMPORTANT
        }); 

  if (!result.canceled) {
    setUserForm({ ...userForm, image: result.assets[0] });
  }
};


    const uploadImage = async (imageAsset) => {
      try {
        const { decode } = require('base64-arraybuffer');
        const fileExt = imageAsset.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `profiles/${user.id}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePath, decode(imageAsset.base64), {
            contentType: imageAsset.mimeType || 'image/jpeg',
            upsert: true
          });

        if (error) {
             console.log('Upload error: ', error);
             return null;
        }

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        console.log('Uploaded Image Public URL:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;

      } catch (error) {
        console.log('Image upload exception:', error);
        return null; 
      }
    }

    const onSubmit = async () => {
        const { name, phoneNumber, bio, address } = userForm;
        if(!name || !phoneNumber || !address || !bio ){
            Alert.alert('Profile', 'Please fill all the fields');
            return;
        }

        setLoading(true);

        let imageUrl = userForm.image;
        if(userForm.image && userForm.image.uri && userForm.image.uri !== user?.user_metadata?.image){
             const uploadedUrl = await uploadImage(userForm.image);
             if(uploadedUrl) {
                 imageUrl = uploadedUrl;
             } else {
                 setLoading(false);
                 Alert.alert('Error', 'Image upload failed');
                 return;
             }
        } else {
             // Keep existing image string
             imageUrl = typeof userForm.image === 'string' ? userForm.image : user?.user_metadata?.image;
        }

        const { data, error } = await supabase.auth.updateUser({
            data: {
                full_name: name,
                phone_number: phoneNumber,
                bio,
                address,
                image: imageUrl 
            }
        });

        console.log('Update User Data:', data);
        console.log('Update User Error:', error);

        setLoading(false);

        if(error){
            Alert.alert('Profile', 'Error updating profile');
            console.log(error);
            return;
        }

        if(data.user){
             // Update the context so the profile screen reflects changes immediately
            setUserData(data.user);
            Alert.alert('Success', 'Profile Updated Successfully');
            router.back();
        }
    }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <ScrollView style={{flex: 1}}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <BackButton router={router} />
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
                <View style={styles.avatarContainer}>
                    <Avatar 
                        uri={typeof userForm.image === 'object' && userForm.image?.uri ? userForm.image.uri : userForm.image}
                        size={hp(14)}
                        rounded={theme.radius.xxl*1.5}
                    />
                    <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                        <Feather name="camera" size={20} color={theme.colors.dark} />
                    </Pressable>
                </View>
                
                <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                    Please fill your profile details
                </Text>

                <Input 
                    icon={<Feather name="user" size={24} color={theme.colors.text} />}
                    placeholder='Enter your name'
                    value={userForm.name}
                    onChangeText={value => setUserForm({...userForm, name: value})}
                />
                <Input 
                    icon={<Feather name="phone" size={24} color={theme.colors.text} />}
                    placeholder='Enter your phone number'
                    value={userForm.phoneNumber}
                    onChangeText={value => setUserForm({...userForm, phoneNumber: value})}
                />
                <Input 
                    icon={<Feather name="map-pin" size={24} color={theme.colors.text} />}
                    placeholder='Enter your address'
                    value={userForm.address}
                    onChangeText={value => setUserForm({...userForm, address: value})}
                />
                 {/* Email is typically read-only or requires re-auth to change */}
                 <Input 
                    icon={<Feather name="file-text" size={24} color={theme.colors.text} />
}
                    placeholder='Enter your Bio'
                    value={userForm.bio}
                    multiline={true}
                    containerStyle={styles.bio}
                    onChangeText={value => setUserForm({...userForm, bio: value})}
                />

                <Button title="Save Changes" loading={loading} onPress={onSubmit} />
            </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default EditProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4)
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    headerTitle: {
        fontSize: hp(2.6),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    },
    form: {
        gap: 18,
        marginTop: 20
    },
    avatarContainer: {
        alignSelf: 'center',
        height: hp(14),
        width: hp(14),
        position: 'relative'
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: -10,
        padding: 8,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: theme.colors.textLight,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7
    }
})