import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { MenuProvider, useMenu } from '../src/context/MenuContext';

beforeEach(() => {
  jest.mocked(AsyncStorage.getItem).mockReset().mockResolvedValue(null);
  jest.mocked(AsyncStorage.setItem).mockReset().mockResolvedValue(undefined);
});

test('restores saved dishes and persists menu changes', async () => {
  const savedDish = {
    id: 'saved_dish',
    name: 'Món lưu',
    category: 'Món chính',
    price: 60000,
    available: true,
  };
  jest
    .mocked(AsyncStorage.getItem)
    .mockResolvedValue(JSON.stringify([savedDish]));

  let menu: ReturnType<typeof useMenu> | undefined;

  function Probe() {
    menu = useMenu();
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <MenuProvider>
        <Probe />
      </MenuProvider>,
    );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  expect(AsyncStorage.getItem).toHaveBeenCalledWith('@myapp/menu-v1');
  expect(menu?.dishes).toEqual([savedDish]);

  await ReactTestRenderer.act(async () => {
    menu?.addDish({
      name: 'Món mới',
      category: 'Khai vị',
      price: 30000,
      available: true,
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  expect(menu?.dishes).toHaveLength(2);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    '@myapp/menu-v1',
    expect.stringContaining('"name":"Món mới"'),
  );

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});
