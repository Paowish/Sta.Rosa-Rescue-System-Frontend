// src/services/locationService.js
import { incidentService } from './api';

class LocationService {
    constructor() {
        this.watchId = null;
        this.currentIncidentId = null;
        this.isTracking = false;
        this.simulateInterval = null;
    }

    startTracking(incidentId, volunteerName) {
        console.log('📍 STARTING TRACKING for incident:', incidentId);
        console.log('📍 Volunteer:', volunteerName);

        if (this.isTracking) {
            this.stopTracking();
        }

        this.currentIncidentId = incidentId;
        this.isTracking = true;

        // ✅ FORCE SEND: Send the volunteer's REAL location immediately
        // Try to get the real location first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('📍 REAL location obtained:', latitude, longitude);
                    this.sendLocationUpdate(incidentId, latitude, longitude, volunteerName);
                },
                (error) => {
                    console.warn('❌ Could not get real location, using simulated:', error.message);
                    // Use simulated location if real location fails
                    this.simulateLocation(incidentId, volunteerName);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            // No geolocation support, use simulation
            this.simulateLocation(incidentId, volunteerName);
        }

        // Start watching for continuous updates
        if (navigator.geolocation) {
            this.watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('📍 GPS update:', latitude, longitude);
                    await this.sendLocationUpdate(incidentId, latitude, longitude, volunteerName);
                },
                (error) => {
                    console.warn('❌ GPS watch error:', error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );
        }
    }

    async sendLocationUpdate(incidentId, lat, lng, volunteerName) {
        console.log('📤 Sending location to backend:', { incidentId, lat, lng });

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${apiUrl}/incidents/${incidentId}/update-location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lat: lat,
                    lng: lng,
                    volunteerName: volunteerName || 'Responder'
                })
            });

            const data = await response.json();
            console.log('📤 Backend response:', data.success ? '✅ Success' : '❌ Failed');

            if (data.success) {
                // ✅ DISPATCH event for TrackReports
                const event = new CustomEvent('responder-location-update', {
                    detail: {
                        incidentId: incidentId,
                        location: {
                            lat: lat,
                            lng: lng
                        },
                        volunteerName: volunteerName || 'Responder',
                        timestamp: new Date().toISOString()
                    }
                });
                window.dispatchEvent(event);
                console.log('✅ Location EVENT dispatched for incident:', incidentId);
            }
        } catch (error) {
            console.error('❌ Failed to send location:', error);
        }
    }

    // Simulate location with realistic movement
    simulateLocation(incidentId, volunteerName) {
        console.log('🔄 Using SIMULATED location for testing');

        // Start from a realistic location (Manila area for testing)
        // Change these coordinates to match your actual location
        let lat = 14.5995;  // Manila area
        let lng = 120.9842; // Manila area
        let step = 0;

        if (this.simulateInterval) {
            clearInterval(this.simulateInterval);
        }

        // Send initial location
        this.sendLocationUpdate(incidentId, lat, lng, volunteerName);

        this.simulateInterval = setInterval(() => {
            if (!this.isTracking) {
                clearInterval(this.simulateInterval);
                this.simulateInterval = null;
                return;
            }

            // Move gradually toward the incident
            lat += 0.0005 * Math.sin(step);
            lng += 0.0005 * Math.cos(step);
            step += 0.2;

            console.log('🔄 Simulated location:', lat, lng);
            this.sendLocationUpdate(incidentId, lat, lng, volunteerName);
        }, 2000);
    }

    stopTracking() {
        console.log('📍 STOPPING location tracking');

        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.simulateInterval) {
            clearInterval(this.simulateInterval);
            this.simulateInterval = null;
        }

        this.isTracking = false;
        this.currentIncidentId = null;
    }
}

export const locationService = new LocationService();