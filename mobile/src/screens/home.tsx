import React, { useRef } from "react";

import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";

export default function Home({ navigation }: any) {

  const CLOSED_POSITION = 430;
  const OPEN_POSITION = 0;

  const translateY = useRef(
    new Animated.Value(CLOSED_POSITION)
  ).current;

  const lastOffset = useRef(CLOSED_POSITION);

  const panResponder = useRef(

    PanResponder.create({

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },

      onPanResponderMove: (_, gestureState) => {

        const newPosition =
          lastOffset.current + gestureState.dy;

        translateY.setValue(
          Math.max(OPEN_POSITION, newPosition)
        );
      },

      onPanResponderRelease: (_, gestureState) => {

        let finalPosition;

        if (gestureState.dy < -120) {

          // abre
          finalPosition = OPEN_POSITION;

        } else if (gestureState.dy > 120) {

          // fecha
          finalPosition = CLOSED_POSITION;

        } else {

          // mantém
          finalPosition = lastOffset.current;

        }

        lastOffset.current = finalPosition;

        Animated.spring(translateY, {
          toValue: finalPosition,
          useNativeDriver: true,
        }).start();
      },

    })

  ).current;

  return (

    <View style={styles.container}>

      {/* FUNDO */}
      <ImageBackground
        source={require("../../assets/images/map.png")}
        resizeMode="cover"
        style={styles.background}
      >
      </ImageBackground>

      {/* BOTTOM SHEET */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >

        {/* ÁREA DE ARRASTAR */}
        <View
          {...panResponder.panHandlers}
          style={styles.dragArea}
        >
          <View style={styles.dragBar} />
        </View>

        {/* BOTÕES */}
        <View style={styles.buttonsContainer}>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Comentarios")}
          >
            <Text style={styles.buttonText}>
              Comentários
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Contatos")}
          >
            <Text style={styles.buttonText}>
              Contatos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Sobre")}
          >
            <Text style={styles.buttonText}>
              Sobre
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>
              Sair
            </Text>
          </TouchableOpacity>

        </View>

      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 500,

    backgroundColor: "#F8F8FF",

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    paddingTop: 10,
  },

  dragArea: {
    alignItems: "center",
    marginBottom: 25,
    paddingVertical: 10,
  },

  dragBar: {
    width: 70,
    height: 7,
    backgroundColor: "#b3b5c0",
    borderRadius: 10,
  },

  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    gap: 12,
  },

  button: {
    width: "48%",

    backgroundColor: "#b71c1c",

    paddingVertical: 20,
    paddingHorizontal: 15,

    borderRadius: 15,

    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

});