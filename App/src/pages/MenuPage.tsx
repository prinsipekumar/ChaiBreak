import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SearchBar from '../components/SearchBar';
import CategoryChips from '../components/CategoryChips';
import VegToggle from '../components/VegToggle';
import ItemCard from '../components/ItemCard';
import ItemDetailBottomSheet from '../components/ItemDetailBottomSheet';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { apiService } from '../services/api';
import { Item } from '../types';
import { useCartStore } from '../store/cartStore';

export default function MenuPage() {
  const qc = useQueryClient();

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);

  // Active item detail sheet
  const [selectedItemForSheet, setSelectedItemForSheet] = useState<Item | null>(null);
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);

  // Zustand F3 Cart store
  const addItemToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  // 1. Fetch Categories via React Query (GET /api/v1/categories)
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories(),
  });

  // 2. Fetch Items via React Query with Server-side Filtering:
  // GET /api/v1/items?categoryId=&search=&veg=true
  const {
    data: items = [],
    isLoading: isItemsLoading,
    isError: isItemsError,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['items', { categoryId: selectedCategoryId, search: searchQuery, veg: isVegOnly }],
    queryFn: () =>
      apiService.getItems({
        categoryId: selectedCategoryId,
        search: searchQuery,
        veg: isVegOnly,
      }),
  });

  // Pull to refresh handler
  const handlePullToRefresh = async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categories'] }),
        refetchItems(),
      ]);
    } finally {
      setIsPullRefreshing(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategoryId('all');
    setSearchQuery('');
    setIsVegOnly(false);
  };

  // Kitchen simulation toggle
  const handleSimulateKitchenToggle = async (targetItem: Item) => {
    const isCurrentlySoldOut = targetItem.stock_left === 0 || !targetItem.is_available;
    await apiService.toggleItemSoldOut(targetItem.id, !isCurrentlySoldOut);
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={(q) => setSearchQuery(q)}
        placeholder="Search chai, snacks and food..."
      />

      {/* Category Navigation (Horizontally scrollable chips) */}
      <CategoryChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => setSelectedCategoryId(id)}
        isLoading={isCategoriesLoading}
      />

      {/* Compact Vegetarian-Only Toggle */}
      <VegToggle
        isVegOnly={isVegOnly}
        onToggle={() => setIsVegOnly(!isVegOnly)}
        count={items.length}
      />

      {/* Pull-To-Refresh Indicator & Kitchen Simulation Trigger */}
      <PullToRefreshIndicator
        isRefreshing={isPullRefreshing}
        onRefresh={handlePullToRefresh}
        items={items}
        onToggleKitchenStock={handleSimulateKitchenToggle}
      />

      {/* Main Menu Grid & States */}
      <div className="flex-1 mt-1">
        {isItemsLoading ? (
          <LoadingSkeleton />
        ) : isItemsError ? (
          <ErrorState
            message={itemsError instanceof Error ? itemsError.message : undefined}
            onRetry={() => refetchItems()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            isVegOnly={isVegOnly}
            onReset={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 px-4 py-2">
            {items.map((item) => {
              const inCart = cartItems.find((ci) => ci.item.id === item.id);
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  cartQty={inCart ? inCart.qty : 0}
                  onSelect={(selected) => setSelectedItemForSheet(selected)}
                  onAddToCart={(target, e) => {
                    e.stopPropagation();
                    addItemToCart(target, 1);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Bottom Sheet */}
      {selectedItemForSheet && (
        <ItemDetailBottomSheet
          item={selectedItemForSheet}
          onClose={() => setSelectedItemForSheet(null)}
        />
      )}
    </div>
  );
}
