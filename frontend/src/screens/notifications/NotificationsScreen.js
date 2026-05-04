import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, RefreshControl, Image, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/api';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';
const TYPES = { due_payment: 'Due Payment', low_stock: 'Low Stock', general: 'General' };
const TYPE_ICONS = { due_payment: 'card', low_stock: 'cube', general: 'information-circle' };

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [image, setImage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const { data } = await notificationService.getAll();
      if (data.success) setNotifications(data.data || data.notifications || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { data } = await notificationService.generate();
      if (data.success) {
        Alert.alert('Done', `Generated ${data.generated?.length || 0} notification(s)`);
        fetch();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate notifications');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Title is required');
    if (!message.trim()) return Alert.alert('Validation', 'Message is required');
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('message', message.trim());
      formData.append('type', type);
      if (image) {
        formData.append('image', { uri: image.uri, type: 'image/jpeg', name: 'notification.jpg' });
      }
      const { data } = await notificationService.create(formData);
      if (data.success) {
        setNotifications(prev => [data.data, ...prev]);
        setShowCreate(false);
        setTitle('');
        setMessage('');
        setType('general');
        setImage(null);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create notification');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.isRead && styles.unread]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: item.isRead ? '#eee' : '#d5f5e3' }]}>
          <Ionicons name={TYPE_ICONS[item.type] || 'notifications'} size={22} color={GREEN} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.meta}>{TYPES[item.type]} • {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        {item.image?.url && (
          <Image source={{ uri: item.image.url }} style={styles.thumb} />
        )}
      </View>
      <View style={styles.actions}>
        {!item.isRead && (
          <TouchableOpacity onPress={() => handleMarkRead(item._id)} style={styles.actionBtn}>
            <Ionicons name="checkmark-circle-outline" size={18} color={GREEN} />
            <Text style={[styles.actionText, { color: GREEN }]}>Mark Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
          <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={GREEN} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Button
          title={generating ? 'Generating...' : '⚡ Auto-Generate'}
          onPress={handleGenerate}
          style={styles.genBtn}
        />
        <Button
          title={showCreate ? 'Cancel' : '+ Add'}
          onPress={() => setShowCreate(v => !v)}
          style={[styles.genBtn, { backgroundColor: showCreate ? '#e74c3c' : GREEN }]}
        />
      </View>

      {showCreate && (
        <View style={styles.createBox}>
          <Text style={styles.createTitle}>Create Notification</Text>

          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.inputField}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title..."
            placeholderTextColor="#aaa"
          />

          <Text style={styles.fieldLabel}>Message *</Text>
          <TextInput
            style={styles.textArea}
            value={message}
            onChangeText={setMessage}
            placeholder="Write the notification message..."
            multiline
            numberOfLines={3}
            placeholderTextColor="#aaa"
          />

          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {Object.keys(TYPES).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                  {TYPES[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Image (optional)</Text>
          <ImageUpload
            imageUri={image?.uri}
            onImageSelected={setImage}
            onRemove={() => setImage(null)}
            label="Upload Image"
          />

          <Button
            title={creating ? 'Creating...' : 'Create Notification'}
            onPress={handleCreate}
            disabled={creating}
            style={{ marginTop: 10 }}
          />
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={GREEN} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  genBtn: { flex: 1 },
  createBox: { margin: 12, padding: 16, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  createTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 10, marginBottom: 4 },
  inputField: {
    backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0',
    padding: 12, fontSize: 14, color: '#333',
  },
  textArea: {
    backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0',
    padding: 12, fontSize: 14, color: '#333', minHeight: 80, textAlignVertical: 'top',
  },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd',
  },
  typeChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  unread: { borderLeftWidth: 4, borderLeftColor: GREEN },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#222' },
  messageText: { fontSize: 13, color: '#555', marginTop: 2 },
  meta: { fontSize: 11, color: '#999', marginTop: 4 },
  thumb: { width: 50, height: 50, borderRadius: 8, marginLeft: 8 },
  actions: { flexDirection: 'row', marginTop: 10, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12 },
});