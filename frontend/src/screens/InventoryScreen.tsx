import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../theme';

const InventoryScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Inventory</Text>
    <Text style={styles.body}>Inventory management is now available in the React Native app.</Text>
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

export default InventoryScreen;
