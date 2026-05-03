import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../theme';

const SalesScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Sales</Text>
    <Text style={styles.body}>Sales tracking is ready in the new React Native frontend.</Text>
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

export default SalesScreen;
