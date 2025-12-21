import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../constants/themes";

export default function ScreenWrapper({ children, backgroundColor = theme.colors.background }) {
  const { top } = useSafeAreaInsets();
  const paddingTop = top > 0 ? top + 5 : 30;

  return (
    <View style={{ flex: 1, paddingTop, backgroundColor }}>
      {children}
    </View>
  );
}
