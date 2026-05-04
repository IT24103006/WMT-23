import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { reportService, notificationService } from '../../services/api';

const GREEN = '#2ecc71';

const StatCard = ({ label, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color || GREEN }]}>
    <Ionicons name={icon} size={24} color={color || GREEN} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, nRes] = await Promise.all([
        reportService.getSummary({}),
        notificationService.getAll(),
      ]);
      setSummary(sRes.data.summary);
      setUnread(nRes.data.data.filter((n) => !n.isRead).length);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Here's your business overview</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
          <Ionicons name="person-circle-outline" size={40} color={GREEN} />
        </TouchableOpacity>
      </View>

      {unread > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications" size={18} color="#fff" />
          <Text style={styles.alertText}>{unread} unread notification{unread > 1 ? 's' : ''}</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>📊 Today's Summary</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Total Sales" value={fmt(summary?.totalSales)} icon="cart-outline" />
        <StatCard label="Collected" value={fmt(summary?.totalCollected)} icon="cash-outline" color="#27ae60" />
        <StatCard label="Outstanding" value={fmt(summary?.totalDue)} icon="alert-circle-outline" color="#e74c3c" />
        <StatCard label="Customers" value={summary?.totalCustomers || 0} icon="people-outline" color="#3498db" />
        <StatCard label="Total Credit" value={fmt(summary?.totalCredit)} icon="card-outline" color="#e67e22" />
        <StatCard label="Low Stock" value={summary?.lowStockCount || 0} icon="warning-outline" color="#e74c3c" />
      </View>

      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {[
          { label: 'New Sale', icon: 'add-circle', screen: 'AddSale' },
          { label: 'Products', icon: 'cube', screen: 'Products' },
          { label: 'Customers', icon: 'people', screen: 'Customers' },
          { label: 'Reports', icon: 'bar-chart', screen: 'Reports' },
        ].map((a) => (
          <TouchableOpacity key={a.screen} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen)}>
            <Ionicons name={a.icon} size={28} color={GREEN} />
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#333' },
  subGreeting: { fontSize: 13, color: '#888', marginTop: 2 },
  avatarBtn: { padding: 4 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', margin: 16, borderRadius: 10, padding: 12, gap: 8 },
  alertText: { flex: 1, color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginLeft: 16, marginTop: 20, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  statCard: {
    width: '44%', margin: '3%', backgroundColor: '#fff', borderRadius: 12,
    padding: 14, borderLeftWidth: 4, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#333', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginBottom: 30 },
  actionBtn: {
    width: '44%', margin: '3%', backgroundColor: '#fff', borderRadius: 12,
    padding: 18, alignItems: 'center', shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 6 },
});