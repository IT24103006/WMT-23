import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductFormScreen from '../screens/products/ProductFormScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerFormScreen from '../screens/customers/CustomerFormScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import SalesScreen from '../screens/sales/SalesScreen';
import SaleFormScreen from '../screens/sales/SaleFormScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';

// ── Supplier screens (NEW) ────────────────────────────────────────────────
import SuppliersScreen from '../screens/suppliers/SuppliersScreen';
import SupplierFormScreen from '../screens/suppliers/SupplierFormScreen';
import SupplierDetailScreen from '../screens/suppliers/SupplierDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const GREEN = '#2ecc71';

const stackOptions = {
  headerStyle: { backgroundColor: GREEN },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'ClickBuy' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params?.product ? 'Edit Product' : 'Add Product' })} />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name="CustomerForm" component={CustomerFormScreen} options={({ route }) => ({ title: route.params?.customer ? 'Edit Customer' : 'Add Customer' })} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Customer Detail' }} />
    </Stack.Navigator>
  );
}

function SalesStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="SalesList" component={SalesScreen} options={{ title: 'Sales' }} />
      <Stack.Screen name="SaleForm" component={SaleFormScreen} options={{ title: 'New Sale' }} />
    </Stack.Navigator>
  );
}

// ── Suppliers Stack (NEW) ─────────────────────────────────────────────────
function SuppliersStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="SuppliersList" component={SuppliersScreen} options={{ title: 'Suppliers' }} />
      <Stack.Screen name="SupplierForm" component={SupplierFormScreen} options={({ route }) => ({ title: route.params?.supplier?._id ? 'Edit Supplier' : 'Add Supplier' })} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} options={{ title: 'Supplier Detail' }} />
    </Stack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard:     'home',
            Products:      'cube',
            Customers:     'people',
            Sales:         'receipt',
            Suppliers:     'business',   // ← NEW
            Notifications: 'notifications',
            Reports:       'bar-chart',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard"     component={DashboardStack} />
      <Tab.Screen name="Products"      component={ProductsStack} />
      <Tab.Screen name="Customers"     component={CustomersStack} />
      <Tab.Screen name="Sales"         component={SalesStack} />
      <Tab.Screen name="Suppliers"     component={SuppliersStack} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, headerStyle: { backgroundColor: GREEN }, headerTintColor: '#fff', title: 'Notifications' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: true, headerStyle: { backgroundColor: GREEN }, headerTintColor: '#fff', title: 'Reports' }}
      />
    </Tab.Navigator>
  );
}