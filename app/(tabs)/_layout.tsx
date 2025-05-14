import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, Text, Icon } from 'react-native-paper';
import ScheduleScreen from './schedule';
import MedicineScreen from './medicine';
import ProfileScreen from './profile';
import { useLanguage } from '@/contexts/LanguageContext';

const Tab = createBottomTabNavigator();

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline
        },
        tabBarIconStyle: {
          marginBottom: -4
        },
        tabBarLabel: ({ color, focused, children }) => (
          <Text
            style={{
              color,
              fontSize: 12,
              marginBottom: 4,
              fontWeight: focused ? '600' : '400'
            }}
          >
            {children}
          </Text>
        )
      }}
    >
      <Tab.Screen
        name="schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon source="calendar" size={24} color={color} />
          ),
          tabBarLabel: t.scheduleTitle
        }}
      />
      <Tab.Screen
        name="medicine"
        component={MedicineScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon source="pill" size={24} color={color} />
          ),
          tabBarLabel: t.scheduleTitle
        }}
      />
      <Tab.Screen
        name="profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon source="account" size={24} color={color} />
          ),
          tabBarLabel: t.scheduleTitle
        }}
      />
    </Tab.Navigator>
  );
}