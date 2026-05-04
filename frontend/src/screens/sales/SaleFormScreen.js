import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  FlatList, Modal, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { salesService, productService, customerService } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ImageUpload from '../../components/ImageUpload';

const GREEN = '#2ecc71';
const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

export default function SaleFormScreen({ navigation }) {
  const [products, setProducts]             = useState([]);
  const [customers, setCustomers]           = useState([]);
  const [cartItems, setCartItems]           = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paidAmount, setPaidAmount]         = useState('');
  const [imageFile, setImageFile]           = useState(null);
  const [loading, setLoading]               = useState(false);
  const [productModal, setProductModal]     = useState(false);
  const [customerModal, setCustomerModal]   = useState(false);
  const [loadingData, setLoadingData]       = useState(true);
  const [productSearch, setProductSearch]   = useState('');

  // draft quantities inside the modal — keyed by productId
  // value = how many we want to add (0 = not selected)
  const [draftQty, setDraftQty] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([productService.getAll(), customerService.getAll()]);
        setProducts(pRes.data.data || []);
        setCustomers(cRes.data.data || []);
      } catch { Alert.alert('Error', 'Failed to load data'); }
      finally { setLoadingData(false); }
    })();
  }, []);

  // ── Open product modal — pre-fill draft from current cart ────────────────
  const openProductModal = () => {
    const initial = {};
    cartItems.forEach(i => { initial[i.productId] = i.quantity; });
    setDraftQty(initial);
    setProductSearch('');
    setProductModal(true);
  };

  // ── Draft quantity helpers (used inside modal) ────────────────────────────
  const draftAdd = (product) => {
    setDraftQty(prev => {
      const cur = prev[product._id] || 0;
      if (cur >= product.quantity) {
        Alert.alert('Stock limit', `Only ${product.quantity} in stock`);
        return prev;
      }
      return { ...prev, [product._id]: cur + 1 };
    });
  };

  const draftRemove = (productId) => {
    setDraftQty(prev => {
      const cur = prev[productId] || 0;
      if (cur <= 0) return prev;
      return { ...prev, [productId]: cur - 1 };
    });
  };

  // ── Confirm selections: merge draft into cart ─────────────────────────────
  const confirmProductSelection = () => {
    setCartItems(() => {
      const productMap = {};
      products.forEach(p => { productMap[p._id] = p; });

      const newCart = [];
      Object.entries(draftQty).forEach(([productId, qty]) => {
        if (qty <= 0) return; // deselected
        const p = productMap[productId];
        if (!p) return;
        newCart.push({
          productId,
          name:     p.name,
          price:    p.price,
          quantity: qty,
          subtotal: qty * p.price,
          maxQty:   p.quantity,
        });
      });
      return newCart;
    });
    setProductModal(false);
  };

  // ── Cart quantity controls (outside modal) ────────────────────────────────
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const changeQty = (productId, delta) => {
    setCartItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty < 1) return i;
      if (newQty > i.maxQty) { Alert.alert('Stock', `Only ${i.maxQty} in stock`); return i; }
      return { ...i, quantity: newQty, subtotal: newQty * i.price };
    }));
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const paid  = Number(paidAmount) || 0;
  const due   = total - paid;

  // draft selected count for the "Add Products" button badge
  const draftCount = Object.values(draftQty).filter(q => q > 0).length;

  // filtered products in modal
  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.quantity > 0 &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    ),
    [products, productSearch]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (cartItems.length === 0) return Alert.alert('Validation', 'Add at least one product');
    if (paid > total) return Alert.alert('Validation', 'Paid amount cannot exceed total');
    setLoading(true);
    try {
      const formData = new FormData();
      if (selectedCustomer) formData.append('customerId', selectedCustomer._id);
      formData.append('items', JSON.stringify(cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))));
      formData.append('paidAmount', String(paid));
      if (imageFile) formData.append('image', { uri: imageFile.uri, type: 'image/jpeg', name: 'invoice.jpg' });

      await salesService.create(formData);
      Alert.alert('Success', 'Sale created!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create sale');
    } finally { setLoading(false); }
  };

  if (loadingData) return <ActivityIndicator style={{ flex: 1 }} size="large" color={GREEN} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Customer ── */}
      <Text style={styles.label}>Customer (Optional)</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setCustomerModal(true)}>
        <Ionicons name="person-outline" size={18} color={GREEN} />
        <Text style={styles.selectTxt}>
          {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
        </Text>
        {selectedCustomer && (
          <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-down" size={16} color="#aaa" />
      </TouchableOpacity>

      {/* ── Products ── */}
      <Text style={styles.label}>Products *</Text>
      <TouchableOpacity style={styles.addProductsBtn} onPress={openProductModal}>
        <Ionicons name="grid-outline" size={20} color="#fff" />
        <Text style={styles.addProductsBtnTxt}>
          {cartItems.length > 0 ? `Edit Products (${cartItems.length} selected)` : 'Select Products'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </TouchableOpacity>

      {/* ── Cart ── */}
      {cartItems.length > 0 && (
        <View style={styles.cart}>
          <Text style={styles.cartHeader}>🛒 Cart — {cartItems.length} item{cartItems.length > 1 ? 's' : ''}</Text>
          {cartItems.map(item => (
            <View key={item.productId} style={styles.cartRow}>
              <View style={styles.cartInfo}>
                <Text style={styles.cartName}>{item.name}</Text>
                <Text style={styles.cartPrice}>{fmt(item.price)} each • max {item.maxQty}</Text>
              </View>
              <View style={styles.qtyCtrl}>
                <TouchableOpacity onPress={() => changeQty(item.productId, -1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => changeQty(item.productId, 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnTxt}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cartSubtotal}>{fmt(item.subtotal)}</Text>
              <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Totals ── */}
      {cartItems.length > 0 && (
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
          <Text style={styles.label}>Amount Paid (LKR)</Text>
          <Input
            value={paidAmount}
            onChangeText={setPaidAmount}
            placeholder={`Max: ${fmt(total)}`}
            keyboardType="numeric"
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Due Amount</Text>
            <Text style={[styles.totalValue, { color: due > 0 ? '#e74c3c' : GREEN }]}>{fmt(due)}</Text>
          </View>
        </View>
      )}

      {/* ── Invoice image ── */}
      <Text style={styles.label}>Invoice / Receipt Image</Text>
      <ImageUpload
        imageUri={imageFile?.uri}
        onImageSelected={setImageFile}
        onRemove={() => setImageFile(null)}
        label="Upload Invoice"
      />

      <Button
        title={loading ? 'Creating Sale...' : 'Create Sale'}
        onPress={handleSubmit}
        disabled={loading || cartItems.length === 0}
      />

      {/* ══════════════════════════════════════════════════════
          PRODUCT MODAL — stays open, multi-select
      ══════════════════════════════════════════════════════ */}
      <Modal visible={productModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Products</Text>
              <TouchableOpacity onPress={() => setProductModal(false)} style={styles.modalCloseX}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Tap + / − to set quantity. Tap Done when finished.</Text>

            {/* Search */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color="#aaa" />
              <TextInput
                style={styles.searchInput}
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search products..."
                placeholderTextColor="#bbb"
              />
              {productSearch.length > 0 && (
                <TouchableOpacity onPress={() => setProductSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>

            {/* Product list */}
            <FlatList
              data={filteredProducts}
              keyExtractor={i => i._id}
              style={{ flexGrow: 0, maxHeight: 380 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const qty = draftQty[item._id] || 0;
                const selected = qty > 0;
                return (
                  <View style={[styles.modalItem, selected && styles.modalItemSelected]}>
                    {/* Product info */}
                    <View style={styles.modalItemInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {selected && <Ionicons name="checkmark-circle" size={16} color={GREEN} />}
                        <Text style={[styles.modalItemName, selected && { color: GREEN }]}>{item.name}</Text>
                      </View>
                      <Text style={styles.modalItemSub}>{fmt(item.price)} • Stock: {item.quantity}</Text>
                      {selected && (
                        <Text style={styles.modalItemSubtotal}>
                          Subtotal: {fmt(qty * item.price)}
                        </Text>
                      )}
                    </View>

                    {/* Inline qty stepper */}
                    <View style={styles.modalQtyCtrl}>
                      <TouchableOpacity
                        onPress={() => draftRemove(item._id)}
                        style={[styles.modalQtyBtn, { backgroundColor: qty > 0 ? '#e74c3c' : '#f0f0f0' }]}
                      >
                        <Text style={[styles.modalQtyBtnTxt, { color: qty > 0 ? '#fff' : '#ccc' }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.modalQtyVal, selected && { color: GREEN }]}>
                        {qty}
                      </Text>
                      <TouchableOpacity
                        onPress={() => draftAdd(item)}
                        style={[styles.modalQtyBtn, { backgroundColor: GREEN }]}
                      >
                        <Text style={[styles.modalQtyBtnTxt, { color: '#fff' }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {productSearch ? 'No products match your search' : 'No products in stock'}
                </Text>
              }
            />

            {/* Selection summary bar */}
            <View style={styles.modalSummaryBar}>
              <Text style={styles.modalSummaryTxt}>
                {draftCount > 0
                  ? `${draftCount} product${draftCount > 1 ? 's' : ''} selected`
                  : 'No products selected'}
              </Text>
              {draftCount > 0 && (
                <Text style={styles.modalSummaryTotal}>
                  {fmt(filteredProducts.reduce((s, p) => s + (draftQty[p._id] || 0) * p.price, 0) +
                    products
                      .filter(p => !filteredProducts.find(fp => fp._id === p._id))
                      .reduce((s, p) => s + (draftQty[p._id] || 0) * p.price, 0)
                  )}
                </Text>
              )}
            </View>

            {/* Done button */}
            <TouchableOpacity
              style={[styles.doneBtn, draftCount === 0 && { backgroundColor: '#ccc' }]}
              onPress={confirmProductSelection}
            >
              <Text style={styles.doneBtnTxt}>
                {draftCount > 0 ? `Done — Add ${draftCount} product${draftCount > 1 ? 's' : ''}` : 'Done'}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          CUSTOMER MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal visible={customerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModal(false)} style={styles.modalCloseX}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ _id: 'walkin', name: 'Walk-in (No Customer)', isWalkin: true }, ...customers]}
              keyExtractor={i => i._id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCustomer(item.isWalkin ? null : item);
                    setCustomerModal(false);
                  }}
                >
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    {!item.isWalkin && (
                      <Text style={styles.modalItemSub}>Due: {fmt(item.creditBalance)}</Text>
                    )}
                  </View>
                  {(item.isWalkin ? !selectedCustomer : selectedCustomer?._id === item._id) && (
                    <Ionicons name="checkmark-circle" size={22} color={GREEN} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, marginTop: 14, fontWeight: '600' },

  selectBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: '#ddd', gap: 8,
  },
  selectTxt: { flex: 1, fontSize: 15, color: '#333' },

  addProductsBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: GREEN,
    borderRadius: 10, padding: 14, gap: 10,
  },
  addProductsBtnTxt: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '700' },

  // Cart
  cart: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 10 },
  cartHeader: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  cartRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 8,
  },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 14, fontWeight: '600', color: '#333' },
  cartPrice: { fontSize: 12, color: '#888' },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    backgroundColor: '#f0f0f0', width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnTxt: { fontSize: 18, fontWeight: '700', color: '#333' },
  qtyValue: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  cartSubtotal: { fontSize: 14, fontWeight: '700', color: GREEN, minWidth: 70, textAlign: 'right' },

  // Totals
  totalsBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  totalLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#333' },

  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 30,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalTitle: { flex: 1, fontSize: 19, fontWeight: '800', color: '#222' },
  modalCloseX: { padding: 4 },
  modalSubtitle: { fontSize: 12, color: '#aaa', marginBottom: 12 },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f4f4',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  // Product modal items
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: { backgroundColor: '#f0fdf4', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  modalItemInfo: { flex: 1, paddingRight: 8 },
  modalItemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  modalItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
  modalItemSubtotal: { fontSize: 12, color: GREEN, fontWeight: '700', marginTop: 2 },

  // Modal qty stepper
  modalQtyCtrl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalQtyBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalQtyBtnTxt: { fontSize: 18, fontWeight: '700' },
  modalQtyVal: { fontSize: 16, fontWeight: '800', minWidth: 22, textAlign: 'center', color: '#333' },

  // Summary bar
  modalSummaryBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 8,
  },
  modalSummaryTxt: { fontSize: 13, color: '#555', fontWeight: '600' },
  modalSummaryTotal: { fontSize: 15, fontWeight: '800', color: GREEN },

  // Done button
  doneBtn: {
    backgroundColor: GREEN, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 6,
  },
  doneBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  empty: { textAlign: 'center', color: '#aaa', marginVertical: 24, fontSize: 14 },
});