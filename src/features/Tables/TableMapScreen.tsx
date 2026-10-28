import Ionicons from '@react-native-vector-icons/ionicons';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvoices } from '../../context/InvoiceContext';
import { useMenu } from '../../context/MenuContext';
import type { Invoice } from '../../types/restaurant';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/types';
import { colors, typography } from '../../theme/colors';

type TableMapNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Tables'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TableStatus = {
  number: number;
  invoice?: Invoice;
  total: number;
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function TableMapScreen() {
  const navigation = useNavigation<TableMapNavigation>();
  const { dishes } = useMenu();
  const { invoices } = useInvoices();
  const activeInvoices = invoices.filter(
    invoice => invoice.status === 'Đang phục vụ',
  );
  const tables: TableStatus[] = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    const invoice = activeInvoices.find(item => item.tableNumber === number);
    const total =
      invoice?.items.reduce((sum, item) => {
        const dish = dishes.find(menuItem => menuItem.id === item.dishId);
        return sum + (dish ? dish.price * item.quantity : 0);
      }, 0) ?? 0;

    return { number, invoice, total };
  });
  const occupiedCount = tables.filter(table => table.invoice).length;

  const openOrder = (table: TableStatus) => {
    navigation.navigate('Order', {
      tableNumber: table.number,
      isOccupied: Boolean(table.invoice),
    });
  };

  const openTableActions = (table: TableStatus) => {
    navigation.navigate('TableActions', { tableNumber: table.number });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={tables}
        keyExtractor={table => String(table.number)}
        numColumns={2}
        columnWrapperStyle={styles.tableRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>NHÀ HÀNG</Text>
                <Text style={styles.title}>Sơ đồ bàn</Text>
                <Text style={styles.subtitle}>Quản lý khu vực phục vụ</Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="restaurant-outline" size={25} color="#166534" />
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.summaryLabel}>TÌNH TRẠNG HÔM NAY</Text>
              </View>
              <View style={styles.summaryNumbers}>
                <View>
                  <Text style={styles.summaryValue}>
                    {occupiedCount}
                    <Text style={styles.summaryTotal}> / {tables.length}</Text>
                  </Text>
                  <Text style={styles.summaryCaption}>bàn đang phục vụ</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View>
                  <Text style={styles.summaryValue}>
                    {tables.length - occupiedCount}
                  </Text>
                  <Text style={styles.summaryCaption}>bàn còn trống</Text>
                </View>
              </View>
              <View style={styles.summaryProgressTrack}>
                <View
                  style={[
                    styles.summaryProgress,
                    { width: `${(occupiedCount / tables.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Khu vực bàn</Text>
                <Text style={styles.sectionSubtitle}>
                  Chạm để gọi món · Giữ để chuyển/gộp bàn
                </Text>
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.availableDot]} />
                  <Text style={styles.legendText}>Trống</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.occupiedDot]} />
                  <Text style={styles.legendText}>Có khách</Text>
                </View>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isOccupied = Boolean(item.invoice);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isOccupied
                  ? `Bàn ${
                      item.number
                    }, đang phục vụ, tạm tính ${formatCurrency(item.total)}`
                  : `Bàn ${item.number}, đang trống`
              }
              delayLongPress={350}
              onLongPress={() => openTableActions(item)}
              onPress={() => openOrder(item)}
              style={({ pressed }) => [
                styles.tableCard,
                isOccupied && styles.occupiedCard,
                pressed && styles.pressedCard,
              ]}
            >
              <View style={styles.tableCardTop}>
                <View
                  style={[
                    styles.tableIcon,
                    isOccupied ? styles.occupiedIcon : styles.availableIcon,
                  ]}
                >
                  <Ionicons
                    name={isOccupied ? 'people-outline' : 'restaurant-outline'}
                    size={21}
                    color={isOccupied ? '#B45309' : '#64756A'}
                  />
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isOccupied ? styles.occupiedBadge : styles.availableBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isOccupied ? styles.occupiedDot : styles.availableDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isOccupied
                        ? styles.occupiedStatusText
                        : styles.availableStatusText,
                    ]}
                  >
                    {isOccupied ? 'Có khách' : 'Trống'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tableName}>Bàn {item.number}</Text>
              {isOccupied ? (
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceMeta}>
                    {item.invoice?.items.reduce(
                      (count, invoiceItem) => count + invoiceItem.quantity,
                      0,
                    )}{' '}
                    món
                  </Text>
                  <Text style={styles.invoiceTotal}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.availableHint}>Sẵn sàng đón khách</Text>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.cardAction}>
                  {isOccupied ? 'Xem hoá đơn' : 'Tạo đơn mới'}
                </Text>
                <Ionicons name="chevron-forward" size={15} color="#98A39C" />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

export default TableMapScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 20,
  },
  eyebrow: {
    color: '#799082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: {
    color: colors.textStrong,
    fontSize: typography.sizeTitle,
    fontWeight: typography.weightHeavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#77847B',
    fontSize: 13,
    marginTop: 3,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F1E7',
  },
  summaryCard: {
    backgroundColor: '#176B3A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 25,
    overflow: 'hidden',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: 9,
  },
  summaryLabel: {
    color: '#D5EBDD',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  summaryNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  summaryTotal: {
    color: '#BBD8C4',
    fontSize: 17,
    fontWeight: '600',
  },
  summaryCaption: {
    color: '#D5EBDD',
    fontSize: 11,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 37,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 28,
  },
  summaryProgressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
  },
  summaryProgress: {
    height: 5,
    borderRadius: 5,
    backgroundColor: '#C8F07A',
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#1C2A21',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#829087',
    fontSize: 11,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  availableDot: {
    backgroundColor: '#62816B',
  },
  occupiedDot: {
    backgroundColor: '#D97706',
  },
  legendText: {
    color: '#758279',
    fontSize: 11,
  },
  tableRow: {
    gap: 12,
    marginBottom: 12,
  },
  tableCard: {
    flex: 1,
    minHeight: 155,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#14251A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  occupiedCard: {
    borderColor: '#F2D2A9',
    backgroundColor: '#FFFCF7',
  },
  pressedCard: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  tableCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tableIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableIcon: {
    backgroundColor: '#EFF3EF',
  },
  occupiedIcon: {
    backgroundColor: '#FFF0D9',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
  },
  availableBadge: {
    backgroundColor: '#F1F4F1',
  },
  occupiedBadge: {
    backgroundColor: '#FFF0D9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  availableStatusText: {
    color: '#64756A',
  },
  occupiedStatusText: {
    color: '#A85D0A',
  },
  tableName: {
    color: '#1C2A21',
    fontSize: 16,
    fontWeight: '700',
  },
  availableHint: {
    color: '#89958D',
    fontSize: 10,
    marginTop: 3,
    marginBottom: 9,
  },
  invoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    marginBottom: 9,
  },
  invoiceMeta: {
    color: '#77847B',
    fontSize: 10,
  },
  invoiceTotal: {
    color: '#A85D0A',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9EDE9',
  },
  cardAction: {
    color: '#607267',
    fontSize: 10,
    fontWeight: '600',
  },
});
