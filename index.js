import 'react-native-gesture-handler';                     // 1) Инициализируем gesture-handler
import { registerRootComponent } from 'expo';              // 2) Expo-ритуал
import { default as App } from 'expo-router/entry';        // 3) Точка входа Expo Router

registerRootComponent(App);