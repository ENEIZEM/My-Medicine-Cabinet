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
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#2C2C2C',
        },
      ],
      'expo-localization',
      [
        "expo-notifications",
        {
          "icon": "./assets/notification/icon.png",
          "color": "#ff0000",
          "sounds": ["./assets/notification/sound.wav"]
        }
      ]
    ],
    android: {
      windowSoftInputMode: 'adjustNothing',
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.eneizem.mymedicinecabinet.app',
      // 🔔 Добавляем разрешения для уведомлений
      permissions: [
        "android.permission.POST_NOTIFICATIONS"
      ]
    },

    // 🔔 Добавляем настройки для iOS
    ios: {
      supportsTablet: true,
      // 🔔 Добавляем background modes для уведомлений
      infoPlist: {
        "UIBackgroundModes": ["remote-notification"]
      }
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

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