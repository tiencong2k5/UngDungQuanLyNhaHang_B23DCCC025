import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import OrderScreen from '../features/Orders/OrderScreen';
import DishFormScreen from '../features/Menu/DishFormScreen';
import PaymentScreen from '../features/Payments/PaymentScreen';
import PlaceholderScreen from '../features/Placeholder/PlaceholderScreen';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function TableActionsPlaceholder({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'TableActions'>) {
  return (
    <PlaceholderScreen
      title={`Chuyển / gộp bàn ${route.params.tableNumber}`}
      description="Chọn bàn đích để chuyển khách hoặc gộp hoá đơn."
      onBack={() => navigation.goBack()}
    />
  );
}

function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Order" component={OrderScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="TableActions" component={TableActionsPlaceholder} />
        <Stack.Screen name="DishForm" component={DishFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
