import React, { useRef } from "react";

import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";

export default function Home({ navigation }: any) {

    const translateY = useRef(
        new Animated.Value(430)
    ).current;

    const lastOffset = useRef(430);

    const panResponder = PanResponder.create({

    onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
    },

    onPanResponderMove: (_, gestureState) => {

        const newPosition =
        lastOffset.current + gestureState.dy;

        translateY.setValue(
            Math.max(0, newPosition)
        );
    },

    onPanResponderRelease: (_, gestureState) => {

        let finalPosition;

        if (gestureState.dy < -120) {

        // abre
        finalPosition = 0;

        } else if (gestureState.dy > 120) {

        // fecha
        finalPosition = 430;

        } else {

        // mantém posição atual
        finalPosition = lastOffset.current;

    }

    lastOffset.current = finalPosition;

    Animated.spring(translateY, {
        toValue: finalPosition,
        useNativeDriver: true,
    }).start();
    },
});

  return (

    <View style={styles.container}>

      {/* FUNDO */}
      <View style={styles.background}>

        <Text style={styles.title}>
          API / MAPA
        </Text>

      </View>

      {/* BOTTOM BAR */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
            styles.sheet,
            {
                transform: [{ translateY }]
            }
        ]}
      >

  {/* ÁREA VISUAL */}
  <View style={styles.dragArea}>
    <View style={styles.dragBar} />
  </View>

        {/* BOTÕES */}
        <View style={styles.buttonsContainer}>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Sobre")}
          >
            <Text style={styles.buttonText}>Sobre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Contatos")}
          >
            <Text style={styles.buttonText}>Contatos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>

        </View>

      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#111",
  },

  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 24,
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 500,
    backgroundColor: "#222",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },

  dragArea: {
    alignItems: "center",
    marginBottom: 25,
  },

  dragBar: {
    width: 70,
    height: 7,
    backgroundColor: "#666",
    borderRadius: 10,
  },

  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },

  button: {
    backgroundColor: "#333",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
  },

});
