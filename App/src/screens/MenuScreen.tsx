import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import CategoryFilter from '../features/menu/components/CategoryFilter';
import EmptyState from '../features/menu/components/EmptyState';
import ItemCard from '../features/menu/components/ItemCard';
import ItemDetailSheet from '../features/menu/components/ItemDetailSheet';
import SearchBar from '../features/menu/components/SearchBar';
import VegToggle from '../features/menu/components/VegToggle';
import { MENU_ITEMS, type MenuCategory, type MenuItem } from '../features/menu/data/menuData';
import { filterMenuItems } from '../features/menu/filterMenuItems';
import { colors, spacing } from '../features/menu/theme';
import { fetchMenuItems } from '../services/menuApi';

export default function MenuScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      // fetchMenuItems already falls back to bundled mock data on failure.
      const nextItems = await fetchMenuItems();
      if (!cancelled) {
        setItems(nextItems);
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(
    () =>
      filterMenuItems(items, {
        searchQuery,
        category: selectedCategory,
        vegOnly,
      }),
    [items, searchQuery, selectedCategory, vegOnly],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategory !== 'All' || vegOnly;

  const cardWidth = (screenWidth - spacing.xl * 2 - 14) / 2;

  const handleRefresh = useCallback(() => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    fetchMenuItems()
      .then(nextItems => setItems(nextItems))
      .finally(() => setRefreshing(false));
  }, [refreshing]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setVegOnly(false);
  }, []);

  const handleOpenItem = useCallback((item: MenuItem) => {
    if (item.isSoldOut) {
      return;
    }
    setActiveItem(item);
  }, []);

  const handleCloseItem = useCallback(() => {
    setActiveItem(null);
  }, []);

  const renderItem = useCallback<ListRenderItem<MenuItem>>(
    ({ item }) => (
      <ItemCard item={item} width={cardWidth} onPress={handleOpenItem} />
    ),
    [cardWidth, handleOpenItem],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.searchWrap}>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            <View style={styles.categoryWrap}>
              <CategoryFilter
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Office Menu</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredItems.length}{' '}
                  {filteredItems.length === 1 ? 'item' : 'items'} available
                </Text>
              </View>

              <VegToggle value={vegOnly} onChange={setVegOnly} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
            onAction={hasActiveFilters ? handleClearFilters : undefined}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      />

      <ItemDetailSheet
        item={activeItem}
        visible={activeItem !== null}
        onClose={handleCloseItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: spacing.lg,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
  },
  categoryWrap: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: spacing.xl,
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: colors.text,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.muted,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: spacing.xl,
  },
});
