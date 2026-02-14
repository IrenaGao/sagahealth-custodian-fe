import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import MapWrapper, { animateToRegion } from "@/components/MapWrapper";

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  color: string;
  icon: string;
}

const placeTypes = ["All", "Gym", "Yoga", "Pilates", "Dental", "Vision", "Fitness"];

function generateNearbyPlaces(lat: number, lng: number): NearbyPlace[] {
  const typeConfig: Record<string, { names: string[]; icon: string; color: string }> = {
    Gym: {
      names: ["Iron Body Gym", "CrossFit Box", "Planet Fitness", "Gold's Gym", "LA Fitness"],
      icon: "barbell",
      color: Colors.light.accent,
    },
    Yoga: {
      names: ["Zen Yoga Studio", "Hot Power Yoga", "CorePower Yoga", "Yoga Works", "Breathe Yoga"],
      icon: "leaf",
      color: "#8B5CF6",
    },
    Pilates: {
      names: ["Club Pilates", "Reform Pilates", "Core Pilates Studio", "Balanced Body", "Pure Pilates"],
      icon: "body",
      color: "#E91E8C",
    },
    Dental: {
      names: ["BrightSmile Dental", "Family Dental Care", "Gentle Dentistry", "Smile Pros", "ClearView Dental"],
      icon: "medkit",
      color: Colors.light.info,
    },
    Vision: {
      names: ["VisionFirst Optometry", "ClearSight Eye Care", "Eagle Eye Clinic", "Focus Vision", "LensCrafters"],
      icon: "eye",
      color: Colors.light.tint,
    },
    Fitness: {
      names: ["F45 Training", "OrangeTheory Fitness", "SoulCycle Studio", "Barry's Bootcamp", "Peloton Studio"],
      icon: "flash",
      color: Colors.light.danger,
    },
  };

  const streets = [
    "Main St", "Oak Ave", "Broadway", "Elm Dr", "Market St",
    "Pine Rd", "Walnut Blvd", "Cedar Ln", "Park Ave", "Lake St",
    "Maple Way", "Spring Rd", "Hill Dr", "Valley Blvd", "River Ln",
  ];

  const places: NearbyPlace[] = [];
  let idCounter = 1;

  Object.entries(typeConfig).forEach(([type, config]) => {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.04;
      const offsetLng = (Math.random() - 0.5) * 0.04;
      const streetNum = 100 + Math.floor(Math.random() * 900);
      const streetName = streets[Math.floor(Math.random() * streets.length)];

      places.push({
        id: `place_${idCounter++}`,
        name: config.names[i % config.names.length],
        type,
        address: `${streetNum} ${streetName}`,
        latitude: lat + offsetLat,
        longitude: lng + offsetLng,
        rating: parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
        color: config.color,
        icon: config.icon,
      });
    }
  });

  return places;
}

function PlaceCard({
  place,
  selected,
  onPress,
}: {
  place: NearbyPlace;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[placeCardStyles.card, selected && placeCardStyles.cardActive]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={[placeCardStyles.iconWrap, { backgroundColor: place.color + "20" }]}>
        <Ionicons name={place.icon as any} size={18} color={place.color} />
      </View>
      <View style={placeCardStyles.info}>
        <Text style={placeCardStyles.name} numberOfLines={1}>{place.name}</Text>
        <Text style={placeCardStyles.address} numberOfLines={1}>{place.address}</Text>
        <View style={placeCardStyles.row}>
          <View style={placeCardStyles.typeBadge}>
            <Text style={placeCardStyles.typeText}>{place.type}</Text>
          </View>
          <View style={placeCardStyles.ratingRow}>
            <Ionicons name="star" size={11} color="#FBBF24" />
            <Text style={placeCardStyles.rating}>{place.rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const placeCardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    width: 260,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  address: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: Colors.light.text,
  },
});

export default function NearbyServicesScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const mapRef = useRef<MapView>(null);

  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  const fallbackLat = 37.7749;
  const fallbackLng = -122.4194;

  const setFallbackLocation = () => {
    setLocation({ lat: fallbackLat, lng: fallbackLng });
    setPlaces(generateNearbyPlaces(fallbackLat, fallbackLng));
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
              });
            });
            if (!cancelled) {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setLocation({ lat, lng });
              setPlaces(generateNearbyPlaces(lat, lng));
              setLoading(false);
            }
          } catch {
            if (!cancelled) setFallbackLocation();
          }
        } else {
          if (!cancelled) setFallbackLocation();
        }
        return;
      }

      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          if (!cancelled) setFallbackLocation();
          return;
        }
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setPlaces(generateNearbyPlaces(loc.coords.latitude, loc.coords.longitude));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setFallbackLocation();
      }
    })();

    return () => { cancelled = true; };
  }, [permission]);

  const filteredPlaces =
    activeFilter === "All" ? places : places.filter((p) => p.type === activeFilter);

  const handleSelectPlace = (id: string) => {
    setSelectedPlace(id);
    const place = places.find((p) => p.id === id);
    if (place) {
      animateToRegion(mapRef, {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleMarkerPress = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedPlace(id);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Finding nearby services...</Text>
      </View>
    );
  }

  if (Platform.OS !== "web" && !permission?.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.permHeader}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </Pressable>
        </View>
        <View style={styles.permIconWrap}>
          <Ionicons name="location" size={48} color={Colors.light.tint} />
        </View>
        <Text style={styles.permTitle}>Location Access</Text>
        <Text style={styles.permSub}>
          Allow location access to find gyms, studios, and health services near you.
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Enable Location</Text>
        </Pressable>
        {permission && !permission.canAskAgain && Platform.OS !== "web" && (
          <Pressable
            style={styles.settingsBtn}
            onPress={() => {
              try { Linking.openSettings(); } catch {}
            }}
          >
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nearby Services</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapContainer}>
        {location && (
          <MapWrapper
            mapRef={mapRef}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            markers={filteredPlaces.map((place) => ({
              id: place.id,
              latitude: place.latitude,
              longitude: place.longitude,
              title: place.name,
              description: `${place.type} - ${place.address}`,
              pinColor: place.color,
            }))}
            onMarkerPress={handleMarkerPress}
          />
        )}

        {location && Platform.OS !== "web" && (
          <Pressable
            style={[styles.recenterBtn, { top: 12, right: 12 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              animateToRegion(mapRef, {
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              });
            }}
          >
            <Ionicons name="locate" size={20} color={Colors.light.tint} />
          </Pressable>
        )}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {placeTypes.map((type) => (
            <Pressable
              key={type}
              style={[
                styles.filterPill,
                activeFilter === type && styles.filterPillActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setActiveFilter(type);
                setSelectedPlace(null);
              }}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === type && styles.filterPillTextActive,
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.resultCount}>
          {filteredPlaces.length} {filteredPlaces.length === 1 ? "service" : "services"} found nearby
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placeCardsRow}
        >
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              selected={selectedPlace === place.id}
              onPress={() => handleSelectPlace(place.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  permHeader: {
    position: "absolute",
    top: 56,
    left: 20,
  },
  permIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  permTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: 8,
  },
  permSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.white,
  },
  settingsBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  settingsBtnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.tint,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.light.borderLight,
  },
  recenterBtn: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "web" ? 34 : 30,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterPillActive: {
    backgroundColor: Colors.light.navy,
    borderColor: Colors.light.navy,
  },
  filterPillText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.light.white,
  },
  resultCount: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 12,
  },
  placeCardsRow: {
    paddingBottom: 4,
  },
});
