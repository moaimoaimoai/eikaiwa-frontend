/**
 * AppBackground
 * 画面全体に Aurora / Nebula グラデーション背景を描画するコンポーネント。
 * SafeAreaView の直下に配置し、pointerEvents="none" で操作を透過。
 *
 * ブラーなしで「エッジが見えない」を実現する技術:
 *   1. NebulaOrb — 12層同心円で opacity 0.008 → 0.15 の極めて緩やかな曲線
 *      最外層がほぼ透明なため 0 → 色 の境界が人間の目で検知不能
 *   2. 巨大サイズ (900〜1100px) — エッジが画面外に押し出される
 *   3. Soft Haze Layer — オーブ上に薄暗いオーバーレイを挿入し残像を消す
 *   4. Mesh Gradient — 方向感と色の奥行きを追加
 *
 * variant:
 *   'default' — ディープパープル × インディゴ × ローズ
 *   'warm'    — アンバー × マゼンタ × パープル
 *   'cool'    — サイアン × インディゴ × ティール
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type BackgroundVariant = 'default' | 'warm' | 'cool';

/* ─────────────────────────────────────────────────────────────
   NebulaOrb
   12 層の同心円で Gaussian Blur を模倣。
   opacity カーブを二次曲線的に設計:
     外側 (scale 1.0) → 0.008  ≈ 完全透明
     内側 (scale 0.1) → 0.150  ← グローの核
   これにより円の「縁」が人間の目で視認できなくなる。
───────────────────────────────────────────────────────────── */
interface NebulaOrbProps {
  size: number;
  color: string;
  style?: object;
}

function NebulaOrb({ size, color, style }: NebulaOrbProps) {
  const layers = [
    { scale: 1.00, opacity: 0.008 }, // ← ほぼ透明: エッジを消す
    { scale: 0.91, opacity: 0.018 },
    { scale: 0.82, opacity: 0.030 },
    { scale: 0.73, opacity: 0.046 },
    { scale: 0.64, opacity: 0.064 },
    { scale: 0.55, opacity: 0.082 },
    { scale: 0.46, opacity: 0.098 },
    { scale: 0.37, opacity: 0.112 },
    { scale: 0.28, opacity: 0.124 },
    { scale: 0.20, opacity: 0.134 },
    { scale: 0.13, opacity: 0.142 },
    { scale: 0.07, opacity: 0.150 }, // ← グローの核
  ];

  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      pointerEvents="none"
    >
      {layers.map(({ scale, opacity }, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            backgroundColor: color,
            opacity,
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
  size: number;
  color: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
}

interface MeshLayer {
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface PaletteConfig {
  base: readonly [string, string, string];
  orbs: OrbConfig[];
  hazeColor: string;       // オーブ上のソフトヘイズ色
  meshLayers: MeshLayer[];
  overlay: string;
}

const PALETTES: Record<BackgroundVariant, PaletteConfig> = {
  /* ─── Default: Deep Purple × Indigo × Rose ─── */
  default: {
    base: ['#06051A', '#0A0822', '#050514'],
    orbs: [
      // 右上: 大型バイオレット (画面外に大きくはみ出す)
      { size: 1000, color: '#6D28D9', top: -400, right: -380 },
      // 左下: インディゴ
      { size:  880, color: '#3730A3', bottom: -320, left: -300 },
      // 右中央: アクセントローズ
      { size:  680, color: '#BE185D', top: '32%', right: -280 },
    ],
    hazeColor: 'rgba(4, 3, 18, 0.18)',
    meshLayers: [
      {
        colors: ['rgba(109,40,217,0.32)', 'rgba(67,56,202,0.10)', 'transparent'],
        start: { x: 0, y: 0 }, end: { x: 1, y: 1 },
      },
      {
        colors: ['transparent', 'rgba(99,102,241,0.24)', 'rgba(79,70,229,0.08)'],
        start: { x: 1, y: 0 }, end: { x: 0, y: 1 },
      },
      {
        colors: ['rgba(190,24,93,0.12)', 'transparent', 'rgba(139,92,246,0.14)'],
        start: { x: 0, y: 1 }, end: { x: 1, y: 0 },
      },
    ],
    overlay: 'rgba(3, 2, 16, 0.38)',
  },

  /* ─── Warm: Amber × Magenta × Purple ─── */
  warm: {
    base: ['#0D0610', '#140919', '#08060D'],
    orbs: [
      // 左上: アンバー
      { size:  980, color: '#B45309', top: -380, left: -340 },
      // 右下: マゼンタ
      { size:  860, color: '#A21CAF', bottom: -300, right: -300 },
      // 左中央: アクセントオレンジ
      { size:  660, color: '#C2410C', top: '36%', left: -260 },
    ],
    hazeColor: 'rgba(5, 2, 10, 0.18)',
    meshLayers: [
      {
        colors: ['rgba(180,83,9,0.30)', 'rgba(194,65,12,0.10)', 'transparent'],
        start: { x: 0, y: 0 }, end: { x: 1, y: 1 },
      },
      {
        colors: ['transparent', 'rgba(162,28,175,0.30)', 'rgba(126,34,206,0.12)'],
        start: { x: 1, y: 0 }, end: { x: 0, y: 1 },
      },
      {
        colors: ['rgba(245,158,11,0.14)', 'transparent', 'rgba(147,51,234,0.16)'],
        start: { x: 0, y: 1 }, end: { x: 1, y: 0 },
      },
    ],
    overlay: 'rgba(5, 2, 10, 0.40)',
  },

  /* ─── Cool: Cyan × Indigo × Teal ─── */
  cool: {
    base: ['#030C1A', '#050A18', '#020914'],
    orbs: [
      // 右上: シアン
      { size:  980, color: '#0369A1', top: -380, right: -360 },
      // 左下: インディゴ
      { size:  860, color: '#3730A3', bottom: -310, left: -300 },
      // 右中央: ティール
      { size:  660, color: '#0F766E', top: '34%', right: -260 },
    ],
    hazeColor: 'rgba(1, 4, 15, 0.18)',
    meshLayers: [
      {
        colors: ['rgba(3,105,161,0.32)', 'rgba(56,189,248,0.10)', 'transparent'],
        start: { x: 0, y: 0 }, end: { x: 1, y: 1 },
      },
      {
        colors: ['transparent', 'rgba(55,48,163,0.26)', 'rgba(67,56,202,0.10)'],
        start: { x: 1, y: 0 }, end: { x: 0, y: 1 },
      },
      {
        colors: ['rgba(15,118,110,0.16)', 'transparent', 'rgba(99,102,241,0.14)'],
        start: { x: 0, y: 1 }, end: { x: 1, y: 0 },
      },
    ],
    overlay: 'rgba(1, 4, 15, 0.38)',
  },
};

/* ─────────────────────────────────────────────────────────────
   AppBackground コンポーネント
   描画順:
     1. ベースグラデーション (暗色の土台)
     2. NebulaOrbs (エッジレスの光雲)
     3. Soft Haze (オーブのエッジ残像を消す薄暗いオーバーレイ)
     4. Mesh Gradients (方向感・色の奥行き)
     5. Dark Overlay (テキスト可読性確保)
───────────────────────────────────────────────────────────── */
interface AppBackgroundProps {
  variant?: BackgroundVariant;
}

export function AppBackground({ variant = 'default' }: AppBackgroundProps) {
  const p = PALETTES[variant];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. ベース暗色グラデーション */}
      <LinearGradient
        colors={p.base}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* 2. NebulaOrbs — 12層・極薄外縁でエッジレスに */}
      {p.orbs.map((orb, i) => (
        <NebulaOrb
          key={`orb-${i}`}
          size={orb.size}
          color={orb.color}
          style={{
            top: orb.top,
            bottom: orb.bottom,
            left: orb.left,
            right: orb.right,
          }}
        />
      ))}

      {/* 3. Soft Haze — オーブ上に被せてエッジ残像を溶かす */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.hazeColor }]} />

      {/* 4. Mesh Gradients — 色の奥行きと方向感 */}
      {p.meshLayers.map((layer, i) => (
        <LinearGradient
          key={`mesh-${i}`}
          colors={layer.colors}
          style={StyleSheet.absoluteFill}
          start={layer.start}
          end={layer.end}
        />
      ))}

      {/* 5. Dark Overlay — テキスト可読性 */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.overlay }]} />
    </View>
  );
}
