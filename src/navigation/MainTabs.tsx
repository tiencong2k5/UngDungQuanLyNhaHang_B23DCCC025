import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet } from 'react-native';
import InvoiceHistoryScreen from '../features/Invoices/InvoiceHistoryScreen';
import MenuManagementScreen from '../features/Menu/MenuManagementScreen';
import TableMapScreen from '../features/Tables/TableMapScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TablesTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="grid-outline" color={color} size={size} />;
}

function MenuTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="restaurant-outline" color={color} size={size} />;
}

function InvoicesTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="receipt-outline" color={color} size={size} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#166534',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Tables"
        component={TableMapScreen}
        options={{
          title: 'Sơ đồ bàn',
          tabBarIcon: TablesTabIcon,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuManagementScreen}
        options={{
          title: 'Thực đơn',
          tabBarIcon: MenuTabIcon,
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoiceHistoryScreen}
        options={{
          title: 'Hoá đơn',
          tabBarIcon: InvoicesTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export default MainTabs;

const styles = StyleSheet.create({
  tabBar: {
    height: 66,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopColor: '#E8EDF2',
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
