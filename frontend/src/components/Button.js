import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Button = ({ title, onPress, loading, variant = 'primary', style }) => {
  const bgColor = variant === 'primary' ? '#2ecc71' : variant === 'danger' ? '#e74c3c' : '#ecf0f1';
  const txtColor = variant === 'secondary' ? '#333' : '#fff';
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bgColor }, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} />
      ) : (
        <Text style={[styles.txt, { color: txtColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginVertical: 6 },
  txt: { fontWeight: '700', fontSize: 16 },
});

export default Button;
