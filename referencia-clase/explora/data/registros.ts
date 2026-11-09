// Datos iniciales entregados por el docente. Son ficticios y sirven para practicar.
export type Registro = { id: string; nombre: string; descripcion: string; latitud: number; longitud: number; categoria: string };
export const registros: Registro[] = [
  {
    "id": "2",
    "nombre": "Mirador",
    "descripcion": "Vista panorámica de la ciudad y sus paisajes naturales",
    "latitud": 4.8174,
    "longitud":-75.6901,
    "categoria": "Naturaleza"
  },
  {
    "id": "3",
    "nombre": "Museo",
    "descripcion": "Descubre la historia y la cultura de la region",
    "latitud": 4.8134,
    "longitud": -75.6833,
    "categoria": "Historia"
  },
  {
    "id": "1",
    "nombre": "Parque",
    "descripcion": "Espacio ideal para pasear y disfrutar al aire libre",
    "latitud": 4.875,
    "longitud":-75.6974,
    "categoria": "Familiar"
  },
  {
    "id": "4",
    "nombre": "Plaza",
    "descripcion": "Un lugar emblematico lleno de tradicion",
    "latitud": 4.8039,
    "longitud": -75.692,
    "categoria": "Cultural"
  }
];

// Recursos locales proporcionados. Usa imagenesPorId[registro.id] en <Image source={...} />.
export const imagenesPorId: Record<string, number> = {
  '1': require('../assets/images/registro_1.png'),
  '2': require('../assets/images/registro_2.png'),
  '3': require('../assets/images/registro_3.png'),
  '4': require('../assets/images/registro_4.png'),
};
