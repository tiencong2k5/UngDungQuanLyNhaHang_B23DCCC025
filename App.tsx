import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthConText';
import { InvoiceProvider } from './src/context/InvoiceContext';
import { MenuProvider } from './src/context/MenuContext';
import RootNavigator from './src/navigation/RootNavigator';
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MenuProvider>
          <InvoiceProvider>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />
            <RootNavigator />
          </InvoiceProvider>
        </MenuProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
