module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      "expo-sharing",
      [
        "expo-build-properties",
        {
          android: {
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
          },
        },
      ],
      ...(googleMapsApiKey
        ? [["react-native-maps", { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
    ],
  };
};
