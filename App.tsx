import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';
import MapboxGl from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';

MapboxGl.setAccessToken("pk.eyJ1IjoiaWJyb2hpbWpvbjI1IiwiYSI6ImNtMG8zYm83NzA0bDcybHIxOHlreXRyZnYifQ.7QYLNFuaTX9uaDfvV0054Q");

const App = () => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [destination, setDestination] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    useEffect(() => {
        Geolocation.getCurrentPosition(
            position => {
                const { longitude, latitude } = position.coords;
                setCurrentLocation([longitude, latitude]);
            },
            error => {
                console.error(error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    }, []);

    const fetchSuggestions = async (query) => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=sk.eyJ1IjoiaWJyb2hpbWpvbjI1IiwiYSI6ImNtMWJwanIyZjBkbXkya3M2emhuaWVnNHMifQ.Sikiqfo3CbWwa9WFq_CMSA&autocomplete=true&limit=5`
            );
            const data = await response.json();
            setSuggestions(data.features || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const handleDestinationSelect = async (place) => {
        setDestination(place.place_name);
        setSuggestions([]);

        const destinationCoordinates = place.geometry.coordinates;

        // Fetch directions from Mapbox Directions API
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation[0]},${currentLocation[1]};${destinationCoordinates[0]},${destinationCoordinates[1]}?geometries=geojson&access_token=sk.eyJ1IjoiaWJyb2hpbWpvbjI1IiwiYSI6ImNtMWJwanIyZjBkbXkya3M2emhuaWVnNHMifQ.Sikiqfo3CbWwa9WFq_CMSA`
            );
            const data = await response.json();
            const route = data.routes[0].geometry.coordinates;

            setRouteCoordinates(route);
        } catch (error) {
            console.error('Error fetching route:', error);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Qayerga bormoqchisiz?"
                value={destination}
                onChangeText={(text) => {
                    setDestination(text);
                    fetchSuggestions(text); // Qidiruv natijalarini olish
                }}
            />
            {suggestions.length > 0 && (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleDestinationSelect(item)}>
                            <Text style={styles.suggestion}>{item.place_name}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
            <MapboxGl.MapView style={styles.map}>
                {currentLocation && (
                    <MapboxGl.Camera
                        zoomLevel={14}
                        centerCoordinate={currentLocation}
                    />
                )}
                {currentLocation && (
                    <MapboxGl.PointAnnotation
                        id="currentLocation"
                        coordinate={currentLocation}
                    />
                )}
                {routeCoordinates.length > 0 && (
                    <MapboxGl.ShapeSource
                        id="routeSource"
                        shape={{
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: routeCoordinates,
                            },
                        }}
                    >
                        <MapboxGl.LineLayer id="routeLayer" style={styles.routeLine} />
                    </MapboxGl.ShapeSource>
                )}
            </MapboxGl.MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        margin: 10,
    },
    suggestion: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    routeLine: {
        lineWidth: 5,
        lineColor: 'blue',
    },
});


export default App;
