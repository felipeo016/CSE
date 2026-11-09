import { Tabs } from 'expo-router';
export default function TabsLayout() {
  return <Tabs>
    <Tabs.Screen
      name="index"
      options={{ title: 'Lugares para explorar' }}
    />
    <Tabs.Screen
      name="guardados"
      options={{ title: 'Lugares guardados' }}
    />
  </Tabs>;
}
