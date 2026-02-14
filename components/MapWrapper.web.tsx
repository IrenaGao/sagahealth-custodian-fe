import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface MapWrapperProps {
  mapRef?: React.RefObject<any>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    description: string;
    pinColor: string;
  }[];
  onMarkerPress?: (id: string) => void;
}

export function animateToRegion(_mapRef: any, _region: any) {}

export default function MapWrapper(_props: MapWrapperProps) {
  return (
    <View style={webStyles.container}>
      <Ionicons name="map" size={48} color={Colors.light.tint} />
      <Text style={webStyles.title}>Map view available on mobile</Text>
      <Text style={webStyles.sub}>Browse services in the list below</Text>
    </View>
  );
}

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  sub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});
