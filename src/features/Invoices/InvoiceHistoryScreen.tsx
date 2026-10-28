import Ionicons from '@react-native-vector-icons/ionicons';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvoices } from '../../context/InvoiceContext';
import { useMenu } from '../../context/MenuContext';
import type { Invoice } from '../../types/restaurant';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/types';
import { colors, typography } from '../../theme/colors';

type InvoiceNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Invoices'>,
  NativeStackNavigationProp<RootStackParamList>
>;
type InvoiceFilter = 'Tất cả' | 'Chờ thanh toán' | 'Đã thanh toán';

const filters: InvoiceFilter[] = ['Tất cả', 'Chờ thanh toán', 'Đã thanh toán'];

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function formatTableNumber(tableNumber: number) {
  return String(tableNumber).padStart(2, '0');
}

function InvoiceHistoryScreen() {
  const navigation = useNavigation<InvoiceNavigation>();
  const { invoices } = useInvoices();
  const { dishes } = useMenu();
  const [filter, setFilter] = useState<InvoiceFilter>('Tất cả');

  const filteredInvoices = useMemo(
    () =>
      [...invoices]
        .filter(invoice => {
          if (filter === 'Chờ thanh toán') {
            return invoice.status === 'Đang phục vụ';
          }
          if (filter === 'Đã thanh toán') {
            return invoice.status === 'Đã thanh toán';
          }
          return true;
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [filter, invoices],
  );
  const waitingCount = invoices.filter(
    invoice => invoice.status === 'Đang phục vụ',
  ).length;
  const paidCount = invoices.filter(
    invoice => invoice.status === 'Đã thanh toán',
  ).length;

  const getInvoiceTotal = (invoice: Invoice) => {
    if (invoice.payment) {
      return invoice.payment.total;
    }
    const subtotal = invoice.items.reduce((sum, item) => {
      const dish = dishes.find(menuItem => menuItem.id === item.dishId);
      return sum + (dish ? dish.price * item.quantity : 0);
    }, 0);
    return subtotal + Math.round(subtotal * 0.08);
  };

  const getInvoiceItemLabel = (invoice: Invoice) =>
    invoice.items
      .map(item => {
        const dish =
          dishes.find(menuItem => menuItem.id === item.dishId)?.name ??
          item.dishName ??
          'Món ăn';
        return `${dish} × ${item.quantity}`;
      })
      .join(' · ');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NHÀ HÀNG</Text>
            <Text style={styles.title}>Hoá đơn</Text>
            <Text style={styles.subtitle}>Lịch sử và thanh toán đang chờ</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, styles.waitingIcon]}>
              <Ionicons name="time-outline" size={17} color={colors.warning} />
            </View>
            <Text style={styles.summaryNumber}>{waitingCount}</Text>
            <Text style={styles.summaryLabel}>Chờ thanh toán</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, styles.paidIcon]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={colors.success}
              />
            </View>
            <Text style={styles.summaryNumber}>{paidCount}</Text>
            <Text style={styles.summaryLabel}>Đã thanh toán</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map(item => {
            const selected = filter === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item)}
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
          })}
        </View>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Danh sách hoá đơn</Text>
          <Text style={styles.countText}>
            {filteredInvoices.length} hoá đơn
          </Text>
        </View>

        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="receipt-outline"
              size={32}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Chưa có hoá đơn</Text>
            <Text style={styles.emptySubtitle}>
              Hoá đơn sẽ xuất hiện ở đây khi có đơn hàng.
            </Text>
          </View>
        ) : (
          filteredInvoices.map(invoice => {
            const isPaid = invoice.status === 'Đã thanh toán';
            const quantity = invoice.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            return (
              <Pressable
                key={invoice.id}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('Payment', { invoiceId: invoice.id })
                }
                style={({ pressed }) => [
                  styles.invoiceCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.invoiceTop}>
                  <View style={styles.invoiceTitleGroup}>
                    <View
                      style={[
                        styles.invoiceIcon,
                        isPaid ? styles.paidIcon : styles.waitingIcon,
                      ]}
                    >
                      <Ionicons
                        name={isPaid ? 'receipt-outline' : 'restaurant-outline'}
                        size={18}
                        color={isPaid ? colors.success : colors.warning}
                      />
                    </View>
                    <View>
                      <Text style={styles.invoiceTitle}>
                        Bàn {formatTableNumber(invoice.tableNumber)}
                        {invoice.guestCount
                          ? ` · ${invoice.guestCount} khách`
                          : ''}
                      </Text>
                      <Text style={styles.invoiceMeta}>
                        {invoice.createdAt} · {quantity} món
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isPaid ? styles.statusPaid : styles.statusWaiting,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isPaid
                          ? styles.statusPaidText
                          : styles.statusWaitingText,
                      ]}
                    >
                      {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </Text>
                  </View>
                </View>

                <Text numberOfLines={2} style={styles.itemsText}>
                  {getInvoiceItemLabel(invoice) || 'Chưa có món'}
                </Text>

                <View style={styles.invoiceBottom}>
                  <View>
                    <Text style={styles.totalLabel}>
                      {invoice.payment
                        ? `Đã thu · ${invoice.payment.method}`
                        : 'Tổng tạm tính · gồm VAT 8%'}
                    </Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(getInvoiceTotal(invoice))}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default InvoiceHistoryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 19,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: typography.sizeCaption,
    fontWeight: typography.weightBold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: colors.textStrong,
    fontSize: typography.sizeTitle,
    fontWeight: typography.weightHeavy,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizeSmall,
    marginTop: 3,
  },
  headerIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 17,
  },
  summaryCard: {
    flex: 1,
    minHeight: 103,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  waitingIcon: {
    backgroundColor: colors.warningLight,
  },
  paidIcon: {
    backgroundColor: colors.successLight,
  },
  summaryNumber: {
    color: colors.textStrong,
    fontSize: typography.sizeHeading,
    fontWeight: typography.weightHeavy,
    marginTop: 5,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 18,
  },
  filterChip: {
    flex: 1,
    minHeight: 35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#EAEFEB',
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: typography.weightSemibold,
  },
  filterTextSelected: {
    color: colors.white,
  },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightBold,
  },
  countText: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
  },
  invoiceCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pressed: {
    opacity: 0.8,
  },
  invoiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invoiceIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    marginRight: 9,
  },
  invoiceTitle: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
  },
  invoiceMeta: {
    color: colors.textMuted,
    fontSize: typography.sizeCaption,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  statusPaid: {
    backgroundColor: colors.successLight,
  },
  statusWaiting: {
    backgroundColor: colors.warningLight,
  },
  statusText: {
    fontSize: 9,
    fontWeight: typography.weightBold,
  },
  statusPaidText: {
    color: colors.success,
  },
  statusWaitingText: {
    color: colors.warning,
  },
  itemsText: {
    color: colors.textSecondary,
    fontSize: typography.sizeCaption,
    lineHeight: 16,
    marginTop: 12,
    marginBottom: 11,
  },
  invoiceBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  totalValue: {
    color: colors.primaryDark,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightHeavy,
    marginTop: 3,
  },
  emptyCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizeSubtitle,
    fontWeight: typography.weightBold,
    marginTop: 10,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizeSmall,
    textAlign: 'center',
    marginTop: 5,
  },
});
