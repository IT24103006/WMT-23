import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../theme';

const AccountScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Account</Text>
    <Text style={styles.body}>Account and profile management are now in React Native.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AccountScreen;
