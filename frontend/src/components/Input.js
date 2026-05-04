import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const Input = ({ label, error, style, ...props }) => (
  <View style={[styles.container, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error && styles.errorBorder]}
      placeholderTextColor="#aaa"
      {...props}
    />
    {error && <Text style={styles.errorTxt}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa', color: '#333',
  },
  errorBorder: { borderColor: '#e74c3c' },
  errorTxt: { color: '#e74c3c', fontSize: 12, marginTop: 3 },
});

export default Input;
