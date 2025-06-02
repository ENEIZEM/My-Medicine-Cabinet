export default () => ({
  expo: {
    name: 'My Medicine Cabinet',
    slug: 'my-medicine-cabinet',
    scheme: 'my-medicine-cabinet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    developmentClient: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.eneizem.mymedicinecabinet.app',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      'expo-localization',
      [
        '@react-native-community/datetimepicker',
        {
          mode: 'spinner',
          themeVariant: 'automatic',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '998bc49d-3d29-4367-86c8-673334fad2c7',
      },
    },
  },
});