import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

interface Props {
  data: number[];
  color: string;
}

const CHART_H = 120;

export function LineChartMini({ data, color }: Props) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.max(screenWidth - Spacing.lg * 4, 200);

  if (data.length === 0) return null;
  const maxVal = Math.max(...data, 1);
  const stepX = width / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => ({
    x: i * stepX,
    y: CHART_H - (v / maxVal) * (CHART_H - 10) - 5,
  }));

  let pathD = '';
  points.forEach((p, i) => {
    pathD += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
  });

  let areaD = `M 0 ${CHART_H}`;
  points.forEach((p) => {
    areaD += ` L ${p.x} ${p.y}`;
  });
  areaD += ` L ${width} ${CHART_H} Z`;

  return (
    <View>
      <Svg width={width} height={CHART_H + 10}>
        {[0.5, 1].map((f) => (
          <Rect
            key={f}
            x={0}
            y={CHART_H * (1 - f)}
            width={width}
            height={1}
            fill={theme.borderLight}
          />
        ))}
        <Path d={areaD} fill={color} opacity={0.08} />
        <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
