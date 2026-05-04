import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CB</Text>
          </View>
          <Text style={styles.title}>ClickBuy</Text>
          <Text style={styles.subtitle}>Customer Credit Management</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title="Login" onPress={handleLogin} loading={loading} style={styles.loginBtn} />
          <Button
            title="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logo: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#2ecc71',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '800', color: '#2ecc71' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  form: { flex: 1 },
  loginBtn: { marginTop: 12 },
});