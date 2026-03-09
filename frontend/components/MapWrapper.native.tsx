import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

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

export function animateToRegion(mapRef: React.RefObject<MapView>, region: any) {
  mapRef.current?.animateToRegion(region);
}

export default function MapWrapper({ mapRef, initialRegion, markers, onMarkerPress }: MapWrapperProps) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress?.(marker.id)}
          pinColor={marker.pinColor}
        />
      ))}
    </MapView>
  );
}
