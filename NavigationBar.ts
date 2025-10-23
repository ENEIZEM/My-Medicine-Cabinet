import { NativeModules } from 'react-native';

const { NavigationBarModule } = NativeModules as {
  NavigationBarModule?: {
    getNavigationBarHeight?: () => Promise<number>;
  }
};

export default {
  getHeight: async (): Promise<number> => {
    if (!NavigationBarModule?.getNavigationBarHeight) return 0;
    try {
      const heightPx = await NavigationBarModule.getNavigationBarHeight();
      return heightPx;
    } catch {
      return 0;
    }
  },
};