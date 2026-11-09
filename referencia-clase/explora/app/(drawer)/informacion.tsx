import { View, Text } from 'react-native';

export default function Informacion() {
  return (
    <View className="flex-1 bg-white p-5">
      <Text className="text-xl font-bold">Información de Explora</Text>
      <Text className="mt-2 text-gray-600">
        Explora ayuda a conocer lugares de interés de la ciudad mediante un catálogo sencillo.
      </Text>
      <Text className="mt-4 text-gray-600">
        En esta primera versión puedes revisar cada lugar y consultar su información.
      </Text>
    </View>
  );
}
