import { ScrollView, View } from 'react-native';

import type { FilaChipsProps } from '../types/props.types';

/**
 * Fila de chips de filtro que se desplaza de lado (Catálogo, Productos, Cotizaciones y Citas).
 *
 * Un ScrollView trae por defecto flexGrow 1 y flexShrink 1. Si la pantalla no tiene espacio, Yoga lo
 * encoge por debajo de la altura de los chips y en iOS las filas se enciman. Por eso la fila va dentro
 * de un View que no se encoge (shrink-0) y el ScrollView no crece ni se encoge: mide lo que sus chips.
 */
export default function FilaChips({
  children,
  etiquetaAccesible,
  conMargenLateral = true,
  className = '',
}: FilaChipsProps) {
  return (
    <View className={`shrink-0 ${className}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        // items-center: los chips conservan su altura y no se estiran ni se cortan.
        contentContainerClassName={`items-center py-0.5 ${conMargenLateral ? 'px-pantalla' : ''}`}
        accessibilityLabel={etiquetaAccesible}
      >
        {children}
      </ScrollView>
    </View>
  );
}
