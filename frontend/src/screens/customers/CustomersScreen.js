import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '../../services/api';

const GREEN = '#2ecc71';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data } = await customerService.getAll();
      setCustomers(data.customers || data.data || []);
    } catch { Alert.alert('Error', 'Failed to load customers'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchCustomers(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Customer', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await customerService.delete(id); setCustomers(p => p.filter(c => c._id !== id)); }
          catch { Alert.alert('Error', 'Delete failed'); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CustomerDetail', { customer: item })}>
      {item.image?.url ? (
        <Image source={{ uri: item.image.url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}><Ionicons name="person" size={28} color="#ccc" /></View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone || 'No phone'}</Text>
        <Text style={[styles.balance, { color: item.creditBalance > 0 ? '#e74c3c' : GREEN }]}>
          Due: LKR {(item.creditBalance || 0).toFixed(2)}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerForm', { customer: item })}>
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
        data={customers}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCustomers(); }} colors={[GREEN]} />}
        ListEmptyComponent={<Text style={styles.empty}>No customers yet.</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CustomerForm', {})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#333' },
  phone: { fontSize: 13, color: '#888', marginTop: 2 },
  balance: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  actions: { justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: GREEN, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
