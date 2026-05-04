import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supplierService } from '../../services/api';

const GREEN = '#2ecc71';

export default function SuppliersScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const { data } = await supplierService.getAll();
      setSuppliers(data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchSuppliers(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Supplier', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await supplierService.delete(id);
            setSuppliers(prev => prev.filter(s => s._id !== id));
          } catch { Alert.alert('Error', 'Delete failed'); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SupplierDetail', { supplier: item })}
    >
      {item.image?.url ? (
        <Image source={{ uri: item.image.url }} style={styles.img} />
      ) : (
        <View style={styles.imgPlaceholder}>
          <Ionicons name="business-outline" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.company ? <Text style={styles.sub}>{item.company}</Text> : null}
        {item.phone ? <Text style={styles.sub}><Ionicons name="call-outline" size={12} /> {item.phone}</Text> : null}
        <Text style={[styles.debt, item.debtBalance > 0 ? styles.debtRed : styles.debtGreen]}>
          Debt: Rs. {(item.debtBalance || 0).toLocaleString()}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('SupplierForm', { supplier: item })}>
          <Ionicons name="pencil-outline" size={22} color={GREEN} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginTop: 10 }}>
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={GREEN} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={suppliers}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSuppliers(); }} colors={[GREEN]} />}
        ListEmptyComponent={<Text style={styles.empty}>No suppliers yet. Add one!</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SupplierForm', {})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
  },
  img: { width: 70, height: 70, borderRadius: 8 },
  imgPlaceholder: {
    width: 70, height: 70, borderRadius: 8,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#333' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  debt: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  debtRed: { color: '#e74c3c' },
  debtGreen: { color: GREEN },
  actions: { justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, backgroundColor: GREEN,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
});