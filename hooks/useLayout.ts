import { useWindowDimensions } from 'react-native';
import { Spacing } from '@/constants/theme';

// Ancho máximo del contenido: en tablets y plegables abiertos no se estira de lado a lado.
export const MAX_CONTENT_WIDTH = 640;

// Medidas que dependen del tamaño de pantalla. "Compacta" = móviles estrechos (< 360 dp).
export function useLayout() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const isCompact = contentWidth < 360;
  return {
    contentWidth,
    isCompact,
    // Margen lateral de las pantallas.
    gutter: isCompact ? Spacing.md : Spacing.lg,
    // Relleno interior de las tarjetas.
    cardPadding: isCompact ? Spacing.md : Spacing.lg,
  };
}
