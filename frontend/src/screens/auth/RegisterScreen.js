import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const handleRegister = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Full name is required');
    if (!form.email.trim()) return Alert.alert('Error', 'Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return Alert.alert('Error', 'Please enter a valid email address');
    if (!form.password) return Alert.alert('Error', 'Password is required');
    if (form.password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (form.phone && !/^\d{10}$/.test(form.phone))
      return Alert.alert('Error', 'Phone number must be exactly 10 digits');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    if (image) {
      fd.append('image', { uri: image.uri, type: 'image/jpeg', name: 'profile.jpg' });
    }

    setLoading(true);
    try {
      await register(fd);
    } catch (err) {
      Alert.alert('Registration Failed', err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <ImageUpload imageUri={image?.uri} onImageSelected={setImage} label="Profile Picture" />
        <Input label="Full Name" placeholder="John Doe" value={form.name} onChangeText={set('name')} />
        <Input label="Email" placeholder="you@example.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone" placeholder="+94 77 123 4567" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Input label="Password" placeholder="Min. 6 characters" value={form.password} onChangeText={set('password')} secureTextEntry />
        <Button title="Register" onPress={handleRegister} loading={loading} style={{ marginTop: 12 }} />
        <Button title="Back to Login" onPress={() => navigation.goBack()} variant="secondary" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#2ecc71', textAlign: 'center', marginBottom: 16, marginTop: 20 },
});