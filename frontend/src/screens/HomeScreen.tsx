import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {colors} from '../theme';

const HomeScreen: React.FC = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Home</Text>
    <Text style={styles.body}>
      Welcome to the React Native version of the frontend. This app has been converted from the previous Flutter/Dart source and now runs as a native React Native app.
    </Text>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});

export default HomeScreen;
