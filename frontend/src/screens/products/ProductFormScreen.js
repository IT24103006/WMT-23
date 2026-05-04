import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';

export default function ProductFormScreen({ route, navigation }) {
  const existing = route.params?.product;
  const [name, setName]             = useState(existing?.name || '');
  const [price, setPrice]           = useState(existing?.price?.toString() || '');
  const [quantity, setQuantity]     = useState(existing?.quantity?.toString() || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [imageFile, setImageFile]   = useState(null);
  const [loading, setLoading]       = useState(false);

  // ── Frontend Validations ────────────────────────────────────────────────
  const validate = () => {
    if (!name.trim()) { Alert.alert('Validation', 'Product name is required'); return false; }
    if (name.trim().length < 2) { Alert.alert('Validation', 'Name must be at least 2 characters'); return false; }
    if (!price) { Alert.alert('Validation', 'Price is required'); return false; }
    if (isNaN(Number(price)) || Number(price) < 0) {
      Alert.alert('Validation', 'Price must be a valid number (0 or more)'); return false;
    }
    if (Number(price) > 10_000_000) {
      Alert.alert('Validation', 'Price seems too high (max Rs. 10,000,000)'); return false;
    }
    if (!quantity) { Alert.alert('Validation', 'Quantity is required'); return false; }
    if (isNaN(Number(quantity)) || Number(quantity) < 0) {
      Alert.alert('Validation', 'Quantity must be 0 or more'); return false;
    }
    if (!Number.isInteger(Number(quantity))) {
      Alert.alert('Validation', 'Quantity must be a whole number (no decimals)'); return false;
    }
    if (description.length > 500) {
      Alert.alert('Validation', 'Description cannot exceed 500 characters'); return false;
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
      formData.append('price', price);
      formData.append('quantity', quantity);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', { uri: imageFile.uri, type: 'image/jpeg', name: 'product.jpg' });
      }

      if (existing) {
        await productService.update(existing._id, formData);
        Alert.alert('Success', 'Product updated!');
      } else {
        await productService.create(formData);
        Alert.alert('Success', 'Product added!');
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
    Alert.alert('Remove Image', 'Remove product image?', [
      { text: 'Cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try { await productService.deleteImage(existing._id); navigation.goBack(); }
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
            <Text style={styles.removeTxt}>Remove Image</Text>
          </TouchableOpacity>
        </View>
      )}

      <ImageUpload onImageSelected={setImageFile} label={existing?.image ? 'Replace Image' : 'Add Product Image'} />

      <Text style={styles.label}>Product Name *</Text>
      <Input value={name} onChangeText={setName} placeholder="e.g. Rice 5kg" />

      <Text style={styles.label}>Price (LKR) *</Text>
      <Input value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="numeric" />

      <Text style={styles.label}>Quantity (units) *</Text>
      <Input value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="number-pad" />

      <Text style={styles.label}>Description <Text style={styles.hint}>({description.length}/500)</Text></Text>
      <Input value={description} onChangeText={setDescription} placeholder="Optional description" multiline numberOfLines={3} maxLength={500} />

      <Button
        title={loading ? 'Saving...' : (existing ? 'Update Product' : 'Add Product')}
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
  hint: { color: '#bbb', fontWeight: '400' },
  currentImg: { alignItems: 'center', marginBottom: 16 },
  img: { width: 120, height: 120, borderRadius: 10 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  removeTxt: { color: '#e74c3c', marginLeft: 4, fontSize: 13 },
});