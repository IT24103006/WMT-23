import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '../../services/api';

const GREEN = '#2ecc71';

export default function CustomerDetailScreen({ route, navigation }) {
  const { customer: initial } = route.params;
  const [customer, setCustomer]   = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [payModal, setPayModal]   = useState(false);
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await customerService.getOne(initial._id);
      setCustomer(data.data);
    } catch {}
    finally { setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return Alert.alert('Validation', 'Enter a valid amount greater than 0');
    setPayLoading(true);
    try {
      const { data } = await customerService.addPayment(customer._id, { amount: Number(amount), note, type: 'payment' });
      setCustomer(data.data);
      setPayModal(false);
      setAmount('');
      setNote('');
      Alert.alert('Success', 'Payment recorded!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setPayLoading(false); }
  };

  const handleCredit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return Alert.alert('Validation', 'Enter a valid amount greater than 0');
    setPayLoading(true);
    try {
      const { data } = await customerService.addPayment(customer._id, { amount: Number(amount), note, type: 'credit' });
      setCustomer(data.data);
      setPayModal(false);
      setAmount('');
      setNote('');
      Alert.alert('Success', 'Credit added!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally { setPayLoading(false); }
  };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  // ── Derived credit values ─────────────────────────────────────────────────
  const creditLimit      = customer.creditLimit     || 0;
  const outstandingDue   = customer.creditBalance   || 0;  // creditBalance = amount they owe
  const remainingCredit  = Math.max(0, creditLimit - outstandingDue);
  const usagePercent     = creditLimit > 0 ? Math.min(100, (outstandingDue / creditLimit) * 100) : 0;
  const barColor         = usagePercent >= 90 ? '#e74c3c' : usagePercent >= 60 ? '#e67e22' : GREEN;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[GREEN]} />}
    >
      {/* ── Profile header ── */}
      <View style={styles.headerCard}>
        {customer.image?.url ? (
          <Image source={{ uri: customer.image.url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
        )}
        <Text style={styles.name}>{customer.name}</Text>
        {customer.phone  && <Text style={styles.contact}><Ionicons name="call-outline"     size={14} /> {customer.phone}</Text>}
        {customer.email  && <Text style={styles.contact}><Ionicons name="mail-outline"     size={14} /> {customer.email}</Text>}
        {customer.address && <Text style={styles.contact}><Ionicons name="location-outline" size={14} /> {customer.address}</Text>}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('CustomerForm', { customer })}
        >
          <Ionicons name="pencil-outline" size={16} color={GREEN} />
          <Text style={styles.editBtnTxt}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Credit limit section ── */}
      <View style={styles.creditSection}>
        <Text style={styles.creditSectionTitle}>Credit Overview</Text>

        {/* Credit limit row */}
        <View style={styles.creditRow}>
          <View style={styles.creditItem}>
            <Text style={styles.creditItemLabel}>Credit Limit</Text>
            <Text style={[styles.creditItemValue, { color: '#3498db' }]}>{fmt(creditLimit)}</Text>
          </View>
          <View style={styles.creditDivider} />
          <View style={styles.creditItem}>
            <Text style={styles.creditItemLabel}>Outstanding Due</Text>
            <Text style={[styles.creditItemValue, { color: outstandingDue > 0 ? '#e74c3c' : '#aaa' }]}>
              {fmt(outstandingDue)}
            </Text>
          </View>
        </View>

        {/* Remaining credit — the key new display */}
        <View style={styles.remainingBox}>
          <View style={styles.remainingHeader}>
            <Text style={styles.remainingLabel}>Remaining Credit</Text>
            <Text style={[styles.remainingValue, { color: barColor }]}>{fmt(remainingCredit)}</Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${usagePercent}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={styles.progressCaption}>
            {usagePercent.toFixed(0)}% of credit used
            {usagePercent >= 90 ? '  ⚠️ Near limit' : ''}
          </Text>
        </View>
      </View>

      {/* ── Action button ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GREEN }]} onPress={() => setPayModal(true)}>
          <Ionicons name="cash-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnTxt}>Record Transaction</Text>
        </TouchableOpacity>
      </View>

      {/* ── Transaction history ── */}
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {customer.payments && customer.payments.length > 0 ? (
        [...customer.payments].reverse().map((p, i) => (
          <View key={i} style={styles.payRow}>
            <View style={[styles.payIcon, { backgroundColor: p.type === 'credit' ? '#fdecea' : '#eafaf1' }]}>
              <Ionicons
                name={p.type === 'credit' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={22}
                color={p.type === 'credit' ? '#e74c3c' : GREEN}
              />
            </View>
            <View style={styles.payInfo}>
              <Text style={styles.payType}>{p.type === 'credit' ? 'Credit Given' : 'Payment Received'}</Text>
              {p.note ? <Text style={styles.payNote}>{p.note}</Text> : null}
              <Text style={styles.payDate}>{new Date(p.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.payAmount, { color: p.type === 'credit' ? '#e74c3c' : GREEN }]}>
              {p.type === 'credit' ? '+' : '-'} {fmt(p.amount)}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No transactions yet.</Text>
      )}

      {/* ── Transaction modal ── */}
      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Transaction</Text>

            {/* Show remaining credit as hint */}
            <View style={styles.modalHint}>
              <Text style={styles.modalHintTxt}>
                Remaining credit: <Text style={{ color: barColor, fontWeight: '700' }}>{fmt(remainingCredit)}</Text>
              </Text>
              <Text style={styles.modalHintTxt}>
                Outstanding due: <Text style={{ color: '#e74c3c', fontWeight: '700' }}>{fmt(outstandingDue)}</Text>
              </Text>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount (LKR)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Note (optional)"
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: GREEN }]}
                onPress={handlePayment}
                disabled={payLoading}
              >
                {payLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnTxt}>Payment Received</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]}
                onPress={handleCredit}
                disabled={payLoading}
              >
                <Text style={styles.modalBtnTxt}>Add Credit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ecf0f1' }]}
                onPress={() => setPayModal(false)}
              >
                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancel</Text>
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

  // Header
  headerCard: { backgroundColor: '#fff', alignItems: 'center', padding: 24, marginBottom: 8, elevation: 2 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: GREEN },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '800', color: '#333', marginTop: 12 },
  contact: { fontSize: 14, color: '#666', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: GREEN },
  editBtnTxt: { color: GREEN, marginLeft: 4, fontWeight: '600' },

  // Credit section
  creditSection: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 14, padding: 16, elevation: 2 },
  creditSectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  creditRow: { flexDirection: 'row', marginBottom: 14 },
  creditItem: { flex: 1, alignItems: 'center' },
  creditItemLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  creditItemValue: { fontSize: 17, fontWeight: '800' },
  creditDivider: { width: 1, backgroundColor: '#f0f0f0', marginHorizontal: 8 },
  remainingBox: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12 },
  remainingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  remainingLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  remainingValue: { fontSize: 17, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#e8e8e8', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressCaption: { fontSize: 11, color: '#aaa' },

  // Actions
  actionsRow: { paddingHorizontal: 12, marginBottom: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, gap: 8 },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // History
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 16, marginTop: 8, marginBottom: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 10, padding: 12, elevation: 1 },
  payIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  payInfo: { flex: 1, paddingHorizontal: 12 },
  payType: { fontSize: 14, fontWeight: '600', color: '#333' },
  payNote: { fontSize: 12, color: '#888', marginTop: 2 },
  payDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  payAmount: { fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 20, marginBottom: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 12, textAlign: 'center' },
  modalHint: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12, marginBottom: 14, gap: 4 },
  modalHintTxt: { fontSize: 13, color: '#555' },
  modalInput: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#333' },
  modalBtns: { gap: 8 },
  modalBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  modalBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});