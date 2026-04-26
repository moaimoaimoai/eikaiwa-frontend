import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../constants/theme';

interface TabIconProps {
  name: string;
  label: string;
  focused: boolean;
}

function TabIcon({ name, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        <Ionicons
          name={name as any}
          size={22}
          color={focused ? Colors.primary : Colors.textMuted}
        />
      </View>
      <Text
        style={[styles.tabLabel, { color: focused ? Colors.primary : Colors.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} label="ホーム" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="warmup"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'book' : 'book-outline'} label="フレーズ" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="conversation"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerTabContainer}>
              {/* 外側リング */}
              <View style={[styles.centerTabRing, focused && styles.centerTabRingActive]} />
              <View style={[styles.centerTab, focused && styles.centerTabActive]}>
                <Ionicons name="mic" size={26} color={focused ? '#fff' : Colors.textMuted} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'library' : 'library-outline'} label="単語帳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} label="分析" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    height: 88,
    paddingBottom: 18,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 56,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: Colors.primary + '18',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  centerTabRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  centerTabRingActive: {
    borderColor: Colors.primary + '50',
  },
  centerTab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  centerTabActive: {
    backgroundColor: Colors.primary,
    borderColor: 'transparent',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 10,
  },
});
