import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="code"
        options={{
          title: 'Code',
          tabBarLabel: 'Code',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: 'Preview',
          tabBarLabel: 'Preview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="phone-portrait" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="integrations"
        options={{
          title: 'Integrations',
          tabBarLabel: 'Integrations',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="puzzle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="icons"
        options={{
          title: 'Icon Gen',
          tabBarLabel: 'Icon Gen',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="palette" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
