import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { salesService } from '../../services/api';

const GREEN = '#2ecc71';
const STATUS_COLOR = { paid: GREEN, partial: '#e67e22', credit: '#e74c3c' };

export default function SalesScreen({ navigation }) {
  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printingId, setPrintingId] = useState(null); // which sale is generating PDF

  const fetchSales = async () => {
    try {
      const { data } = await salesService.getAll();
      setSales(data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load sales');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchSales(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Sale', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await salesService.delete(id);
            setSales(prev => prev.filter(s => s._id !== id));
          } catch { Alert.alert('Error', 'Delete failed'); }
        },
      },
    ]);
  };

  // ── Generate & share receipt PDF ─────────────────────────────────────────
  const handleReceipt = async (sale) => {
    setPrintingId(sale._id);
    try {
      const html = buildReceiptHtml(sale);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt_${sale._id.slice(-6).toUpperCase()}.pdf`,
        });
      } else {
        Alert.alert('Saved', `Receipt saved to: ${uri}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to generate receipt');
    } finally {
      setPrintingId(null);
    }
  };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
          <Text style={[styles.statusTxt, { color: STATUS_COLOR[item.status] }]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.receiptId}>#{item._id?.slice(-6).toUpperCase()}</Text>
      </View>

      {/* Customer */}
      {item.customer && (
        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={14} color="#888" />
          <Text style={styles.customerName}> {item.customer?.name || 'Walk-in'}</Text>
        </View>
      )}

      {/* Items list */}
      <View style={styles.itemsList}>
        {(item.items || []).slice(0, 3).map((si, idx) => (
          <Text key={idx} style={styles.saleItem}>
            • {si.name} × {si.quantity} = {fmt(si.subtotal)}
          </Text>
        ))}
        {item.items?.length > 3 && (
          <Text style={styles.saleItem}>+{item.items.length - 3} more items</Text>
        )}
      </View>

      {/* Footer: totals + actions */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(item.totalAmount)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.paidLabel}>Paid: {fmt(item.paidAmount)}</Text>
          {item.dueAmount > 0 && (
            <Text style={styles.dueLabel}>Due: {fmt(item.dueAmount)}</Text>
          )}
        </View>
        <View style={styles.btnGroup}>
          {/* Receipt PDF button */}
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={() => handleReceipt(item)}
            disabled={printingId === item._id}
          >
            {printingId === item._id
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="receipt-outline" size={13} color="#fff" />
                  <Text style={styles.receiptBtnTxt}> Receipt</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginTop: 6 }}>
            <Ionicons name="trash-outline" size={22} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>

      {item.image?.url && (
        <View style={styles.attachedRow}>
          <Ionicons name="image-outline" size={14} color="#888" />
          <Text style={styles.attachedTxt}> Receipt image attached</Text>
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={GREEN} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSales(); }}
            colors={[GREEN]}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No sales yet. Create one!</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SaleForm')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Receipt HTML template ─────────────────────────────────────────────────
function buildReceiptHtml(sale) {
  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
  const receiptNo = sale._id?.slice(-8).toUpperCase();
  const date = new Date(sale.date || sale.createdAt).toLocaleString();
  const statusColor = sale.status === 'paid' ? '#2ecc71' : sale.status === 'partial' ? '#e67e22' : '#e74c3c';

  const itemRows = (sale.items || []).map(item => `
    <tr>
      <td>${item.name || '-'}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmt(item.price)}</td>
      <td style="text-align:right"><strong>${fmt(item.subtotal)}</strong></td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 40px; color: #222; max-width: 520px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 28px; }
  .logo { font-size: 32px; font-weight: 900; color: #2ecc71; letter-spacing: -1px; }
  .tagline { color: #888; font-size: 12px; margin-top: 2px; }
  .divider { border: none; border-top: 2px dashed #e0e0e0; margin: 18px 0; }
  .receipt-no { display:flex; justify-content:space-between; font-size:13px; color:#555; margin-bottom: 6px; }
  .customer-box { background: #f8f8f8; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; }
  .customer-box strong { display:block; font-size:15px; color:#333; margin-bottom:4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead th { background: #2ecc71; color: #fff; padding: 9px 10px; font-size: 12px; text-align: left; }
  thead th:nth-child(2), thead th:nth-child(3), thead th:nth-child(4) { text-align:right; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  tfoot td { padding: 8px 10px; font-size: 13px; }
  .total-row td { background: #f8f8f8; font-weight: 700; font-size: 14px; padding: 10px; }
  .status-badge {
    display: inline-block; padding: 4px 16px; border-radius: 20px;
    font-weight: 700; font-size: 13px; letter-spacing: 0.5px;
    background: ${statusColor}22; color: ${statusColor};
    border: 1px solid ${statusColor};
  }
  .totals-section { margin-top: 16px; }
  .totals-row { display:flex; justify-content:space-between; padding: 5px 0; font-size:14px; }
  .totals-row.grand { font-weight:800; font-size:16px; border-top:2px solid #333; margin-top:6px; padding-top:8px; }
  .footer { text-align:center; margin-top:32px; color:#aaa; font-size:11px; line-height:1.8; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">ClickBuy</div>
    <div class="tagline">Customer Credit Management System</div>
  </div>

  <div class="receipt-no">
    <span><strong>Receipt #</strong> ${receiptNo}</span>
    <span class="status-badge">${sale.status?.toUpperCase()}</span>
  </div>
  <div class="receipt-no">
    <span><strong>Date:</strong> ${date}</span>
  </div>

  ${sale.customer ? `
  <div class="customer-box">
    <strong>${sale.customer.name || ''}</strong>
    ${sale.customer.phone ? `📞 ${sale.customer.phone}` : ''}
    ${sale.customer.email ? `&nbsp;&nbsp;✉ ${sale.customer.email}` : ''}
  </div>` : `<div class="customer-box"><strong>Walk-in Customer</strong></div>`}

  <hr class="divider"/>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider"/>

  <div class="totals-section">
    <div class="totals-row"><span>Subtotal</span><span>${fmt(sale.totalAmount)}</span></div>
    <div class="totals-row" style="color:#2ecc71"><span>Paid</span><span>${fmt(sale.paidAmount)}</span></div>
    ${sale.dueAmount > 0 ? `<div class="totals-row" style="color:#e74c3c"><span>Due</span><span>${fmt(sale.dueAmount)}</span></div>` : ''}
    <div class="totals-row grand"><span>TOTAL</span><span>${fmt(sale.totalAmount)}</span></div>
  </div>

  <div class="footer">
    Thank you for your business!<br/>
    ClickBuy — ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: '#888' },
  receiptId: { fontSize: 11, color: '#bbb', fontWeight: '600' },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 13, color: '#555', fontWeight: '600' },
  itemsList: { marginBottom: 8 },
  saleItem: { fontSize: 13, color: '#666', marginBottom: 2 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10,
  },
  totalLabel: { fontSize: 11, color: '#888' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#333' },
  paidLabel: { fontSize: 12, color: GREEN, fontWeight: '600' },
  dueLabel: { fontSize: 12, color: '#e74c3c', fontWeight: '600' },
  btnGroup: { alignItems: 'center' },
  receiptBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498db',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  receiptBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  attachedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  attachedTxt: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    backgroundColor: GREEN, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
});