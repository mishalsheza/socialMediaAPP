import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";
import ScreenWrapper from '../components/ScreenWrapper';

export default function Index() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Index Page</Text>
        <Button title="Go to Welcome" onPress={() => router.push("/welcome")} />
      </View>
    </ScreenWrapper>
  );
}
