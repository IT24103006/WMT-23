import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supplierService } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';

export default function SupplierFormScreen({ route, navigation }) {
  const existing = route.params?.supplier;
  const [name, setName]       = useState(existing?.name || '');
  const [phone, setPhone]     = useState(existing?.phone || '');
  const [email, setEmail]     = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [company, setCompany] = useState(existing?.company || '');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Frontend Validations ────────────────────────────────────────────────
  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Supplier name is required'); return false;
    }
    if (name.trim().length < 2) {
      Alert.alert('Validation', 'Name must be at least 2 characters'); return false;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      Alert.alert('Validation', 'Phone must be exactly 10 digits'); return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation', 'Please enter a valid email address'); return false;
    }
    return true;
  };
  // ───────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('company', company);
      if (imageFile) {
        formData.append('image', { uri: imageFile.uri, type: 'image/jpeg', name: 'supplier.jpg' });
      }

      if (existing) {
        await supplierService.update(existing._id, formData);
        Alert.alert('Success', 'Supplier updated!');
      } else {
        await supplierService.create(formData);
        Alert.alert('Success', 'Supplier added!');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!existing?._id) return;
    Alert.alert('Remove Image', 'Remove supplier photo?', [
      { text: 'Cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try { await supplierService.deleteImage(existing._id); navigation.goBack(); }
          catch { Alert.alert('Error', 'Remove failed'); }
        },
      },
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

      <ImageUpload onImageSelected={setImageFile} label={existing?.image ? 'Replace Photo' : 'Supplier Photo'} />

      <Text style={styles.label}>Supplier Name *</Text>
      <Input value={name} onChangeText={setName} placeholder="e.g. Lanka Traders" />

      <Text style={styles.label}>Company / Business Name</Text>
      <Input value={company} onChangeText={setCompany} placeholder="Company name (optional)" />

      <Text style={styles.label}>Phone</Text>
      <Input value={phone} onChangeText={setPhone} placeholder="10-digit number" keyboardType="phone-pad" />

      <Text style={styles.label}>Email</Text>
      <Input value={email} onChangeText={setEmail} placeholder="supplier@email.com" keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>Address</Text>
      <Input value={address} onChangeText={setAddress} placeholder="Address" multiline numberOfLines={2} />

      <Button
        title={loading ? 'Saving...' : (existing ? 'Update Supplier' : 'Add Supplier')}
        onPress={handleSubmit}
        disabled={loading}
      />
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