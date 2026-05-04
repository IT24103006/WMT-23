import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (imageFile) {
        formData.append('image', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      }
      const { data } = await authService.updateProfile(formData);
      updateUser(data.user);
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert('Remove Image', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.deleteProfileImage();
            updateUser({ ...user, image: null });
          } catch {
            Alert.alert('Error', 'Failed to remove image');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          {user?.image?.url ? (
            <Image source={{ uri: user.image.url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#ccc" />
            </View>
          )}
          {user?.image?.url && (
            <TouchableOpacity onPress={handleDeleteImage} style={styles.removeImg}>
              <Ionicons name="trash-outline" size={16} color="#e74c3c" />
              <Text style={styles.removeImgTxt}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Profile Photo</Text>
        <ImageUpload onImageSelected={setImageFile} label="Change Profile Photo" />

        <Text style={styles.label}>Full Name</Text>
        <Input value={name} onChangeText={setName} placeholder="Your name" />

        <Text style={styles.label}>Phone</Text>
        <Input value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />

        <Text style={styles.emailText}>Email: {user?.email}</Text>
        <Text style={styles.roleText}>Role: {user?.role || 'user'}</Text>

        <Button title={loading ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={loading} />

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: GREEN },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  removeImg: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  removeImgTxt: { color: '#e74c3c', marginLeft: 4, fontSize: 13 },
  label: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 12, fontWeight: '600' },
  emailText: { fontSize: 14, color: '#555', marginTop: 12 },
  roleText: { fontSize: 14, color: '#555', marginBottom: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e74c3c' },
  logoutTxt: { color: '#e74c3c', marginLeft: 8, fontSize: 16, fontWeight: '600' },
});
