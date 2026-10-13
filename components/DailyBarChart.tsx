import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';
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
  // Último día seleccionable (p. ej. hoy en el mes en curso).
  maxIndex?: number;
  // Avisa mientras se desliza el dedo en horizontal, para bloquear el scroll vertical de la pantalla.
  onScrubChange?: (active: boolean) => void;
}

const CHART_H = 130;
const TOP_PAD = 6;
const Y_AXIS_W = 34;
const X_LABEL_H = 20;
const SCRUB_THRESHOLD = 8;

export function DailyBarChart({ data, color, selectedIndex, onSelectDay, maxIndex, onScrubChange }: Props) {
  const { theme } = useTheme();
  const { contentWidth, gutter, cardPadding } = useLayout();
  const [width, setWidth] = useState(Math.max(contentWidth - (gutter + cardPadding) * 2, 200));

  const plotW = width - Y_AXIS_W;
  const slot = plotW / Math.max(data.length, 1);
  const lastIndex = Math.min(maxIndex ?? data.length - 1, data.length - 1);

  // El PanResponder se crea una sola vez; lee los valores actuales a través de esta ref.
  const live = useRef({ slot, lastIndex, selectedIndex, onSelectDay, onScrubChange });
  live.current = { slot, lastIndex, selectedIndex, onSelectDay, onScrubChange };
  const gesture = useRef({ startX: 0, scrubbing: false });

  const responder = useMemo(() => {
    const pickAt = (x: number) => {
      const { slot: s, lastIndex: last, selectedIndex: sel, onSelectDay: select } = live.current;
      if (!select || last < 0) return;
      const idx = Math.max(0, Math.min(Math.floor((x - Y_AXIS_W) / s), last));
      if (idx !== sel) select(idx);
    };
    const end = () => {
      if (gesture.current.scrubbing) live.current.onScrubChange?.(false);
      gesture.current.scrubbing = false;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        gesture.current = { startX: e.nativeEvent.locationX, scrubbing: false };
        pickAt(e.nativeEvent.locationX);
      },
      onPanResponderMove: (_, g) => {
        if (!gesture.current.scrubbing && Math.abs(g.dx) > SCRUB_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy)) {
          gesture.current.scrubbing = true;
          live.current.onScrubChange?.(true);
        }
        pickAt(gesture.current.startX + g.dx);
      },
      // Un gesto vertical se cede al scroll de la pantalla; uno horizontal se queda en la gráfica.
      onPanResponderTerminationRequest: () => !gesture.current.scrubbing,
      onShouldBlockNativeResponder: () => false,
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    });
  }, []);

  if (data.length === 0) return null;
  const maxVal = niceMax(Math.max(...data));
  const barW = Math.max(slot * 0.62, 2);
  const plotH = CHART_H - TOP_PAD;
  const hasSelection = selectedIndex != null && selectedIndex < data.length;

  // Etiquetas del eje X: día 1, cada 5 días y el último. Las que chocan con el día seleccionado se ocultan.
  const xLabels = [0, 4, 9, 14, 19, 24, data.length - 1]
    .filter(
      (i, pos, arr) => i < data.length && arr.indexOf(i) === pos && (i === data.length - 1 || data.length - 1 - i >= 3)
    )
    .filter((i) => !hasSelection || i === selectedIndex || Math.abs(i - selectedIndex!) > 1);
  if (hasSelection && !xLabels.includes(selectedIndex!)) xLabels.push(selectedIndex!);

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
        {hasSelection && (
          <Rect
            x={Y_AXIS_W + selectedIndex! * slot}
            y={0}
            width={slot}
            height={CHART_H}
            rx={3}
            fill={color}
            opacity={0.14}
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
              opacity={!hasSelection || selectedIndex === i ? 1 : 0.45}
            />
          );
        })}
        {xLabels.map((i) => {
          const selected = hasSelection && selectedIndex === i;
          return (
            <SvgText
              key={i}
              x={Y_AXIS_W + i * slot + slot / 2}
              y={CHART_H + 14}
              fontSize={selected ? 11 : 10}
              fill={selected ? color : theme.textFaint}
              fontFamily={selected ? FontFamily.bold : FontFamily.medium}
              textAnchor="middle"
            >
              {i + 1}
            </SvgText>
          );
        })}
      </Svg>
      {/* Capa transparente encima del SVG: recibe toques y deslizamientos sobre toda la gráfica. */}
      {onSelectDay && <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />}
    </View>
  );
}
