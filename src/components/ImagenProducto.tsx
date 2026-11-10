import { useState } from 'react';
import { Image, View } from 'react-native';

import type { ImagenProductoProps } from '../types/props.types';

// Imagen alternativa para productos sin foto (RF-08, RNF-02).
const IMAGEN_ALTERNATIVA = require('../../assets/images/producto-sin-imagen.png');

/**
 * Imagen de un producto sobre fondo gris claro (mockup). Si imagenUrl es null, o la imagen no carga
 * (enlace roto o sin conexión), muestra la imagen alternativa de assets/images/.
 */
export default function ImagenProducto({ imagenUrl, tamano }: ImagenProductoProps) {
  // Estado local: true si la imagen remota falló al cargar.
  const [fallo, setFallo] = useState(false);
  const usarAlternativa = imagenUrl === null || fallo;

  return (
    <View
      className={`items-center justify-center overflow-hidden bg-superficie ${
        tamano === 'grande' ? 'h-64 w-full rounded-tarjeta' : 'h-24 w-24 rounded-campo'
      }`}
    >
      <Image
        source={usarAlternativa ? IMAGEN_ALTERNATIVA : { uri: imagenUrl }}
        onError={() => setFallo(true)}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        className="h-full w-full"
      />
    </View>
  );
}
