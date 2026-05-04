import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, RefreshControl, Image, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { reportService, salesService } from '../../services/api';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';

export default function ReportsScreen() {
  const [reports, setReports]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [image, setImage]           = useState(null);
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState('custom');
  const [creating, setCreating]     = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(null); // report _id being generated

  // Per-sale report state
  const [saleReportId, setSaleReportId] = useState(null);
  const [saleDesc, setSaleDesc]         = useState('');
  const [saleImage, setSaleImage]       = useState(null);
  const [savingSale, setSavingSale]     = useState(false);

  // ── Fetch — runs every time screen comes into focus ──────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [rRes, sRes, salesRes] = await Promise.all([
        reportService.getAll(),
        reportService.getSummary(),
        salesService.getAll(),
      ]);
      if (rRes.data.success)    setReports(rRes.data.data || []);
      if (sRes.data.success)    setSummary(sRes.data.summary);
      if (salesRes.data.success) setSales(salesRes.data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 🔑 useFocusEffect so KPIs refresh whenever user navigates back here
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll])
  );

  // ── Create report ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Report title is required');
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', reportType);
      formData.append('description', description);
      if (image) {
        formData.append('image', { uri: image.uri, type: 'image/jpeg', name: 'report.jpg' });
      }
      const { data } = await reportService.create(formData);
      if (data.success) {
        setReports(prev => [data.data, ...prev]);
        // Refresh KPIs immediately after creating
        const sRes = await reportService.getSummary();
        if (sRes.data.success) setSummary(sRes.data.summary);
        setShowCreate(false);
        setImage(null);
        setTitle('');
        setDescription('');
      }
    } catch {
      Alert.alert('Error', 'Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  // ── Save per-sale report ──────────────────────────────────────────────────
  const handleSaveSaleReport = async (saleId) => {
    if (!saleDesc.trim() && !saleImage) {
      return Alert.alert('Validation', 'Add a description or image for this sale report');
    }
    try {
      setSavingSale(true);
      const formData = new FormData();
      formData.append('title', `Sale Report - ${new Date().toLocaleDateString()}`);
      formData.append('type', 'sales');
      formData.append('description', saleDesc);
      formData.append('saleRef', saleId);
      if (saleImage) {
        formData.append('image', { uri: saleImage.uri, type: 'image/jpeg', name: 'sale_report.jpg' });
      }
      const { data } = await reportService.create(formData);
      if (data.success) {
        setReports(prev => [data.data, ...prev]);
        setSaleReportId(null);
        setSaleDesc('');
        setSaleImage(null);
        Alert.alert('Saved', 'Sale report saved!');
      }
    } catch {
      Alert.alert('Error', 'Failed to save sale report');
    } finally {
      setSavingSale(false);
    }
  };

  // ── Delete report ─────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    Alert.alert('Delete Report', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await reportService.delete(id);
            setReports(prev => prev.filter(r => r._id !== id));
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  // ── Generate & share PDF for a report ────────────────────────────────────
  const handleDownloadPdf = async (report) => {
    setGeneratingPdf(report._id);
    try {
      const html = buildReportHtml(report, summary);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${report.title}.pdf` });
      } else {
        Alert.alert('Saved', `PDF saved to: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const fmt = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

  // ── KPI Summary card ──────────────────────────────────────────────────────
  const SummaryCard = ({ icon, label, value, color }) => (
    <View style={[styles.summaryCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );

  // ── Render saved report card ──────────────────────────────────────────────
  const renderReport = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportRow}>
        {item.image?.url ? (
          <Image source={{ uri: item.image.url }} style={styles.reportImg} />
        ) : (
          <View style={[styles.reportImg, styles.noImg]}>
            <Ionicons name="bar-chart" size={28} color="#ccc" />
          </View>
        )}
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <Text style={styles.reportMeta}>{item.type} • {new Date(item.createdAt).toLocaleDateString()}</Text>
          {item.description ? <Text style={styles.reportDesc}>{item.description}</Text> : null}
          {item.summary?.totalSales != null && (
            <Text style={styles.reportStat}>Sales: {fmt(item.summary.totalSales)}</Text>
          )}
        </View>
        <View style={styles.reportActions}>
          {/* PDF download button */}
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => handleDownloadPdf(item)}
            disabled={generatingPdf === item._id}
          >
            {generatingPdf === item._id
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="document-text-outline" size={13} color="#fff" /><Text style={styles.pdfBtnTxt}> PDF</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginTop: 6 }}>
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ── Render per-sale row ───────────────────────────────────────────────────
  const renderSale = ({ item }) => {
    const isOpen = saleReportId === item._id;
    return (
      <View style={styles.saleCard}>
        <TouchableOpacity
          style={styles.saleHeader}
          onPress={() => {
            setSaleReportId(isOpen ? null : item._id);
            setSaleDesc('');
            setSaleImage(null);
          }}
        >
          <View style={styles.saleInfo}>
            <Text style={styles.saleName}>{item.customer?.name || 'Walk-in Customer'}</Text>
            <Text style={styles.saleMeta}>
              {new Date(item.date || item.createdAt).toLocaleDateString()} • {fmt(item.totalAmount)}
            </Text>
            <Text style={[styles.saleStatus, { color: item.status === 'paid' ? GREEN : item.status === 'partial' ? '#e67e22' : '#e74c3c' }]}>
              {item.status?.toUpperCase()} • Due: {fmt(item.dueAmount)}
            </Text>
          </View>
          <Ionicons name={isOpen ? 'chevron-up' : 'add-circle-outline'} size={22} color={GREEN} />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.saleForm}>
            <Text style={styles.formLabel}>Description / Notes</Text>
            <TextInput
              style={styles.textArea}
              value={saleDesc}
              onChangeText={setSaleDesc}
              placeholder="Add notes about this sale..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#aaa"
            />
            <Text style={styles.formLabel}>Attach Image (optional)</Text>
            <ImageUpload
              imageUri={saleImage?.uri}
              onImageSelected={setSaleImage}
              onRemove={() => setSaleImage(null)}
              label="Sale Receipt / Photo"
            />
            <Button
              title={savingSale ? 'Saving...' : 'Save Sale Report'}
              onPress={() => handleSaveSaleReport(item._id)}
              disabled={savingSale}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={i => i._id}
        renderItem={renderReport}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            tintColor={GREEN}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            {/* ── KPI Summary ── */}
            {summary && (
              <View>
                <Text style={styles.sectionTitle}>📊 Summary Overview</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <SummaryCard icon="receipt"  label="Total Revenue"   value={fmt(summary.totalSales)}    color={GREEN} />
                  <SummaryCard icon="cart"     label="Transactions"    value={summary.saleCount || 0}     color="#3498db" />
                  <SummaryCard icon="people"   label="Customers"       value={summary.totalCustomers || 0} color="#9b59b6" />
                  <SummaryCard icon="cash"     label="Collected"       value={fmt(summary.totalCollected)} color="#27ae60" />
                  <SummaryCard icon="warning"  label="Outstanding Due" value={fmt(summary.totalDue)}      color="#e74c3c" />
                  <SummaryCard icon="cube"     label="Low Stock Items" value={summary.lowStockCount || 0}  color="#e67e22" />
                </ScrollView>
              </View>
            )}

            {/* ── Past Sales — per-sale reports ── */}
            <Text style={styles.sectionTitle}>🛒 Past Sales — Add Report</Text>
            {sales.length === 0 ? (
              <Text style={styles.emptySubText}>No sales found</Text>
            ) : (
              sales.map(sale => (
                <View key={sale._id}>{renderSale({ item: sale })}</View>
              ))
            )}

            {/* ── Saved Reports header ── */}
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>📁 Saved Reports</Text>
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: showCreate ? '#e74c3c' : GREEN }]}
                onPress={() => setShowCreate(v => !v)}
              >
                <Text style={styles.uploadBtnText}>{showCreate ? 'Cancel' : '+ New Report'}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Create report form ── */}
            {showCreate && (
              <View style={styles.createBox}>
                <Text style={styles.createTitle}>Create New Report</Text>

                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.inputField}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Report title..."
                  placeholderTextColor="#aaa"
                />

                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeRow}>
                  {['custom', 'sales', 'stock', 'customer_balance'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, reportType === t && styles.typeChipActive]}
                      onPress={() => setReportType(t)}
                    >
                      <Text style={[styles.typeChipText, reportType === t && styles.typeChipTextActive]}>
                        {t.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add report notes or summary..."
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#aaa"
                />

                <Text style={styles.formLabel}>Attach Image (optional)</Text>
                <ImageUpload
                  imageUri={image?.uri}
                  onImageSelected={setImage}
                  onRemove={() => setImage(null)}
                  label="Report Image"
                />

                <Button
                  title={creating ? 'Saving...' : 'Save Report'}
                  onPress={handleCreate}
                  disabled={creating}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No saved reports yet</Text>
            <Text style={styles.emptySubText}>Create a report or add notes to a sale above</Text>
          </View>
        }
      />
    </View>
  );
}

// ── HTML template for PDF ─────────────────────────────────────────────────
function buildReportHtml(report, summary) {
  const fmt = (n) => `LKR ${Number(n || 0).toLocaleString()}`;
  const summaryRows = summary ? `
    <tr><td>Total Revenue</td><td>${fmt(summary.totalSales)}</td></tr>
    <tr><td>Total Collected</td><td>${fmt(summary.totalCollected)}</td></tr>
    <tr><td>Outstanding Due</td><td>${fmt(summary.totalDue)}</td></tr>
    <tr><td>Total Customers</td><td>${summary.totalCustomers ?? '-'}</td></tr>
    <tr><td>Low Stock Items</td><td>${summary.lowStockCount ?? '-'}</td></tr>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
  h1 { color: #2ecc71; margin-bottom: 4px; }
  .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
  .badge { display:inline-block; background:#eafaf1; color:#2ecc71; padding:3px 12px; border-radius:20px; font-size:12px; font-weight:700; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #2ecc71; color: #fff; padding: 10px 14px; text-align: left; font-size: 13px; }
  td { padding: 9px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .desc { background: #f8f8f8; border-left: 3px solid #2ecc71; padding: 12px 16px; border-radius: 4px; font-size: 14px; line-height:1.6; margin-top:16px; }
  .footer { margin-top: 40px; color: #aaa; font-size: 11px; text-align: center; }
  .logo { font-size: 28px; font-weight: 900; color: #2ecc71; letter-spacing: -1px; }
</style>
</head>
<body>
  <div class="logo">ClickBuy</div>
  <h1>${report.title}</h1>
  <p class="meta">
    <span class="badge">${report.type}</span>
    &nbsp;&nbsp;Generated: ${new Date().toLocaleString()}
    &nbsp;&nbsp;Period: ${report.period?.startDate ? new Date(report.period.startDate).toLocaleDateString() : 'All time'}
    ${report.period?.endDate ? ' — ' + new Date(report.period.endDate).toLocaleDateString() : ''}
  </p>

  ${report.description ? `<div class="desc">${report.description}</div>` : ''}

  ${report.summary?.totalSales != null ? `
  <table>
    <tr><th colspan="2">Report Summary</th></tr>
    <tr><td>Total Sales Value</td><td>${fmt(report.summary.totalSales)}</td></tr>
    <tr><td>Amount Collected</td><td>${fmt(report.summary.totalCollected)}</td></tr>
    <tr><td>Amount Due</td><td>${fmt(report.summary.totalDue)}</td></tr>
    <tr><td>Number of Transactions</td><td>${report.summary.saleCount ?? '-'}</td></tr>
  </table>` : ''}

  ${summaryRows ? `
  <table style="margin-top:24px">
    <tr><th colspan="2">Business Overview (Current)</th></tr>
    ${summaryRows}
  </table>` : ''}

  <div class="footer">ClickBuy — Confidential Report • ${new Date().toLocaleDateString()}</div>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10, marginTop: 8 },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginRight: 10,
    alignItems: 'center', width: 140, elevation: 2, borderTopWidth: 3,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#222', marginTop: 6 },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 16 },
  uploadBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  createBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  createTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  formLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 12, marginBottom: 4 },
  inputField: {
    backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0',
    padding: 12, fontSize: 14, color: '#333',
  },
  textArea: {
    backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0',
    padding: 12, fontSize: 14, color: '#333', minHeight: 80, textAlignVertical: 'top',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  typeChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  reportCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  reportRow: { flexDirection: 'row', alignItems: 'center' },
  reportImg: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  noImg: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  reportMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  reportDesc: { fontSize: 13, color: '#555', marginTop: 4, fontStyle: 'italic' },
  reportStat: { fontSize: 13, color: GREEN, fontWeight: '600', marginTop: 4 },
  reportActions: { alignItems: 'center', justifyContent: 'center' },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  pdfBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  saleCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 2, overflow: 'hidden' },
  saleHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  saleInfo: { flex: 1 },
  saleName: { fontSize: 14, fontWeight: '700', color: '#222' },
  saleMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  saleStatus: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  saleForm: { borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 14, backgroundColor: '#fafafa' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#ccc', marginTop: 4 },
});