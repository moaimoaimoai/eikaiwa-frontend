/**
 * AppBackground
 * 画面全体に背景を描画するコンポーネント。
 *
 * withPhoto={true} の場合:
 *   欧米風景写真プール(12枚) からランダムに1枚を選択して表示。
 *   写真はビルド時に事前ブラー済み (ImageMagick σ=18)。
 *   グラデーションオーブ・メッシュをオーバーレイして色調を統一。
 *
 * withPhoto={false} (デフォルト):
 *   純粋なネビュラグラデーション背景。
 *
 * variant:
 *   'default' — ディープパープル × インディゴ × ローズ
 *   'warm'    — アンバー × マゼンタ × パープル
 *   'cool'    — サイアン × インディゴ × ティール
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ImageBackground, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type BackgroundVariant = 'default' | 'warm' | 'cool';

/* ─────────────────────────────────────────────────────────────
   写真プール — 欧米風景 12 枚 (事前ブラー済み・828×1792px)
───────────────────────────────────────────────────────────── */
const BG_PHOTOS: ImageSourcePropType[] = [
  require('../../assets/bg/bg01.jpg'), // NYC ブルックリンブリッジ 夜
  require('../../assets/bg/bg02.jpg'), // NYC ストリート
  require('../../assets/bg/bg03.jpg'), // ボローニャ 夕暮れ
  require('../../assets/bg/bg04.jpg'), // メルボルン ブルーアワー
  require('../../assets/bg/bg05.jpg'), // シカゴ 夜の俯瞰
  require('../../assets/bg/bg06.jpg'), // フィレンツェ ドゥオーモ
  require('../../assets/bg/bg07.jpg'), // ノイシュバンシュタイン城
  require('../../assets/bg/bg08.jpg'), // ハルシュタット オーストリア
  require('../../assets/bg/bg09.jpg'), // イタリア丘の上の街
  require('../../assets/bg/bg10.jpg'), // ノルウェーの街並み
  require('../../assets/bg/bg11.jpg'), // NYC 空撮
  require('../../assets/bg/bg12.jpg'), // ブレッド湖 スロベニア
];

/* ─────────────────────────────────────────────────────────────
   NebulaOrb — 12 層同心円でエッジレスグロー
───────────────────────────────────────────────────────────── */
interface NebulaOrbProps {
  size: number;
  color: string;
  opacity?: number; // 全体スケール (写真モード時は下げる)
  style?: object;
}

function NebulaOrb({ size, color, opacity = 1, style }: NebulaOrbProps) {
  const layers = [
    { scale: 1.00, op: 0.008 },
    { scale: 0.91, op: 0.018 },
    { scale: 0.82, op: 0.030 },
    { scale: 0.73, op: 0.046 },
    { scale: 0.64, op: 0.064 },
    { scale: 0.55, op: 0.082 },
    { scale: 0.46, op: 0.098 },
    { scale: 0.37, op: 0.112 },
    { scale: 0.28, op: 0.124 },
    { scale: 0.20, op: 0.134 },
    { scale: 0.13, op: 0.142 },
    { scale: 0.07, op: 0.150 },
  ];
  return (
    <View
      style={[{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      pointerEvents="none"
    >
      {layers.map(({ scale, op }, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            backgroundColor: color,
            opacity: op * opacity,
          }}
        />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   Palette 定義
───────────────────────────────────────────────────────────── */
interface OrbConfig {
  size: number; color: string;
  top?: number | string; bottom?: number | string;
  left?: number | string; right?: number | string;
}
interface MeshLayer {
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
}
interface PaletteConfig {
  base: readonly [string, string, string];
  orbs: OrbConfig[];
  hazeColor: string;
  meshLayers: MeshLayer[];
  overlay: string;
  photoOverlay: string; // 写真モード用の強めオーバーレイ
}

const PALETTES: Record<BackgroundVariant, PaletteConfig> = {
  /* ─── Default: Deep Purple × Indigo × Rose ─── */
  default: {
    base: ['#06051A', '#0A0822', '#050514'],
    orbs: [
      { size: 1000, color: '#6D28D9', top: -400, right: -380 },
      { size:  880, color: '#3730A3', bottom: -320, left: -300 },
      { size:  680, color: '#BE185D', top: '32%', right: -280 },
    ],
    hazeColor: 'rgba(4, 3, 18, 0.18)',
    meshLayers: [
      { colors: ['rgba(109,40,217,0.32)', 'rgba(67,56,202,0.10)', 'transparent'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { colors: ['transparent', 'rgba(99,102,241,0.24)', 'rgba(79,70,229,0.08)'], start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
      { colors: ['rgba(190,24,93,0.12)', 'transparent', 'rgba(139,92,246,0.14)'], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
    ],
    overlay: 'rgba(3, 2, 16, 0.38)',
    photoOverlay: 'rgba(4, 2, 20, 0.42)',
  },

  /* ─── Warm: Amber × Magenta × Purple ─── */
  warm: {
    base: ['#0D0610', '#140919', '#08060D'],
    orbs: [
      { size:  980, color: '#B45309', top: -380, left: -340 },
      { size:  860, color: '#A21CAF', bottom: -300, right: -300 },
      { size:  660, color: '#C2410C', top: '36%', left: -260 },
    ],
    hazeColor: 'rgba(5, 2, 10, 0.18)',
    meshLayers: [
      { colors: ['rgba(180,83,9,0.30)', 'rgba(194,65,12,0.10)', 'transparent'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { colors: ['transparent', 'rgba(162,28,175,0.30)', 'rgba(126,34,206,0.12)'], start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
      { colors: ['rgba(245,158,11,0.14)', 'transparent', 'rgba(147,51,234,0.16)'], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
    ],
    overlay: 'rgba(5, 2, 10, 0.40)',
    photoOverlay: 'rgba(8, 3, 14, 0.42)',
  },

  /* ─── Cool: Cyan × Indigo × Teal ─── */
  cool: {
    base: ['#030C1A', '#050A18', '#020914'],
    orbs: [
      { size:  980, color: '#0369A1', top: -380, right: -360 },
      { size:  860, color: '#3730A3', bottom: -310, left: -300 },
      { size:  660, color: '#0F766E', top: '34%', right: -260 },
    ],
    hazeColor: 'rgba(1, 4, 15, 0.18)',
    meshLayers: [
      { colors: ['rgba(3,105,161,0.32)', 'rgba(56,189,248,0.10)', 'transparent'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { colors: ['transparent', 'rgba(55,48,163,0.26)', 'rgba(67,56,202,0.10)'], start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
      { colors: ['rgba(15,118,110,0.16)', 'transparent', 'rgba(99,102,241,0.14)'], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
    ],
    overlay: 'rgba(1, 4, 15, 0.38)',
    photoOverlay: 'rgba(2, 5, 18, 0.42)',
  },
};

/* ─────────────────────────────────────────────────────────────
   AppBackground
   描画順 (withPhoto=true):
     1. 写真 (事前ブラー済み)
     2. photoOverlay (写真をダーク化 → テキスト可読性確保)
     3. NebulaOrbs (色調オーバーレイ・控えめ)
     4. Soft Haze
     5. Mesh Gradients (色の方向感)
     6. Dark Overlay

   描画順 (withPhoto=false):
     1. Base Gradient
     2. NebulaOrbs (フル強度)
     3. Soft Haze
     4. Mesh Gradients
     5. Dark Overlay
───────────────────────────────────────────────────────────── */
interface AppBackgroundProps {
  variant?: BackgroundVariant;
  withPhoto?: boolean;
}

export function AppBackground({ variant = 'default', withPhoto = false }: AppBackgroundProps) {
  const p = PALETTES[variant];

  // 日付ベースで1日1枚固定 (全画面共通・翌日になったら変わる)
  const photo = useMemo(() => {
    const d = new Date();
    const seed =
      d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return BG_PHOTOS[seed % BG_PHOTOS.length];
  }, []);

  // 写真モードではオーブの強度を下げてグラデーションを主役にしない
  const orbOpacity = withPhoto ? 0.55 : 1.0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* ── 1. ベース (写真 or グラデーション) ── */}
      {withPhoto ? (
        <ImageBackground
          source={photo}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          {/* 写真の上に色調オーバーレイ → テキスト可読性 + バリアント色味付け */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: p.photoOverlay }]} />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={p.base}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* ── 2. NebulaOrbs ── */}
      {p.orbs.map((orb, i) => (
        <NebulaOrb
          key={`orb-${i}`}
          size={orb.size}
          color={orb.color}
          opacity={orbOpacity}
          style={{ top: orb.top, bottom: orb.bottom, left: orb.left, right: orb.right }}
        />
      ))}

      {/* ── 3. Soft Haze ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.hazeColor }]} />

      {/* ── 4. Mesh Gradients ── */}
      {p.meshLayers.map((layer, i) => (
        <LinearGradient
          key={`mesh-${i}`}
          colors={layer.colors}
          style={StyleSheet.absoluteFill}
          start={layer.start}
          end={layer.end}
        />
      ))}

      {/* ── 5. Dark Overlay ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.overlay }]} />
    </View>
  );
}
