import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MenuItem } from '../data/menuData';
import { colors, radii, spacing } from '../theme';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 5;

interface ItemDetailSheetProps {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
}

export default function ItemDetailSheet({
  item,
  visible,
  onClose,
}: ItemDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(MIN_QUANTITY);

  // Every new item starts the selector at one.
  useEffect(() => {
    if (visible) {
      setQuantity(MIN_QUANTITY);
    }
  }, [visible, item?.id]);

  if (!item) {
    return null;
  }

  const indicatorColor = item.isVeg ? colors.veg : colors.nonVeg;
  const lineTotal = item.price * quantity;

  const handleAddToCart = () => {
    Alert.alert(
      'Added to cart',
      `${quantity} × ${item.name} — F3 integration pending.`,
    );
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close item details"
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.imageWrap}>
              <Image
                source={item.image}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />

              <View
                style={[styles.vegIndicator, { borderColor: indicatorColor }]}
                accessibilityLabel={
                  item.isVeg ? 'Vegetarian' : 'Non-vegetarian'
                }
              >
                <View
                  style={[
                    styles.vegIndicatorDot,
                    { backgroundColor: indicatorColor },
                  ]}
                />
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>

              <Text style={styles.dietLabel}>
                {item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
              </Text>

              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Quantity</Text>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      quantity <= MIN_QUANTITY && styles.stepperButtonDisabled,
                    ]}
                    onPress={() =>
                      setQuantity(current => Math.max(MIN_QUANTITY, current - 1))
                    }
                    disabled={quantity <= MIN_QUANTITY}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                  >
                    <Minus
                      size={16}
                      strokeWidth={2.6}
                      color={
                        quantity <= MIN_QUANTITY
                          ? colors.placeholder
                          : colors.primaryDark
                      }
                    />
                  </TouchableOpacity>

                  <Text style={styles.quantityValue}>{quantity}</Text>

                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      quantity >= MAX_QUANTITY && styles.stepperButtonDisabled,
                    ]}
                    onPress={() =>
                      setQuantity(current => Math.min(MAX_QUANTITY, current + 1))
                    }
                    disabled={quantity >= MAX_QUANTITY}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                  >
                    <Plus
                      size={16}
                      strokeWidth={2.6}
                      color={
                        quantity >= MAX_QUANTITY
                          ? colors.placeholder
                          : colors.primaryDark
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddToCart}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Add ${quantity} ${item.name} to cart`}
              >
                <Text style={styles.addButtonText}>
                  Add to Cart · ₹{lineTotal}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(62, 39, 35, 0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 6,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryBorder,
  },
  sheetContent: {
    paddingBottom: spacing.sm,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.primarySoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  vegIndicator: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.xl,
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 2,
  },
  vegIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  price: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.primaryDark,
  },
  dietLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  description: {
    marginTop: spacing.md,
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '500',
    color: colors.muted,
  },
  quantityRow: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: radii.chip,
    borderWidth: 1.2,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  stepperButtonDisabled: {
    backgroundColor: colors.soldOutButtonBg,
  },
  quantityValue: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    marginTop: spacing.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.input,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: colors.surface,
  },
});
