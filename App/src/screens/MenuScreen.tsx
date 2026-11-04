import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { usePlaceOrder, OrderItemInput } from '../hooks/useOrder';

interface CheckoutRowProps {
  name: string;
  qty: number;
  price: number;
}

function CheckoutItemRow({ name, qty, price }: CheckoutRowProps) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemName}>{name} x {qty}</Text>
      <Text style={styles.itemPrice}>₹{price * qty}</Text>
    </View>
  );
}

export default function OrderScreen() {
  const [orderPlacedData, setOrderPlacedData] = useState<any | null>(null);
  const placeOrderMutation = usePlaceOrder();

  const cartItems = [
    { id: 1, name: 'Ginger Cardamom Chai', qty: 3, price: 25 },
    { id: 2, name: 'Plate of Aloo Samosa', qty: 1, price: 40 },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cgst = subtotal * 0.05; 
  const sgst = subtotal * 0.05; 
  const grandTotal = subtotal + cgst + sgst;

  const handleConfirmOrder = () => {
    const itemsPayload: OrderItemInput[] = cartItems.map(item => ({
      item_id: item.id,
      quantity: item.qty,
      price_rupees: item.price
    }));

    placeOrderMutation.mutate(
      { items: itemsPayload, payment_method: 'CASH' },
      {
        onSuccess: (data: any) => {
          setOrderPlacedData(data);
        },
        onError: (err: any) => {
          console.error("Order placement failed:", err.message);
        }
      }
    );
  };

  if (orderPlacedData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>Give this code at the counter to collect your chai</Text>
          
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{orderPlacedData.pickup_code}</Text>
          </View>

          <Text style={styles.orderIdText}>Order ID: #{orderPlacedData.order_id}</Text>
          <Text style={styles.amountPaidText}>Total Payable: ₹{grandTotal}</Text>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setOrderPlacedData(null)}
          >
            <Text style={styles.backButtonText}>Back to Summary</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Summary</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items Ordered</Text>
        <FlatList
          data={cartItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CheckoutItemRow name={item.name} qty={item.qty} price={item.price} />
          )}
        />
      </View>

      <View style={styles.billCard}>
        <Text style={styles.sectionTitle}>Bill Details</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Subtotal</Text>
          <Text style={styles.billValue}>₹{subtotal}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>CGST (5%)</Text>
          <Text style={styles.billValue}>₹{cgst.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>SGST (5%)</Text>
          <Text style={styles.billValue}>₹{sgst.toFixed(2)}</Text>
        </View>
        <View style={[styles.billRow, styles.totalDivider]}>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          disabled={placeOrderMutation.isPending}
          style={[styles.placeOrderButton, placeOrderMutation.isPending && styles.disabledButton]}
          onPress={handleConfirmOrder}
        >
          {placeOrderMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order (₹{grandTotal})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f2' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#78350f', textAlign: 'center' },
  section: { padding: 16, backgroundColor: '#fff', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#78350f', marginBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6', paddingBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  itemName: { fontSize: 15, color: '#374151', fontWeight: '500' },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  billCard: { padding: 16, backgroundColor: '#fff', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { fontSize: 14, color: '#6b7280' },
  billValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  totalDivider: { borderTopWidth: 1, borderColor: '#f3f4f6', marginTop: 8, paddingTop: 10 },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#78350f' },
  grandTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#78350f' },
  footer: { padding: 16, backgroundColor: '#fff', position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderColor: '#e5e7eb' },
  placeOrderButton: { backgroundColor: '#b45309', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  disabledButton: { backgroundColor: '#d1d5db' },
  placeOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  successCard: { backgroundColor: '#fff', padding: 32, borderRadius: 20, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  successIcon: { fontSize: 50, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#15803d', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 16, marginBottom: 24 },
  codeBox: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#fbbf24', borderStyle: 'dashed', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 20 },
  codeText: { fontSize: 36, fontWeight: 'bold', color: '#78350f', letterSpacing: 4 },
  orderIdText: { fontSize: 14, color: '#9ca3af', marginBottom: 4 },
  amountPaidText: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 24 },
  backButton: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  backButtonText: { color: '#4b5563', fontWeight: '600' }
});