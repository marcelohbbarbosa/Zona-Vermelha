import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./src/screens/home";
import Contatos from "./src/screens/contact";
import Login from "./src/screens/login";
import Register from "./src/screens/register";
import Sobre from "./src/screens/about";

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}