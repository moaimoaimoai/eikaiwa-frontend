import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface TabIconProps {
  name: string;
  label: string;
  focused: boolean;
}

function TabIcon({ name, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        {focused && (
          <View style={styles.tabIconGlow} />
        )}
        <Ionicons
          name={name as any}
          size={21}
          color={focused ? '#fff' : Colors.textMuted}
        />
      </View>
      <Text
        style={[styles.tabLabel, { color: focused ? Colors.primaryLight : Colors.textMuted }]}
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
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <View style={styles.tabBarBorderTop} />
          </View>
        ),
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
              {/* 外側グロー */}
              {focused && <View style={styles.centerTabGlow} />}
              <LinearGradient
                colors={focused ? ['#7C3AED', '#5B21B6'] : ['#1A1A3E', '#13132E']}
                style={[styles.centerTab, focused && styles.centerTabActive]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="mic" size={26} color={focused ? '#fff' : Colors.textMuted} />
              </LinearGradient>
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
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    height: 88,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    elevation: 0,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 30, 0.92)',
  },
  tabBarBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 56,
  },
  tabIconWrap: {
    width: 42,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  tabIconWrapActive: {},
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  /* Center tab (mic) */
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  centerTabGlow: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(124, 58, 237, 0.28)',
    // scale をなくしてボタンに密着させる（タブバー外への染み出しを防ぐ）
  },
  centerTab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  centerTabActive: {
    borderColor: 'rgba(167, 139, 250, 0.55)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
});
