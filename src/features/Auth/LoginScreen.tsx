import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthConText';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const  {signIn} = useAuth();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }
    // Xử lý đăng nhập ở ~
    signIn(email, password)
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          {/* Header / Logo Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Messenger</Text>
          </View>

          {/* Form Inputs Section */}
          <View style={styles.formContainer}>
            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showHideBtn}
                >
                  <Text style={styles.showHideText}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quên mật khẩu */}
            <TouchableOpacity
              onPress={() => Alert.alert('Thông báo', 'Chuyển sang trang Quên mật khẩu')}
              style={styles.forgotPasswordBtn}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Nút Đăng nhập */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Đăng Nhập</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section (Đăng ký & Mạng xã hội) */}
          <View style={styles.footerContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Link Đăng ký */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Thông báo', 'Chuyển sang trang Đăng ký')}
              >
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flex : 1 ,
    paddingHorizontal : 24,
    justifyContent : 'center'
  },
  headerContainer: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  
  formContainer: {
    marginBottom : 24
  },
  inputGroup: {
    marginBottom : 16
  },
  label: {
    fontSize : 14 ,
    fontWeight : '600',
    color : '#334155',
    marginBottom : 8
  },
  input: {
    height : 50, 
    backgroundColor : '#fff',
    borderRadius : 12,
    paddingHorizontal : 16,
    fontSize : 15,
    color : '#0F172A',
    borderWidth : 1,
    borderColor : '#E2E8F0'
  },
  passwordContainer: {
    flexDirection : 'row',
    alignItems : 'center'
  },
  showHideBtn: {
    position : 'absolute',
    right : 16
  },
  showHideText: {
    color : '#6366F1',
    fontWeight : '600',
    fontSize : 14,
  },
  forgotPasswordBtn: {
    alignSelf : 'flex-end',
    marginBottom : 20
  },
  forgotPasswordText: {
    color : '#6366F1',
    fontSize : 14,
    fontWeight : '500'
  },
  loginButton: {
    height : 52,
    backgroundColor : '#6366F1',
    borderRadius : 12,
    justifyContent : 'center',
    alignItems : 'center',
    shadowColor : '#6366F1',
    shadowOffset : {width : 0 , height : 4},
    shadowOpacity : 0.3,
    shadowRadius : 8,
    elevation : 4,
  },
  loginButtonText: {
    color : '#FFFFFF',
    fontSize : 16 ,
    fontWeight : 'bold',
  },
  footerContainer: {
    alignItems : 'center'
  },
  dividerContainer: {
    flexDirection : 'row',
    alignItems : 'center',
    marginBottom : 20
  },
  divider: {
    flex : 1 ,
    height : 1,
    backgroundColor :'#E2E8F0',
  },
  dividerText: {
    marginHorizontal : 12,
    color: '#94A3B8',
    fontSize : 13
  },
  socialButtonsRow: {
    flexDirection : 'row',
    gap : 12,
    marginBottom : 24,
    width : '100%'
  },
  socialButton: {
    flex : 1,
    height : 48,
    backgroundColor : '#fff',
    borderRadius : 12,
    justifyContent : 'center',
    alignItems : 'center',
    borderWidth : 1,
    borderColor : '#E2E8F0'

  },
  socialButtonText: {
    color : '#334155',
    fontWeight : '600',
    fontSize : 14,
  },
  registerRow: {
    flexDirection : 'row',
    alignItems : 'center'
  },
  registerText: {
    color : '#64748B',
    fontSize : 14
  },
  registerLink: {
   color : '#6366F1',
   fontWeight : 'bold',
   fontSize : 14
  },
});