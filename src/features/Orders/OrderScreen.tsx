import Ionicons from '@react-native-vector-icons/ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvoices } from '../../context/InvoiceContext';
import { useMenu } from '../../context/MenuContext';
import type { Dish, DishCategory, InvoiceItem } from '../../types/restaurant';
import type { RootStackParamList } from '../../navigation/types';
import { colors, typography } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Order'>;
type CategoryFilter = 'Tất cả' | DishCategory;

const categoryFilters: CategoryFilter[] = [
  'Tất cả',
  'Khai vị',
  'Món chính',
  'Đồ uống',
  'Tráng miệng',
];

const quickNotes = ['Ít cay', 'Không đá', 'Không hành', 'Ít đường'];

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function formatTableNumber(tableNumber: number) {
  return String(tableNumber).padStart(2, '0');
}

function getDishIcon(category: DishCategory) {
  switch (category) {
    case 'Khai vị':
      return 'fast-food-outline';
    case 'Món chính':
      return 'restaurant-outline';
    case 'Đồ uống':
      return 'cafe-outline';
    case 'Tráng miệng':
      return 'ice-cream-outline';
  }
}

function OrderScreen({ navigation, route }: Props) {
  const { tableNumber } = route.params;
  const { dishes } = useMenu();
  const {
    invoices,
    adjustItemQuantity,
    updateItemNote,
    sendPendingItemsToKitchen,
  } = useInvoices();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('Tất cả');

  const activeInvoice = invoices.find(
    invoice =>
      invoice.tableNumber === tableNumber && invoice.status === 'Đang phục vụ',
  );
  const invoice = activeInvoice;

  const filteredDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return dishes.filter(dish => {
      const matchesCategory =
        category === 'Tất cả' || dish.category === category;
      const matchesQuery =
        !normalizedQuery || dish.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, dishes, query]);

  const total = (invoice?.items ?? []).reduce((sum, item) => {
    const dish = dishes.find(menuItem => menuItem.id === item.dishId);
    return sum + (dish ? dish.price * item.quantity : 0);
  }, 0);

  const quantityForDish = (dishId: string) =>
    invoice?.items
      .filter(item => item.dishId === dishId)
      .reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const adjustDish = (dish: Dish, change: 1 | -1) => {
    if (!dish.available && change > 0) {
      return;
    }

    if (change > 0) {
      adjustItemQuantity(
        tableNumber,
        { dishId: dish.id, quantity: 1, sentToKitchen: false },
        change,
      );
      return;
    }

    const itemToRemove =
      invoice?.items
        .filter(item => item.dishId === dish.id)
        .find(item => !item.sentToKitchen) ??
      invoice?.items.find(item => item.dishId === dish.id);
    if (itemToRemove) {
      adjustItemQuantity(tableNumber, itemToRemove, change);
    }
  };

  const renderDishCard = ({ item }: { item: Dish }) => {
    const quantity = quantityForDish(item.id);
    const unavailable = !item.available;

    return (
      <View
        accessibilityLabel={`${item.name}, ${formatCurrency(item.price)}${
          unavailable ? ', hết hàng' : ''
        }`}
        style={[styles.dishCard, unavailable && styles.unavailableDishCard]}
      >
        <View
          style={[
            styles.dishThumbnail,
            unavailable && styles.unavailableThumbnail,
          ]}
        >
          <Ionicons
            name={getDishIcon(item.category)}
            size={24}
            color={unavailable ? '#A0AAA2' : '#39744A'}
          />
        </View>
        {unavailable && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
        <Text
          numberOfLines={2}
          style={[styles.dishName, unavailable && styles.unavailableText]}
        >
          {item.name}
        </Text>
        <Text style={[styles.dishPrice, unavailable && styles.unavailableText]}>
          {formatCurrency(item.price)}
        </Text>
        {unavailable ? (
          <View style={styles.disabledAddButton}>
            <Text style={styles.disabledAddText}>Tạm hết</Text>
          </View>
        ) : quantity > 0 ? (
          <View style={styles.quantityControl}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Giảm ${item.name}`}
              onPress={() => adjustDish(item, -1)}
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={17} color="#287143" />
            </Pressable>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Tăng ${item.name}`}
              onPress={() => adjustDish(item, 1)}
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={17} color="#287143" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Thêm ${item.name}`}
            onPress={() => adjustDish(item, 1)}
            style={styles.addDishButton}
          >
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.addDishText}>Thêm món</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderInvoiceItem = (item: InvoiceItem, index: number) => {
    const dish = dishes.find(menuItem => menuItem.id === item.dishId);
    if (!dish) {
      return null;
    }
    const sentToKitchen = Boolean(item.sentToKitchen);

    return (
      <View
        key={item.id ?? `${item.dishId}-${index}`}
        style={styles.invoiceItem}
      >
        <View style={styles.itemHeading}>
          <View style={styles.itemNameGroup}>
            <Ionicons
              name={sentToKitchen ? 'checkmark-circle' : 'time-outline'}
              size={17}
              color={sentToKitchen ? '#2E8B57' : '#D18B2C'}
            />
            <Text numberOfLines={1} style={styles.invoiceDishName}>
              {dish.name}
            </Text>
          </View>
          <Text
            style={[
              styles.kitchenStatus,
              sentToKitchen ? styles.sentStatus : styles.pendingStatus,
            ]}
          >
            {sentToKitchen ? 'Đã gửi bếp' : 'Món mới'}
          </Text>
        </View>

        <View style={styles.itemDetailsRow}>
          <View style={styles.inlineQuantityControl}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Giảm ${dish.name}`}
              onPress={() => adjustItemQuantity(tableNumber, item, -1)}
              style={styles.inlineQuantityButton}
            >
              <Ionicons name="remove" size={15} color="#52705B" />
            </Pressable>
            <Text style={styles.inlineQuantityValue}>{item.quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Tăng ${dish.name}`}
              disabled={!dish.available}
              onPress={() =>
                adjustItemQuantity(
                  tableNumber,
                  { dishId: dish.id, quantity: 1, sentToKitchen: false },
                  1,
                )
              }
              style={styles.inlineQuantityButton}
            >
              <Ionicons name="add" size={15} color="#52705B" />
            </Pressable>
          </View>
          <Text style={styles.unitPrice}>
            {formatCurrency(dish.price)} / món
          </Text>
          <Text style={styles.lineTotal}>
            {formatCurrency(dish.price * item.quantity)}
          </Text>
        </View>

        <View style={styles.noteSection}>
          <TextInput
            accessibilityLabel={`Ghi chú cho ${dish.name}`}
            value={item.note ?? ''}
            onChangeText={note => updateItemNote(tableNumber, item, note)}
            placeholder="Ghi chú món (vd: ít cay)"
            placeholderTextColor="#A0AAA2"
            style={styles.noteInput}
            maxLength={80}
          />
          <View style={styles.quickNotes}>
            {quickNotes.slice(0, 2).map(note => {
              const selected = item.note === note;
              return (
                <Pressable
                  key={note}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    updateItemNote(tableNumber, item, selected ? '' : note)
                  }
                  style={[
                    styles.quickNoteChip,
                    selected && styles.quickNoteChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickNoteText,
                      selected && styles.quickNoteTextSelected,
                    ]}
                  >
                    {note}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại sơ đồ bàn"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={21} color="#26372C" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>
            Bàn {formatTableNumber(tableNumber)}
            {invoice ? ` - ${invoice.guestCount ?? 1} khách` : ''}
          </Text>
          <Text style={styles.headerSubtitle}>Gọi món & thanh toán</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={filteredDishes}
        keyExtractor={dish => dish.id}
        renderItem={renderDishCard}
        numColumns={2}
        columnWrapperStyle={styles.dishRow}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.orderInfoCard}>
              <View style={styles.orderInfoLine}>
                <Text style={styles.orderInfoLabel}>Thời gian vào</Text>
                <Text style={styles.orderInfoValue}>
                  {invoice?.createdAt ?? 'Chưa bắt đầu'}
                </Text>
              </View>
              <View style={styles.orderInfoLine}>
                <Text style={styles.orderInfoLabel}>Trạng thái</Text>
                <View style={[styles.invoiceStatusBadge, styles.unpaidBadge]}>
                  <View style={[styles.statusDot, styles.unpaidDot]} />
                  <Text style={[styles.invoiceStatusText, styles.unpaidText]}>
                    Chưa thanh toán
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={19} color="#829087" />
              <TextInput
                accessibilityLabel="Tìm món ăn"
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm món ăn..."
                placeholderTextColor="#A0AAA2"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xoá tìm kiếm"
                  onPress={() => setQuery('')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color="#A0AAA2" />
                </Pressable>
              )}
            </View>

            <FlatList
              horizontal
              data={categoryFilters}
              keyExtractor={item => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
              renderItem={({ item }) => {
                const selected = category === item;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selected && styles.filterTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View style={styles.ticketHeader}>
              <View>
                <Text style={styles.ticketTitle}>Món đã chọn</Text>
                <Text style={styles.ticketSubtitle}>
                  {invoice?.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  ) ?? 0}{' '}
                  món trong hoá đơn
                </Text>
              </View>
              <View style={styles.ticketIcon}>
                <Ionicons name="receipt-outline" size={17} color="#287143" />
              </View>
            </View>

            <View style={styles.ticketCard}>
              {invoice?.items.length ? (
                <>
                  {invoice.items.map(renderInvoiceItem)}
                  {invoice.items.some(item => !item.sentToKitchen) && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => sendPendingItemsToKitchen(tableNumber)}
                      style={styles.sendToKitchenButton}
                    >
                      <Ionicons
                        name="paper-plane-outline"
                        size={15}
                        color="#287143"
                      />
                      <Text style={styles.sendToKitchenText}>
                        Xác nhận gửi món mới vào bếp
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={styles.emptyTicket}>
                  <Ionicons
                    name="fast-food-outline"
                    size={23}
                    color="#9AA69D"
                  />
                  <Text style={styles.emptyTicketText}>
                    Chưa có món. Chọn món bên dưới để bắt đầu.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.menuHeading}>
              <View>
                <Text style={styles.ticketTitle}>Chọn món</Text>
                <Text style={styles.ticketSubtitle}>
                  {filteredDishes.length} món trong thực đơn
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyMenu}>
            <Text style={styles.emptyMenuText}>
              Không tìm thấy món phù hợp.
            </Text>
          </View>
        }
      />

      <View style={styles.paymentFooter}>
        <View style={styles.totalSummary}>
          <Text style={styles.totalLabel}>Tạm tính</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!invoice || invoice.items.length === 0 || total <= 0}
          onPress={() => {
            if (invoice) {
              navigation.navigate('Payment', { invoiceId: invoice.id });
            }
          }}
          style={({ pressed }) => [
            styles.paymentButton,
            (!invoice || invoice.items.length === 0 || total <= 0) &&
              styles.paymentButtonDisabled,
            pressed && styles.paymentButtonPressed,
          ]}
        >
          <Ionicons name="card-outline" size={19} color="#FFFFFF" />
          <Text style={styles.paymentButtonText}>Thanh toán</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default OrderScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightHeavy,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 2,
  },
  headerSpacer: {
    width: 38,
  },
  listContent: {
    paddingHorizontal: 17,
    paddingBottom: 15,
  },
  orderInfoCard: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 11,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  orderInfoLine: {
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderInfoLabel: {
    color: '#829087',
    fontSize: 11,
  },
  orderInfoValue: {
    color: '#32453A',
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  unpaidBadge: {
    backgroundColor: '#FFF2DB',
  },
  paidBadge: {
    backgroundColor: '#E3F3E7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  unpaidDot: {
    backgroundColor: '#D18B2C',
  },
  paidDot: {
    backgroundColor: '#2E8B57',
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unpaidText: {
    color: '#9B671E',
  },
  paidText: {
    color: '#287143',
  },
  searchBox: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    marginBottom: 9,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#243329',
    fontSize: 12,
    marginLeft: 8,
  },
  filtersContent: {
    gap: 7,
    paddingBottom: 13,
  },
  filterChip: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EAEFEB',
  },
  filterChipSelected: {
    backgroundColor: '#287143',
  },
  filterText: {
    color: '#66766C',
    fontSize: 10,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketTitle: {
    color: colors.textStrong,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightHeavy,
  },
  ticketSubtitle: {
    color: '#89958D',
    fontSize: 10,
    marginTop: 3,
  },
  ticketIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F1E7',
  },
  ticketCard: {
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  invoiceItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EDE8',
  },
  itemHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  itemNameGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  invoiceDishName: {
    flex: 1,
    color: '#28392E',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  kitchenStatus: {
    fontSize: 9,
    fontWeight: '700',
  },
  sentStatus: {
    color: '#2E8B57',
  },
  pendingStatus: {
    color: '#BB7920',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineQuantityControl: {
    height: 29,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4EAE4',
    borderRadius: 9,
    backgroundColor: '#F8FAF8',
  },
  inlineQuantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineQuantityValue: {
    minWidth: 19,
    color: '#34483A',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  unitPrice: {
    flex: 1,
    color: '#89958D',
    fontSize: 9,
    textAlign: 'center',
  },
  lineTotal: {
    color: '#34483A',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 6,
  },
  noteInput: {
    flex: 1,
    height: 29,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EDF0ED',
    borderRadius: 8,
    color: '#46584B',
    backgroundColor: '#FAFBFA',
    fontSize: 9,
  },
  quickNotes: {
    flexDirection: 'row',
    gap: 4,
  },
  quickNoteChip: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#F0F3F0',
  },
  quickNoteChipSelected: {
    backgroundColor: '#DDEEE1',
  },
  quickNoteText: {
    color: '#718078',
    fontSize: 8,
  },
  quickNoteTextSelected: {
    color: '#287143',
    fontWeight: '700',
  },
  emptyTicket: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 5,
  },
  emptyTicketText: {
    color: '#89958D',
    fontSize: 10,
    textAlign: 'center',
  },
  sendToKitchenButton: {
    minHeight: 37,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E8F3EA',
    marginVertical: 9,
    gap: 7,
  },
  sendToKitchenText: {
    color: '#287143',
    fontSize: 10,
    fontWeight: '700',
  },
  menuHeading: {
    marginBottom: 8,
  },
  dishRow: {
    gap: 10,
    marginBottom: 10,
  },
  dishCard: {
    flex: 1,
    minHeight: 169,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  unavailableDishCard: {
    backgroundColor: '#F0F2F0',
    borderColor: '#E3E7E3',
  },
  dishThumbnail: {
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#EAF3EC',
    marginBottom: 8,
  },
  unavailableThumbnail: {
    backgroundColor: '#E8EBE8',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(57, 65, 58, 0.78)',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  dishName: {
    minHeight: 30,
    color: '#293A2F',
    fontSize: 10,
    fontWeight: '700',
  },
  unavailableText: {
    color: '#929C94',
  },
  dishPrice: {
    color: '#52705B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 7,
  },
  quantityControl: {
    height: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9,
    backgroundColor: '#EAF3EC',
    marginTop: 'auto',
  },
  quantityButton: {
    width: 31,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    color: '#287143',
    fontSize: 11,
    fontWeight: '800',
  },
  addDishButton: {
    height: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#287143',
    marginTop: 'auto',
  },
  addDishText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  disabledAddButton: {
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#E1E5E1',
    marginTop: 'auto',
  },
  disabledAddText: {
    color: '#89958D',
    fontSize: 9,
    fontWeight: '700',
  },
  emptyMenu: {
    paddingVertical: 20,
  },
  emptyMenuText: {
    color: '#89958D',
    fontSize: 11,
    textAlign: 'center',
  },
  paymentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E7ECE7',
    backgroundColor: colors.surface,
  },
  totalSummary: {
    flex: 1,
  },
  totalLabel: {
    color: '#829087',
    fontSize: 10,
  },
  totalValue: {
    color: colors.primaryDark,
    fontSize: typography.sizeHeading,
    fontWeight: typography.weightHeavy,
    marginTop: 2,
  },
  paymentButton: {
    minWidth: 146,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primary,
    gap: 7,
  },
  paymentButtonDisabled: {
    backgroundColor: colors.borderStrong,
  },
  paymentButtonPressed: {
    opacity: 0.82,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
