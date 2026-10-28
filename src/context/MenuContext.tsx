import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { dishList as initialDishList } from '../data/dishList';
import type { Dish } from '../types/restaurant';
import { isDishList } from '../storage/restaurantDataValidation';
import { colors } from '../theme/colors';

const STORAGE_KEY = '@myapp/menu-v1';

type MenuContextValue = {
  dishes: Dish[];
  addDish: (dish: Omit<Dish, 'id'>) => void;
  updateDish: (dish: Dish) => void;
  toggleAvailability: (dishId: string) => void;
  deleteDish: (dishId: string) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [dishes, setDishes] = useState(initialDishList);
  const [isReady, setIsReady] = useState(false);
  const [canPersist, setCanPersist] = useState(false);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    const loadDishes = async () => {
      try {
        const storedDishes = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedDishes !== null) {
          const parsedDishes: unknown = JSON.parse(storedDishes);
          if (!isDishList(parsedDishes)) {
            throw new Error('Dữ liệu thực đơn đã lưu không đúng định dạng.');
          }
          if (isMounted) {
            setDishes(parsedDishes);
          }
        }
        if (isMounted) {
          setCanPersist(true);
        }
      } catch (error) {
        Alert.alert(
          'Không thể tải thực đơn',
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi không xác định.',
        );
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    loadDishes().catch(error => {
      Alert.alert(
        'Không thể tải thực đơn',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không xác định.',
      );
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !canPersist) {
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dishes)))
      .catch(error => {
        Alert.alert(
          'Không thể lưu thực đơn',
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi không xác định.',
        );
      });
  }, [canPersist, dishes, isReady]);

  const value = useMemo<MenuContextValue>(
    () => ({
      dishes,
      addDish: dish => {
        setDishes(current => [
          ...current,
          {
            ...dish,
            id: `dish_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          },
        ]);
      },
      updateDish: updatedDish => {
        setDishes(current =>
          current.map(dish =>
            dish.id === updatedDish.id ? updatedDish : dish,
          ),
        );
      },
      toggleAvailability: dishId => {
        setDishes(current =>
          current.map(dish =>
            dish.id === dishId ? { ...dish, available: !dish.available } : dish,
          ),
        );
      },
      deleteDish: dishId => {
        setDishes(current => current.filter(dish => dish.id !== dishId));
      },
    }),
    [dishes],
  );

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used inside MenuProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
