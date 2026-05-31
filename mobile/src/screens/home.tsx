import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const bounds = L.latLngBounds(
      [-24.7, -46.9],
      [-23.2, -44.9]
    );

    const map = L.map('map', {
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      minZoom: 10,
      maxZoom: 19,
    }).setView([-23.9608, -46.3819], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  <\/script>
</body>
</html>
`;

export default function Home({ navigation }: any) {
  const CLOSED_POSITION = 430;
  const OPEN_POSITION = 0;

  const translateY = useRef(new Animated.Value(CLOSED_POSITION)).current;
  const lastOffset = useRef(CLOSED_POSITION);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = lastOffset.current + gestureState.dy;
        translateY.setValue(Math.max(OPEN_POSITION, newPosition));
      },
      onPanResponderRelease: (_, gestureState) => {
        let finalPosition;
        if (gestureState.dy < -120) {
          finalPosition = OPEN_POSITION;
        } else if (gestureState.dy > 120) {
          finalPosition = CLOSED_POSITION;
        } else {
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

      <WebView
        style={styles.map}
        source={{ html: MAP_HTML }}
        originWhitelist={["*"]}
        javaScriptEnabled
      />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
      >
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.dragBar} />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Comentarios")}
          >
            <Text style={styles.buttonText}>Comentários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Contatos")}
          >
            <Text style={styles.buttonText}>Contatos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Sobre")}
          >
            <Text style={styles.buttonText}>Sobre</Text>
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
  },
  map: {
    flex: 1,
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
    backgroundColor: "#666",
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
    backgroundColor: "#8B0000",
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