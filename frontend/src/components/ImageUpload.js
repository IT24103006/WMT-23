import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { green: '#2ecc71', white: '#ffffff', gray: '#f0f0f0', darkGray: '#666' };

const ImageUpload = ({ imageUri, onImageSelected, onRemove, label = 'Upload Image' }) => {
  const pickImage = async (source) => {
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Camera permission required.');
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Gallery permission required.');
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    }
    if (!result.canceled) onImageSelected(result.assets[0]);
  };

  const showOptions = () => {
    Alert.alert(label, 'Choose image source', [
      { text: '📷 Camera', onPress: () => pickImage('camera') },
      { text: '🖼️ Gallery', onPress: () => pickImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={showOptions}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={36} color={COLORS.green} />
            <Text style={styles.placeholderText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
      {imageUri && onRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color={COLORS.white} />
          <Text style={styles.removeTxt}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  imagePicker: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.gray, overflow: 'hidden',
    borderWidth: 2, borderColor: COLORS.green, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderText: { fontSize: 11, color: COLORS.darkGray, marginTop: 4, textAlign: 'center' },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 8,
  },
  removeTxt: { color: COLORS.white, marginLeft: 4, fontSize: 13 },
});

export default ImageUpload;
