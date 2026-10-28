const { jest: jestMock } = require('@jest/globals');

jestMock.mock('@react-native-vector-icons/ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockIonicons({ name }) {
    return React.createElement(Text, null, name);
  };
});

jestMock.mock('@react-native-async-storage/async-storage', () => {
  const { jest: mockJest } = require('@jest/globals');

  return {
    __esModule: true,
    default: {
      getItem: mockJest.fn().mockResolvedValue(null),
      setItem: mockJest.fn().mockResolvedValue(undefined),
    },
  };
});
