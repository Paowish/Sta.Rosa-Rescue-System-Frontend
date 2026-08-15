// src/pages/volunteer/MapComponent.jsx
import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import { Icon } from "@iconify/react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = forwardRef(({
    incidents,
    selectedIncident,
    mapView,
    onIncidentClick,
    isEnRoute,
    distanceToIncident,
    timeToIncident,
    onStopTracking,
    setMapView
}, ref) => {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const markersRef = useRef([]);
    const isMapInitialized = useRef(false);
    const routingControlRef = useRef(null);
    const volunteerMarkerRef = useRef(null);
    const isUpdatingRef = useRef(false);
    const lastLocationRef = useRef(null);
    const lastIncidentRef = useRef(null);

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        getMap: () => mapRef.current,
        flyTo: (lat, lng, zoom, options) => {
            if (mapRef.current && !isUpdatingRef.current) {
                mapRef.current.flyTo([lat, lng], zoom || 16, options || { duration: 1.5 });
            }
        },
        panTo: (lat, lng, options) => {
            if (mapRef.current && !isUpdatingRef.current) {
                mapRef.current.panTo([lat, lng], options || { animate: true, duration: 0.5 });
            }
        },
        invalidateSize: () => {
            if (mapRef.current) {
                setTimeout(() => mapRef.current.invalidateSize(), 100);
            }
        },
        updateVolunteerMarker: (location) => {
            updateVolunteerMarker(location);
        },
        // ✅ NEW: Clear volunteer marker (car icon)
        clearVolunteerMarker: () => {
            clearVolunteerMarker();
        },
        updateDirections: (currentLat, currentLng, incidentLat, incidentLng) => {
            updateDirections(currentLat, currentLng, incidentLat, incidentLng);
        },
        updateMarkers: () => {
            if (mapRef.current && isMapInitialized.current && !isUpdatingRef.current) {
                updateMarkers(mapRef.current);
            }
        },
        clearRouting: () => {
            clearRoutingControl();
        },
        setMapView: (view) => {
            if (setMapView) setMapView(view);
        }
    }));

    // Clear routing control
    const clearRoutingControl = useCallback(() => {
        if (routingControlRef.current) {
            try {
                mapRef.current.removeControl(routingControlRef.current);
            } catch (e) { }
            routingControlRef.current = null;
        }
    }, []);

    // ✅ NEW: Clear volunteer marker
    const clearVolunteerMarker = useCallback(() => {
        if (volunteerMarkerRef.current) {
            try {
                mapRef.current.removeLayer(volunteerMarkerRef.current);
                volunteerMarkerRef.current = null;
                console.log('🚗 Car marker removed');
            } catch (e) {
                console.log('Error removing car marker:', e);
            }
        }
    }, []);

    // Calculate distance
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // Update directions - FIXED to prevent glitching
    const updateDirections = useCallback((currentLat, currentLng, incidentLat, incidentLng) => {
        if (!mapRef.current || isUpdatingRef.current) return;

        // Check if location changed significantly (more than 10 meters)
        const locationChanged = !lastLocationRef.current ||
            calculateDistance(
                lastLocationRef.current.lat,
                lastLocationRef.current.lng,
                currentLat,
                currentLng
            ) > 0.01;

        const incidentChanged = !lastIncidentRef.current ||
            lastIncidentRef.current.lat !== incidentLat ||
            lastIncidentRef.current.lng !== incidentLng;

        // Only update if location or incident changed significantly
        if (!locationChanged && !incidentChanged) {
            return;
        }

        // Update last known locations
        lastLocationRef.current = { lat: currentLat, lng: currentLng };
        lastIncidentRef.current = { lat: incidentLat, lng: incidentLng };

        // Clear existing routing
        clearRoutingControl();

        try {
            const router = L.Routing.control({
                waypoints: [
                    L.latLng(currentLat, currentLng),
                    L.latLng(incidentLat, incidentLng)
                ],
                routeWhileDragging: false,
                show: false,
                lineOptions: {
                    styles: [{ color: '#3b82f6', weight: 4, opacity: 0.8 }],
                    extendToWaypoints: false,
                    missingRouteTolerance: 0
                },
                fitSelectedRoutes: false,
                showAlternatives: false,
                createMarker: function () { return null; },
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                    profile: 'driving'
                })
            }).addTo(mapRef.current);

            routingControlRef.current = router;
        } catch (error) {
            console.error('Routing error:', error);
        }
    }, [clearRoutingControl, calculateDistance]);

    // Update volunteer marker
    const updateVolunteerMarker = useCallback((location) => {
        if (!mapRef.current || isUpdatingRef.current) {
            console.warn('⚠️ Map not ready for volunteer marker');
            return;
        }

        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            console.warn('⚠️ Invalid location for volunteer marker:', location);
            return;
        }

        // Remove existing marker
        if (volunteerMarkerRef.current) {
            try {
                mapRef.current.removeLayer(volunteerMarkerRef.current);
                volunteerMarkerRef.current = null;
            } catch (e) { }
        }

        const carIcon = L.divIcon({
            className: 'volunteer-car-marker',
            html: `<div style="position: relative; width: 50px; height: 50px;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 30px rgba(59,130,246,0.8); display: flex; align-items: center; justify-content: center; font-size: 20px; animation: pulse 1.5s ease-in-out infinite;">🚗</div>
                <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.5);"></div>
            </div>`,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
        });

        const marker = L.marker([location.lat, location.lng], {
            icon: carIcon,
            zIndexOffset: 1000
        }).addTo(mapRef.current);

        volunteerMarkerRef.current = marker;

        // Only fly to location if not already there
        const center = mapRef.current.getCenter();
        const dist = calculateDistance(center.lat, center.lng, location.lat, location.lng);
        if (dist > 0.01) {
            mapRef.current.flyTo([location.lat, location.lng], 17, {
                duration: 1.0,
                easeLinearity: 0.25
            });
        }

        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 100);
    }, [calculateDistance]);

    // Update markers for incidents
    const updateMarkers = useCallback((map) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        try {
            markersRef.current.forEach(marker => {
                try { map.removeLayer(marker); } catch (e) { }
            });
            markersRef.current = [];

            if (!incidents || incidents.length === 0) {
                isUpdatingRef.current = false;
                return;
            }

            incidents.forEach((incident) => {
                if (!incident.coordinates) return;
                const isSelected = selectedIncident?.id === incident.id;
                let markerColor = '#3b82f6';
                if (incident.status === 'active' || incident.status === 'dispatched') markerColor = '#ef4444';
                if (incident.status === 'pending') markerColor = '#eab308';
                if (incident.status === 'resolved' || incident.status === 'accepted') markerColor = '#22c55e';

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${isSelected ? '#2563eb' : markerColor}; width: ${isSelected ? '36px' : '32px'}; height: ${isSelected ? '36px' : '32px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${isSelected ? '14px' : '12px'}; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; transition: all 0.3s ease;">${incident.id?.replace('RES-', '').replace('INC-', '') || '?'}</div>`,
                    iconSize: [isSelected ? 36 : 32, isSelected ? 36 : 32],
                    iconAnchor: [isSelected ? 18 : 16, isSelected ? 18 : 16],
                    popupAnchor: [0, -20],
                });

                const marker = L.marker(incident.coordinates, { icon }).addTo(map);
                marker.on('click', () => {
                    if (onIncidentClick) onIncidentClick(incident);
                });
                markersRef.current.push(marker);
            });
        } catch (error) {
            console.error('Error updating markers:', error);
        } finally {
            isUpdatingRef.current = false;
        }
    }, [incidents, selectedIncident, onIncidentClick]);

    // Initialize map - only once
    useEffect(() => {
        if (!mapContainerRef.current || isMapInitialized.current) return;
        const container = mapContainerRef.current;
        if (container.clientHeight === 0) container.style.height = '500px';

        const map = L.map(container, {
            center: [15.428991, 120.938698],
            zoom: 14,
            zoomControl: false,
            fadeAnimation: true,
            attributionControl: true,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
        }).addTo(map);

        mapRef.current = map;
        isMapInitialized.current = true;

        setTimeout(() => {
            if (incidents.length > 0 && !isUpdatingRef.current) {
                updateMarkers(map);
            }
        }, 200);

        const handleResize = () => {
            if (mapRef.current) {
                setTimeout(() => mapRef.current.invalidateSize(), 200);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearRoutingControl();
            clearVolunteerMarker();
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                isMapInitialized.current = false;
            }
        };
    }, []); // Empty dependency array - only runs once

    // Update markers when incidents change - debounced
    useEffect(() => {
        if (!mapRef.current || !isMapInitialized.current) return;

        const timeoutId = setTimeout(() => {
            if (!isUpdatingRef.current) {
                updateMarkers(mapRef.current);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [incidents, selectedIncident, updateMarkers]);

    // Update tile layer when map view changes
    useEffect(() => {
        if (!mapRef.current || !isMapInitialized.current || isUpdatingRef.current) return;

        try {
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    mapRef.current.removeLayer(layer);
                }
            });

            let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
            if (mapView === 'satellite') {
                tileUrl = 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
                attribution = '&copy; <a href="https://www.google.com/maps">Google</a>';
            }

            L.tileLayer(tileUrl, { attribution: attribution, maxZoom: 19, subdomains: ['a', 'b', 'c'] }).addTo(mapRef.current);

            if (!isUpdatingRef.current) {
                updateMarkers(mapRef.current);
            }
        } catch (error) {
            console.error('Error updating tile layer:', error);
        }
    }, [mapView]);

    // Directions Panel component
    const DirectionsPanel = useMemo(() => {
        if (!isEnRoute || !selectedIncident) return null;
        const distanceStr = distanceToIncident > 0 ? `${(distanceToIncident * 1000).toFixed(0)}m` : '--';
        const timeStr = timeToIncident > 0 ? `${timeToIncident} min` : '--';
        return (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-gray-200 min-w-[280px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <Icon icon="mdi:map-marker" className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-gray-700">Incident</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-xs">
                                <span className="text-gray-500">Distance</span>
                                <span className="ml-1 font-bold text-gray-800">{distanceStr}</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-gray-500">ETA</span>
                                <span className="ml-1 font-bold text-blue-600">{timeStr}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onStopTracking} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Stop</button>
                </div>
            </div>
        );
    }, [isEnRoute, selectedIncident, distanceToIncident, timeToIncident, onStopTracking]);

    return (
        <div className="flex-1 bg-white rounded-lg shadow-sm p-2 relative min-h-[200px]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">Map</h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => {
                            if (setMapView) setMapView('map');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] ${mapView === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Map
                    </button>
                    <button
                        onClick={() => {
                            if (setMapView) setMapView('satellite');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] ${mapView === 'satellite' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Sat
                    </button>
                </div>
            </div>
            <div className="relative" style={{ height: 'calc(100% - 30px)' }}>
                <div ref={mapContainerRef} className="w-full rounded-lg bg-gray-200 overflow-hidden" style={{ height: '100%', minHeight: '150px', position: 'relative', zIndex: 1 }} />
                {DirectionsPanel}
            </div>
        </div>
    );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;