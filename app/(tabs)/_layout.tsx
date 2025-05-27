import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, Text, Icon } from 'react-native-paper';
import ScheduleScreen from './schedule';
import MedicineScreen from './medicine';
import ProfileScreen from './profile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarStyle: {
              borderTopWidth: 1,
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outline,
              height: 68 + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 6,
            },
            tabBarIconStyle: {
              marginBottom: -2,
            }
          }}
        >
      <Tab.Screen
        name="schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon source="calendar" size={28} color={color} />,
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 15,
                fontWeight: focused ? '700' : '500',
                color,
              }}
            >
              {t.scheduleTitle}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="medicine"
        component={MedicineScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon source="pill" size={28} color={color} />,
          tabBarLabel: ({ color, focused }) => (
          <Text
            style={{
              fontSize: 15,
              fontWeight: focused ? '700' : '500',
              color,
            }}
          >
            {t.medicineTitle}
          </Text>
        )
        }}
      />
      <Tab.Screen
        name="profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon source="account" size={28} color={color} />,
          tabBarLabel: ({ color, focused }) => (
          <Text
            style={{
              fontSize: 15,
              fontWeight: focused ? '700' : '500',
              color,
            }}
          >
            {t.profileTitle}
          </Text>
        )
        }}
      />
    </Tab.Navigator>
  );
}
