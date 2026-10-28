module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-vector-icons)?|@react-navigation|react-native-safe-area-context|react-native-screens)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
