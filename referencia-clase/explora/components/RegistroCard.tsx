import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import type { Registro } from '../data/registros';
import BotonAccion from './BotonAccion';

type Props = {
  item: Registro;
  imagen: ImageSourcePropType;
  onPress: () => void;
};

export default function RegistroCard({ item, imagen, onPress }: Props) {
  return (
    <View className="flex-row rounded-xl bg-white p-2 shadow-sm">
      <Image source={imagen} className="h-32 w-28 rounded-lg" resizeMode="cover" />
      <View className="ml-3 flex-1 justify-between py-1">
        <View>
          <Text className="text-lg font-bold text-slate-800">{item.nombre}</Text>
          <Text className="mt-1 self-start rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {item.categoria}
          </Text>
          <Text className="mt-2 text-sm text-gray-600" numberOfLines={2}>
            {item.descripcion}
          </Text>
        </View>
        <View className="mt-2 self-end">
          <BotonAccion titulo="Ver detalle" onPress={onPress} />
        </View>
      </View>
    </View>
  );
}
