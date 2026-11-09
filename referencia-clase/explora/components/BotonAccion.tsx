import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';

type Props = { titulo: string; onPress: () => void };
export default function BotonAccion({ titulo, onPress }: Props) {
 return (
   <Pressable
     onPress={async () => {
       // Confirma físicamente que el usuario ejecutó una acción.
       await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
       onPress();
     }}
     className="items-center rounded-lg px-4 py-2 active:opacity-70"
     style={{ backgroundColor: Colors.boton }}
   >
     <Text className="font-semibold text-white">{titulo}</Text>
   </Pressable>
 );
}
