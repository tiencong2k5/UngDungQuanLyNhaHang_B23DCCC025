import Ionicons from '@react-native-vector-icons/ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMenu } from '../../context/MenuContext';
import type { DishCategory } from '../../types/restaurant';
import type { RootStackParamList } from '../../navigation/types';
import { colors, typography } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DishForm'>;
type FieldErrors = {
  name?: string;
  price?: string;
};

const categories: DishCategory[] = [
  'Khai vị',
  'Món chính',
  'Tráng miệng',
  'Đồ uống',
];

function DishFormScreen({ navigation, route }: Props) {
  const { dishes, addDish, updateDish } = useMenu();
  const existingDish = dishes.find(dish => dish.id === route.params?.dishId);
  const isEditing = Boolean(route.params?.dishId);
  const [name, setName] = useState(existingDish?.name ?? '');
  const [price, setPrice] = useState(
    existingDish ? String(existingDish.price) : '',
  );
  const [category, setCategory] = useState<DishCategory>(
    existingDish?.category ?? 'Khai vị',
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const validateName = (value: string) => {
    const trimmedName = value.trim();
    if (!trimmedName) {
      return 'Vui lòng nhập tên món.';
    }

    const duplicate = dishes.some(
      dish =>
        dish.id !== existingDish?.id &&
        dish.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    return duplicate ? 'Tên món này đã tồn tại.' : undefined;
  };

  const parsePrice = (value: string) => {
    const normalized = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
      return undefined;
    }
    return Number(normalized);
  };

  const validatePrice = (value: string) => {
    const numericPrice = parsePrice(value);
    if (numericPrice === undefined || !Number.isFinite(numericPrice)) {
      return 'Vui lòng nhập giá hợp lệ.';
    }
    if (numericPrice <= 0) {
      return 'Giá phải lớn hơn 0.';
    }
    if (numericPrice % 1000 !== 0) {
      return 'Giá phải chia hết cho 1.000.';
    }
    return undefined;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setErrors(current => ({ ...current, name: validateName(value) }));
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    setErrors(current => ({ ...current, price: validatePrice(value) }));
  };

  const handleSave = () => {
    Keyboard.dismiss();
    const nextErrors = {
      name: validateName(name),
      price: validatePrice(price),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.price) {
      return;
    }

    const numericPrice = parsePrice(price);
    if (numericPrice === undefined) {
      return;
    }

    if (existingDish) {
      updateDish({
        ...existingDish,
        name: name.trim(),
        category,
        price: numericPrice,
      });
    } else {
      addDish({
        name: name.trim(),
        category,
        price: numericPrice,
        available: true,
      });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại thực đơn"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={21} color="#26372C" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Sửa món ăn' : 'Thêm món ăn'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.introTitle}>
          {isEditing ? 'Cập nhật món ăn' : 'Món mới trong thực đơn'}
        </Text>
        <Text style={styles.introSubtitle}>
          Nhập thông tin món ăn để quản lý thực đơn của nhà hàng.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Tên món</Text>
          <TextInput
            accessibilityLabel="Tên món"
            value={name}
            onChangeText={handleNameChange}
            onBlur={() => {
              setErrors(current => ({ ...current, name: validateName(name) }));
            }}
            placeholder="Ví dụ: Cơm chiên hải sản"
            placeholderTextColor="#A0AAA2"
            style={[styles.input, errors.name && styles.inputError]}
            returnKeyType="next"
            maxLength={60}
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Giá bán</Text>
          <View
            style={[
              styles.priceInputContainer,
              errors.price && styles.inputError,
            ]}
          >
            <TextInput
              accessibilityLabel="Giá bán"
              value={price}
              onChangeText={handlePriceChange}
              onBlur={() => {
                setErrors(current => ({
                  ...current,
                  price: validatePrice(price),
                }));
              }}
              placeholder="Ví dụ: 45000"
              placeholderTextColor="#A0AAA2"
              keyboardType="decimal-pad"
              style={styles.priceInput}
              returnKeyType="done"
            />
            <Text style={styles.currencySuffix}>đ</Text>
          </View>
          <Text style={styles.helperText}>
            Giá phải lớn hơn 0 và chia hết cho 1.000.
          </Text>
          {errors.price ? (
            <Text style={styles.errorText}>{errors.price}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Loại món</Text>
          <View style={styles.categoryGrid}>
            {categories.map(item => {
              const selected = category === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryButton,
                    selected && styles.categoryButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Lưu thay đổi' : 'Thêm món'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default DishFormScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizeBody,
    fontWeight: typography.weightBold,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 36,
  },
  introTitle: {
    color: colors.textStrong,
    fontSize: typography.sizeHeading,
    fontWeight: typography.weightHeavy,
  },
  introSubtitle: {
    color: '#77847B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 25,
  },
  field: {
    marginBottom: 21,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightBold,
    marginBottom: 8,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E7E1',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    color: colors.text,
    fontSize: typography.sizeBody,
  },
  inputError: {
    borderColor: colors.danger,
  },
  priceInputContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E7E1',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  priceInput: {
    flex: 1,
    height: '100%',
    color: '#243329',
    fontSize: 14,
  },
  currencySuffix: {
    color: '#64756A',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    color: '#89958D',
    fontSize: 10,
    marginTop: 6,
  },
  errorText: {
    color: '#C64036',
    fontSize: 11,
    marginTop: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  categoryButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E7E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  categoryButtonSelected: {
    borderColor: '#287143',
    backgroundColor: '#E4F1E7',
  },
  categoryText: {
    color: '#607267',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#176B3A',
    fontWeight: '700',
  },
  saveButton: {
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#287143',
    marginTop: 7,
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
