import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import RegistroCard from '../../../components/RegistroCard';
import { imagenesPorId } from '../../../data/registros';
import { useRegistros } from '../../../hooks/useRegistros';

export default function Catalogo() {
  const {
    busqueda,
    registrosFiltrados,
    setBusqueda,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  } = useRegistros();
  const router = useRouter();

  return (
    <View className="flex-1 p-5" style={{ backgroundColor: Colors.fondo }}>
      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar lugar"
        className="mb-4 rounded-lg bg-white px-4 py-3 text-base text-slate-800"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="items-start gap-2"
      >
        <Pressable
          onPress={() => setCategoriaSeleccionada(null)}
          className="h-10 self-start justify-center rounded-full px-4"
          style={{
            backgroundColor: !categoriaSeleccionada ? Colors.boton : Colors.etiqueta,
          }}
        >
          <Text className={!categoriaSeleccionada ? 'font-semibold text-white' : 'font-semibold text-slate-700'}>
            Todas
          </Text>
        </Pressable>
        {categorias.map((categoria) => {
          const estaSeleccionada = categoriaSeleccionada === categoria;

          return (
            <Pressable
              key={categoria}
              onPress={() => setCategoriaSeleccionada(categoria)}
              className="h-10 self-start justify-center rounded-full px-4"
              style={{
                backgroundColor: estaSeleccionada ? Colors.boton : Colors.etiqueta,
              }}
            >
              <Text className={estaSeleccionada ? 'font-semibold text-white' : 'font-semibold text-slate-700'}>
                {categoria}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlatList
        data={registrosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 pb-6"
        ListEmptyComponent={
          <Text className="text-center text-base text-gray-600">
            No se encontraron lugares.
          </Text>
        }
        renderItem={({ item }) => (
          <RegistroCard
            item={item}
            imagen={imagenesPorId[item.id]}
            onPress={() =>
              router.push({ pathname: '/detalle/[id]', params: { id: item.id } })
            }
          />
        )}
      />
    </View>
  );
}
