import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Home from "./src/screens/home";
import Contatos from "./src/screens/contact";
import Login from "./src/screens/login";
import Register from "./src/screens/register";
import Sobre from "./src/screens/about";
import Rotas from "./src/screens/routes";
import Turismo from "./src/screens/tourism";
import Conta from "./src/screens/account";
import Configuracoes from "./src/screens/settings";
import Pesquisa from "./src/screens/search";
import AvaliacoesRegiao from "./src/screens/region-assessments";
import { lerToken } from "./src/services/api";

const Stack = createNativeStackNavigator();

export default function App() {
  const [rotaInicial, setRotaInicial] = useState<"Login" | "Home" | null>(null);

  useEffect(() => {
    let ativo = true;
    lerToken()
      .then((token) => {
        if (ativo) setRotaInicial(token ? "Home" : "Login");
      })
      .catch(() => {
        if (ativo) setRotaInicial("Login");
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (rotaInicial === null) {
    return (
      <View style={styles.inicializando}>
        <ActivityIndicator color="#8b0000" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={rotaInicial}
          screenOptions={{ headerShown: false }}
        >

        <Stack.Screen
          name="Login"
          component={Login}
        />

        <Stack.Screen
          name="Register"
          component={Register}
        />
        
        <Stack.Screen
          name="Home"
          component={Home}
        />

        <Stack.Screen
          name="Contatos"
          component={Contatos}
        />

        <Stack.Screen
          name="Sobre"
          component={Sobre}
        />

        <Stack.Screen
          name="Comentarios"
          component={AvaliacoesRegiao}
        />

        <Stack.Screen
          name="Rotas"
          component={Rotas}
        />

        <Stack.Screen
          name="Turismo"
          component={Turismo}
        />

        <Stack.Screen
          name="Conta"
          component={Conta}
        />

        <Stack.Screen
          name="Configuracoes"
          component={Configuracoes}
        />

        <Stack.Screen
          name="Pesquisa"
          component={Pesquisa}
        />

        <Stack.Screen
          name="AvaliacoesRegiao"
          component={AvaliacoesRegiao}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  inicializando: { alignItems: "center", backgroundColor: "#f8f8ff", flex: 1, justifyContent: "center" },
});
