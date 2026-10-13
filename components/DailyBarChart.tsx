import React, { useState } from 'react';
import { StyleSheet, View, Pressable, type GestureResponderEvent } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily } from '@/constants/theme';
import { formatCompact, niceMax } from '@/lib/finance';

interface Props {
  data: number[]; // un valor por día del mes
  color: string;
  selectedIndex?: number | null;
  onSelectDay?: (index: number) => void;
}

const CHART_H = 130;
const TOP_PAD = 6;
const Y_AXIS_W = 34;
const X_LABEL_H = 20;

export function DailyBarChart({ data, color, selectedIndex, onSelectDay }: Props) {
  const { theme } = useTheme();
  const { contentWidth, gutter, cardPadding } = useLayout();
  const [width, setWidth] = useState(Math.max(contentWidth - (gutter + cardPadding) * 2, 200));

  if (data.length === 0) return null;
  const maxVal = niceMax(Math.max(...data));
  const plotW = width - Y_AXIS_W;
  const slot = plotW / data.length;
  const barW = Math.max(slot * 0.62, 2);
  const plotH = CHART_H - TOP_PAD;

  // Etiquetas del eje X: día 1, cada 5 días y el último.
  const xLabels = [0, 4, 9, 14, 19, 24, data.length - 1].filter(
    (i, pos, arr) => i < data.length && arr.indexOf(i) === pos && (i === data.length - 1 || data.length - 1 - i >= 3)
  );

  const handlePress = (e: GestureResponderEvent) => {
    if (!onSelectDay) return;
    const x = e.nativeEvent.locationX - Y_AXIS_W;
    if (x < 0) return;
    onSelectDay(Math.min(Math.floor(x / slot), data.length - 1));
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg width={width} height={CHART_H + X_LABEL_H}>
        {[0, 0.5, 1].map((f) => {
          const y = TOP_PAD + plotH * (1 - f);
          return (
            <React.Fragment key={f}>
              <Rect x={Y_AXIS_W} y={y} width={plotW} height={1} fill={theme.borderLight} />
              <SvgText
                x={Y_AXIS_W - 6}
                y={y + 3.5}
                fontSize={10}
                fill={theme.textFaint}
                fontFamily={FontFamily.medium}
                textAnchor="end"
              >
                {formatCompact(maxVal * f)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {selectedIndex != null && selectedIndex < data.length && (
          <Rect
            x={Y_AXIS_W + selectedIndex * slot}
            y={0}
            width={slot}
            height={CHART_H}
            rx={3}
            fill={color}
            opacity={0.12}
          />
        )}
        {data.map((v, i) => {
          if (v <= 0) return null;
          const h = Math.max((v / maxVal) * plotH, 2);
          return (
            <Rect
              key={i}
              x={Y_AXIS_W + i * slot + (slot - barW) / 2}
              y={CHART_H - h}
              width={barW}
              height={h}
              rx={Math.min(barW / 2, 3)}
              fill={color}
              opacity={selectedIndex == null || selectedIndex === i ? 1 : 0.55}
            />
          );
        })}
        {xLabels.map((i) => (
          <SvgText
            key={i}
            x={Y_AXIS_W + i * slot + slot / 2}
            y={CHART_H + 14}
            fontSize={10}
            fill={selectedIndex === i ? color : theme.textFaint}
            fontFamily={FontFamily.medium}
            textAnchor="middle"
          >
            {i + 1}
          </SvgText>
        ))}
      </Svg>
      {/* Capa transparente encima del SVG: así locationX siempre es relativo a la gráfica. */}
      {onSelectDay && <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} />}
    </View>
  );
}
