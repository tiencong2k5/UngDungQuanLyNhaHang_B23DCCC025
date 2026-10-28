import Ionicons from '@react-native-vector-icons/ionicons';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvoices } from '../../context/InvoiceContext';
import { useMenu } from '../../context/MenuContext';
import type { Dish, DishCategory } from '../../types/restaurant';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/types';
import { colors, typography } from '../../theme/colors';

type MenuNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Menu'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type DishSection = {
  title: DishCategory;
  data: Dish[];
};

const categories: DishCategory[] = [
  'Khai vị',
  'Món chính',
  'Tráng miệng',
  'Đồ uống',
];

function formatCurrency(price: number) {
  return `${price.toLocaleString('vi-VN')} đ`;
}

function MenuManagementScreen() {
  const navigation = useNavigation<MenuNavigation>();
  const { dishes, toggleAvailability, deleteDish } = useMenu();
  const { invoices } = useInvoices();
  const occupiedTableCount = new Set(
    invoices
      .filter(invoice => invoice.status === 'Đang phục vụ')
      .map(invoice => invoice.tableNumber),
  ).size;

  const sections: DishSection[] = categories.map(category => ({
    title: category,
    data: dishes.filter(dish => dish.category === category),
  }));

  const openDishForm = (dishId?: string) => {
    navigation.navigate('DishForm', { dishId });
  };

  const confirmDelete = (dish: Dish) => {
    const isInActiveInvoice = invoices.some(
      invoice =>
        invoice.status === 'Đang phục vụ' &&
        invoice.items.some(item => item.dishId === dish.id),
    );

    if (isInActiveInvoice) {
      Alert.alert(
        'Không thể xoá món',
        `${dish.name} đang có trong hoá đơn phục vụ. Vui lòng thanh toán hoá đơn trước.`,
      );
      return;
    }

    Alert.alert('Xoá món ăn?', `Bạn có chắc muốn xoá "${dish.name}" không?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => deleteDish(dish.id),
      },
    ]);
  };

  const renderDish = ({ item }: { item: Dish }) => (
    <Pressable
      delayLongPress={450}
      onLongPress={() => confirmDelete(item)}
      style={({ pressed }) => [
        styles.dishRow,
        !item.available && styles.unavailableRow,
        pressed && styles.pressedRow,
      ]}
    >
      <View style={styles.dishDetails}>
        <View style={styles.nameLine}>
          <Text
            numberOfLines={1}
            style={[styles.dishName, !item.available && styles.unavailableText]}
          >
            {item.name}
          </Text>
          {!item.available && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Hết món</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.dishPrice, !item.available && styles.unavailableText]}
        >
          {formatCurrency(item.price)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sửa ${item.name}`}
        onPress={() => openDishForm(item.id)}
        hitSlop={8}
        style={styles.editButton}
      >
        <Ionicons name="create-outline" size={19} color="#64756A" />
      </Pressable>
      <Switch
        accessibilityLabel={`Trạng thái còn món của ${item.name}`}
        value={item.available}
        onValueChange={() => toggleAvailability(item.id)}
        trackColor={{ false: '#D8DED9', true: '#A8D4B2' }}
        thumbColor={item.available ? '#287143' : '#F6F7F6'}
        style={styles.switch}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderDish}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>NHÀ HÀNG</Text>
                <Text style={styles.title}>Thực đơn</Text>
                <Text style={styles.subtitle}>
                  Quản lý món ăn và tình trạng phục vụ
                </Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="restaurant-outline" size={25} color="#166534" />
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryCount}>{dishes.length} món</Text>
                <Text style={styles.summaryDot}> · </Text>
                {occupiedTableCount}/10 bàn có khách
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => openDishForm()}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Ionicons name="add" size={21} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Thêm món</Text>
            </Pressable>

            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>Danh sách món</Text>
              <Text style={styles.longPressHint}>Giữ món để xoá</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Chưa có món trong danh mục này.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default MenuManagementScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 18,
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
    fontSize: 12,
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
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: '#176B3A',
    marginBottom: 14,
  },
  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: 10,
  },
  summaryText: {
    color: '#D5EBDD',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryCount: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  summaryDot: {
    color: '#BBD8C4',
  },
  addButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#287143',
    marginBottom: 22,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  listTitle: {
    color: '#1C2A21',
    fontSize: 18,
    fontWeight: '700',
  },
  longPressHint: {
    color: '#89958D',
    fontSize: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    marginBottom: 7,
  },
  sectionTitle: {
    color: '#587060',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sectionCount: {
    color: '#718078',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8EEE8',
  },
  dishRow: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 5,
    marginBottom: 7,
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
  unavailableRow: {
    backgroundColor: '#F0F2F0',
    borderColor: '#E4E8E4',
  },
  pressedRow: {
    opacity: 0.8,
  },
  dishDetails: {
    flex: 1,
    paddingVertical: 10,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishName: {
    flexShrink: 1,
    color: '#243329',
    fontSize: 13,
    fontWeight: '700',
  },
  unavailableText: {
    color: '#9AA39C',
  },
  soldOutBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#E2E5E2',
    marginLeft: 7,
  },
  soldOutText: {
    color: '#727A73',
    fontSize: 9,
    fontWeight: '700',
  },
  dishPrice: {
    color: '#52705B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  editButton: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: {
    transform: [{ scale: 0.82 }],
    marginLeft: 1,
  },
  emptyState: {
    paddingVertical: 18,
  },
  emptyText: {
    color: '#89958D',
    fontSize: 12,
    textAlign: 'center',
  },
});
