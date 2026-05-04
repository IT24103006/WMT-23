import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supplierService } from '../../services/api';
import Button from '../../components/Button';

const GREEN = '#2ecc71';
const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

export default function SupplierDetailScreen({ route, navigation }) {
  const { supplier: initial } = route.params;
  const [supplier, setSupplier] = useState(initial);
  const [loading, setLoading] = useState(false);

  // Purchase modal state
  const [showPurchase, setShowPurchase] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [purchaseNote, setPurchaseNote] = useState('');
  const [savingPurchase, setSavingPurchase] = useState(false);

  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supplierService.getOne(initial._id);
      if (data.success) setSupplier(data.data);
    } catch {
      Alert.alert('Error', 'Failed to refresh');
    } finally { setLoading(false); }
  }, [initial._id]);

  useFocusEffect(refresh);

  // ── Validate & record purchase ─────────────────────────────────────────
  const handleAddPurchase = async () => {
    if (!itemName.trim()) { Alert.alert('Validation', 'Item name is required'); return; }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1) {
      Alert.alert('Validation', 'Quantity must be at least 1'); return;
    }
    if (!Number.isInteger(Number(quantity))) {
      Alert.alert('Validation', 'Quantity must be a whole number'); return;
    }
    if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
      Alert.alert('Validation', 'Unit price must be 0 or more'); return;
    }

    setSavingPurchase(true);
    try {
      const { data } = await supplierService.addPurchase(supplier._id, {
        itemName: itemName.trim(),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        note: purchaseNote,
      });
      if (data.success) {
        setSupplier(data.data);
        setShowPurchase(false);
        setItemName(''); setQuantity(''); setUnitPrice(''); setPurchaseNote('');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally { setSavingPurchase(false); }
  };

  // ── Validate & record payment ──────────────────────────────────────────
  const handleAddPayment = async () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      Alert.alert('Validation', 'Amount must be greater than 0'); return;
    }
    if (Number(payAmount) > supplier.debtBalance) {
      Alert.alert('Validation', `Cannot exceed current debt (${fmt(supplier.debtBalance)})`); return;
    }

    setSavingPayment(true);
    try {
      const { data } = await supplierService.addPayment(supplier._id, {
        amount: Number(payAmount),
        note: payNote,
      });
      if (data.success) {
        setSupplier(data.data);
        setShowPayment(false);
        setPayAmount(''); setPayNote('');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally { setSavingPayment(false); }
  };

  if (loading && !supplier) return <ActivityIndicator style={{ flex: 1 }} size="large" color={GREEN} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header card */}
      <View style={styles.card}>
        {supplier.image?.url ? (
          <Image source={{ uri: supplier.image.url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="business-outline" size={40} color="#ccc" />
          </View>
        )}
        <Text style={styles.supplierName}>{supplier.name}</Text>
        {supplier.company ? <Text style={styles.meta}>{supplier.company}</Text> : null}
        {supplier.phone ? <Text style={styles.meta}><Ionicons name="call-outline" size={13} /> {supplier.phone}</Text> : null}
        {supplier.email ? <Text style={styles.meta}><Ionicons name="mail-outline" size={13} /> {supplier.email}</Text> : null}
        {supplier.address ? <Text style={styles.meta}><Ionicons name="location-outline" size={13} /> {supplier.address}</Text> : null}

        <View style={styles.debtBox}>
          <Text style={styles.debtLabel}>Outstanding Debt</Text>
          <Text style={[styles.debtValue, { color: supplier.debtBalance > 0 ? '#e74c3c' : GREEN }]}>
            {fmt(supplier.debtBalance)}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3498db' }]} onPress={() => setShowPurchase(true)}>
            <Ionicons name="cart-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnTxt}>Record Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: GREEN, opacity: supplier.debtBalance <= 0 ? 0.4 : 1 }]}
            onPress={() => supplier.debtBalance > 0 && setShowPayment(true)}
            disabled={supplier.debtBalance <= 0}
          >
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnTxt}>Pay Supplier</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('SupplierForm', { supplier })}
        >
          <Ionicons name="pencil-outline" size={14} color={GREEN} />
          <Text style={{ color: GREEN, marginLeft: 4, fontSize: 13 }}>Edit Supplier</Text>
        </TouchableOpacity>
      </View>

      {/* Purchase history */}
      <Text style={styles.sectionTitle}>Purchase History ({supplier.purchases?.length || 0})</Text>
      {(supplier.purchases || []).slice().reverse().map((p, i) => (
        <View key={i} style={styles.historyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyItem}>{p.itemName}</Text>
            <Text style={styles.historyMeta}>Qty: {p.quantity}  ×  {fmt(p.unitPrice)}</Text>
            {p.note ? <Text style={styles.historyNote}>{p.note}</Text> : null}
            <Text style={styles.historyDate}>{new Date(p.date).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.historyTotal}>{fmt(p.totalPrice)}</Text>
        </View>
      ))}
      {(!supplier.purchases || supplier.purchases.length === 0) && (
        <Text style={styles.empty}>No purchases recorded yet.</Text>
      )}

      {/* ── Purchase Modal ── */}
      <Modal visible={showPurchase} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Purchase</Text>
            <Text style={styles.fieldLabel}>Item Name *</Text>
            <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="Item name" />
            <Text style={styles.fieldLabel}>Quantity *</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="e.g. 50" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Unit Price (LKR) *</Text>
            <TextInput style={styles.input} value={unitPrice} onChangeText={setUnitPrice} placeholder="0.00" keyboardType="numeric" />
            {quantity && unitPrice && !isNaN(Number(quantity)) && !isNaN(Number(unitPrice)) && (
              <Text style={styles.totalPreview}>Total: {fmt(Number(quantity) * Number(unitPrice))}</Text>
            )}
            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput style={styles.input} value={purchaseNote} onChangeText={setPurchaseNote} placeholder="Optional note" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPurchase(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPurchase} disabled={savingPurchase}>
                <Text style={{ color: '#fff' }}>{savingPurchase ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Pay Supplier</Text>
            <Text style={styles.debtHint}>Outstanding: {fmt(supplier.debtBalance)}</Text>
            <Text style={styles.fieldLabel}>Amount *</Text>
            <TextInput style={styles.input} value={payAmount} onChangeText={setPayAmount} placeholder="0.00" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput style={styles.input} value={payNote} onChangeText={setPayNote} placeholder="Optional note" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayment(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: GREEN }]} onPress={handleAddPayment} disabled={savingPayment}>
                <Text style={{ color: '#fff' }}>{savingPayment ? 'Saving...' : 'Pay'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, alignItems: 'center', elevation: 2 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  supplierName: { fontSize: 20, fontWeight: '800', color: '#333' },
  meta: { fontSize: 13, color: '#777', marginTop: 4 },
  debtBox: { marginTop: 14, alignItems: 'center' },
  debtLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
  debtValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  btnRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, gap: 6 },
  actionBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 8 },
  historyCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  historyItem: { fontSize: 14, fontWeight: '700', color: '#333' },
  historyMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  historyNote: { fontSize: 12, color: '#aaa', fontStyle: 'italic', marginTop: 2 },
  historyDate: { fontSize: 11, color: '#bbb', marginTop: 2 },
  historyTotal: { fontSize: 15, fontWeight: '800', color: '#333' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#333', marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14 },
  totalPreview: { fontSize: 14, color: '#2ecc71', fontWeight: '700', marginTop: 6 },
  debtHint: { fontSize: 13, color: '#e74c3c', fontWeight: '600', marginBottom: 4 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#3498db' },
});