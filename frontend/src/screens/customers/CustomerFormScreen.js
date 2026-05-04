import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';

export default function CustomerFormScreen({ route, navigation }) {
  const existing = route.params?.customer;
  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [creditLimit, setCreditLimit] = useState(existing?.creditLimit?.toString() || '0');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Customer name is required'); return; }
    if (phone && !/^\d{10}$/.test(phone)) {
      Alert.alert('Validation', 'Phone number must be exactly 10 digits');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return;
    }
    if (creditLimit && isNaN(Number(creditLimit))) {
      Alert.alert('Validation', 'Credit limit must be a valid number');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('creditLimit', creditLimit);
      if (imageFile) formData.append('image', { uri: imageFile.uri, type: 'image/jpeg', name: 'customer.jpg' });

      if (existing) {
        await customerService.update(existing._id, formData);
        Alert.alert('Success', 'Customer updated!');
      } else {
        await customerService.create(formData);
        Alert.alert('Success', 'Customer added!');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  const handleDeleteImage = async () => {
    if (!existing?._id) return;
    Alert.alert('Remove', 'Remove customer photo?', [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await customerService.deleteImage(existing._id); navigation.goBack(); }
        catch { Alert.alert('Error', 'Failed'); }
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {existing?.image?.url && (
        <View style={styles.currentImg}>
          <Image source={{ uri: existing.image.url }} style={styles.img} />
          <TouchableOpacity onPress={handleDeleteImage} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={16} color="#e74c3c" />
            <Text style={styles.removeTxt}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <ImageUpload onImageSelected={setImageFile} label="Customer Photo" />

      <Text style={styles.label}>Full Name *</Text>
      <Input value={name} onChangeText={setName} placeholder="Customer name" />

      <Text style={styles.label}>Phone</Text>
      <Input value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />

      <Text style={styles.label}>Email</Text>
      <Input value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />

      <Text style={styles.label}>Address</Text>
      <Input value={address} onChangeText={setAddress} placeholder="Address" multiline />

      <Text style={styles.label}>Credit Limit (LKR)</Text>
      <Input value={creditLimit} onChangeText={setCreditLimit} placeholder="0" keyboardType="numeric" />

      <Button title={loading ? 'Saving...' : (existing ? 'Update Customer' : 'Add Customer')} onPress={handleSubmit} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  label: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 14, fontWeight: '600' },
  currentImg: { alignItems: 'center', marginBottom: 16 },
  img: { width: 100, height: 100, borderRadius: 50 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  removeTxt: { color: '#e74c3c', marginLeft: 4, fontSize: 13 },
});