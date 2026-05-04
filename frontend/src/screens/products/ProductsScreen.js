import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../../services/api';

const GREEN = '#2ecc71';

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await productService.getAll();
      setProducts(data.products || data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p._id !== id));
          } catch { Alert.alert('Error', 'Delete failed'); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image?.url ? (
        <Image source={{ uri: item.image.url }} style={styles.img} />
      ) : (
        <View style={styles.imgPlaceholder}><Ionicons name="cube-outline" size={30} color="#ccc" /></View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>LKR {item.price?.toFixed(2)}</Text>
        <Text style={styles.qty}>Stock: {item.quantity}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { product: item })}>
          <Ionicons name="pencil-outline" size={22} color={GREEN} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginTop: 10 }}>
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={GREEN} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} colors={[GREEN]} />}
        ListEmptyComponent={<Text style={styles.empty}>No products yet. Add one!</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ProductForm', {})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  img: { width: 70, height: 70, borderRadius: 8 },
  imgPlaceholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#333' },
  price: { fontSize: 14, color: GREEN, fontWeight: '600', marginTop: 2 },
  qty: { fontSize: 13, color: '#888', marginTop: 2 },
  actions: { justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: GREEN, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
