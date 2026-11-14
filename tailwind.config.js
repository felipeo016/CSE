/**
 * Tema visual de la app, tomado de los mockups de diseño del proyecto.
 * Los nombres son semánticos para usarlos así: bg-primario, text-texto-suave, border-borde...
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primario: '#2563EB', // azul de botones, chips activos, precios y pestaña activa
        secundario: '#0F2A5C', // azul marino: encabezado del carrito, resumen de cotización, rol administrador
        fondo: '#FFFFFF', // fondo de las pantallas
        superficie: '#F1F4F9', // barra de búsqueda, fondo de imágenes y esqueletos de carga
        texto: '#0B1F44', // títulos y texto principal (azul casi negro)
        'texto-suave': '#64748B', // subtítulos, códigos, fechas y textos de ayuda
        borde: '#E2E8F0', // bordes de tarjetas, campos y chips
        error: '#DC2626', // validaciones, Rechazada, Quitar/Eliminar
        exito: '#16A34A', // Disponibles, Aceptada, confirmaciones
        advertencia: '#F59E0B', // Sin conexión, Vista, Stock bajo, Pago simulado
      },
      fontFamily: {
        // Poppins para títulos (Catálogo, Bienvenido...), Inter para el resto del texto.
        // Si la fuente no carga, Android usa la fuente del sistema.
        titulo: ['Poppins-Bold'],
        'titulo-semi': ['Poppins-SemiBold'],
        cuerpo: ['Inter-Regular'],
        'cuerpo-medio': ['Inter-Medium'],
        'cuerpo-semi': ['Inter-SemiBold'],
        'cuerpo-negrita': ['Inter-Bold'],
      },
      borderRadius: {
        campo: '12px', // campos de texto y botones de formulario
        tarjeta: '16px', // tarjetas de producto, cotización y resumen
        boton: '9999px', // botón principal y chips (forma de píldora)
      },
      spacing: {
        pantalla: '20px', // margen lateral de las pantallas
        seccion: '24px', // separación entre secciones
        bloque: '12px', // separación entre tarjetas y campos
      },
    },
  },
  plugins: [],
};
