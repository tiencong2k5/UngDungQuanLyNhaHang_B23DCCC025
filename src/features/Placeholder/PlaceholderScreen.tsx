import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  onBack: () => void;
};

function PlaceholderScreen({
  title,
  description,
  onBack,
}: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại sơ đồ bàn"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={21} color="#26372C" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct-outline" size={30} color="#39744A" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.note}>
          Màn hình này sẽ được hoàn thiện ở bước tiếp theo.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default PlaceholderScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F5',
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
    color: '#243329',
    fontSize: 15,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 54,
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 25,
    backgroundColor: '#E4F1E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#1C2A21',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#627168',
    fontSize: 14,
    textAlign: 'center',
  },
  note: {
    color: '#97A29A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
