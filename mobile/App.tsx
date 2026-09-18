import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./src/screens/home";
import Contatos from "./src/screens/contact";
import Login from "./src/screens/login";
import Register from "./src/screens/register";
import Sobre from "./src/screens/about";
import Comentarios from "./src/screens/comments";
import Rotas from "./src/screens/routes";
import Turismo from "./src/screens/tourism";
import Conta from "./src/screens/account";
import Configuracoes from "./src/screens/settings";
import Pesquisa from "./src/screens/search";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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
          component={Comentarios}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
