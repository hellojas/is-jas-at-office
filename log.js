// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCJIAxjywQhuKuqWqBa4FgUZuM6RrQ7y-E",
  authDomain: "office-127b0.firebaseapp.com",
  databaseURL: "https://office-127b0-default-rtdb.firebaseio.com/",
  projectId: "office-127b0",
  storageBucket: "office-127b0.firebasestorage.app",
  messagingSenderId: "554800223425",
  appId: "1:554800223425:web:ecb87d46fee7c3e5a1f040",
  measurementId: "G-8WXVRR5VJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// All location definitions (kept private in log.js)
const locations = {
    work: {
        lat: 40.741889,
        lng: -74.000000,
        radius: 300, // A little more than 1 avenue (228.6m)
        type: 'work'
    },
    music_studio: {
        lat: 40.742352,
        lng: -74.006210,
        radius: 160.9, // 0.1 mile
        type: 'music_studio'
    },
    home: {
        lat: 40.716321,
        lng: -73.948107,
        radius: 160.9,
        type: 'home'
    },
    gym: {
        lat: 40.7168,
        lng: -73.9542,
        radius: 160.9,
        type: 'gym'
    },
    gym2: {
        lat: 40.7181,
        lng: -73.9929,
        radius: 160.9,
        type: 'gym'
    }
};

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function determineLocationType(currentLat, currentLng) {
    // Check each location to see if we're within range
    for (const [key, location] of Object.entries(locations)) {
        const distance = calculateDistance(
            currentLat, currentLng, 
            location.lat, location.lng
        );
        
        if (distance <= location.radius) {
            return {
                type: location.type,
                distance: Math.round(distance),
                isAtWork: location.type === 'work'
            };
        }
    }
    
    // Default case - not at any known location
    const workDistance = calculateDistance(
        currentLat, currentLng,
        locations.work.lat, locations.work.lng
    );
    
    return {
        type: 'other',
        distance: Math.round(workDistance),
        isAtWork: false
    };
}

async function updateFirebase(currentLocation) {
    try {
        const locationInfo = determineLocationType(currentLocation.lat, currentLocation.lng);
        
        console.log('Updating DB...', { 
            locationType: locationInfo.type, 
            distance: locationInfo.distance,
            isAtWork: locationInfo.isAtWork
        });
        
        const statusRef = ref(database, 'locationStatus');
        const privateRef = ref(database, 'locationPrivate');
        
        // Public data (what lol.js will read)
        await set(statusRef, {
            location_type: locationInfo.type,
            at_work: locationInfo.isAtWork,
            distance_to_work: locationInfo.distance,
            timestamp: Date.now(),
            lastUpdated: serverTimestamp()
        });
        
        // Private data (coordinates for your analysis only)
        await set(privateRef, {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            location_type: locationInfo.type,
            timestamp: Date.now()
        });
        
        document.getElementById('firebase-status').innerHTML = 
            `<span style="color: #2ecc71;">✓ DB updated</span>`;
        console.log('DB update successful');
        return true;
    } catch (error) {
        console.error('DB update failed:', error);
        document.getElementById('firebase-status').innerHTML = 
            `<span style="color: #e74c3c;">✗ DB error: ${error.message}</span>`;
        return false;
    }
}

function showResult(currentLocation) {
    const locationInfo = determineLocationType(currentLocation.lat, currentLocation.lng);
    
    console.log('Location determined:', { 
        type: locationInfo.type,
        distance: locationInfo.distance,
        isAtWork: locationInfo.isAtWork
    });
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = locationInfo.isAtWork ? 'AT WORK' : 'NOT AT WORK';
    answerEl.className = `answer ${locationInfo.isAtWork ? 'yes' : 'no'}`;
    
    const typeDisplay = locationInfo.type.replace('_', ' ').toUpperCase();
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        Location: ${typeDisplay} - Updating DB...
    `;
    
    const distanceText = locationInfo.distance < 1000 ? 
        `${locationInfo.distance} meters` : 
        `${(locationInfo.distance/1000).toFixed(1)} kilometers`;
    
    detailsEl.innerHTML = `
        Location type: ${typeDisplay}<br>
        Distance to work: ${distanceText}<br>
        Coordinates: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}<br>
        Last checked: ${new Date().toLocaleTimeString()}
    `;
    
    // Update Firebase with all data
    updateFirebase(currentLocation);
}

function showError(message) {
    console.error('Location error:', message);
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = 'ERROR';
    answerEl.className = 'answer error';
    subtitleEl.textContent = 'Unable to determine location';
    detailsEl.innerHTML = `<div class="error">${message}</div>`;
    document.getElementById('firebase-status').innerHTML = 
        `<span style="color: #f39c12;">⚠ Cannot update DB - location unknown</span>`;
}

function checkLocation() {
    console.log('Checking location...');
    
    if (!navigator.geolocation) {
        showError('Your browser does not support location services');
        return;
    }
    
    console.log('Geolocation supported, requesting position...');
    
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('Location obtained successfully');
            
            const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            showResult(currentLocation);
        },
        function(error) {
            console.error('Geolocation error:', error);
            
            let errorMessage;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Please enable location access and refresh this page";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information is unavailable";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Location request timed out";
                    break;
                default:
                    errorMessage = "An unknown error occurred";
                    break;
            }
            showError(errorMessage);
        },
        options
    );
}

// Initialize status
document.getElementById('firebase-status').textContent = 'DB initialized';

// Check location when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, starting location check...');
    checkLocation();
});

// Re-check and update DB every 30 seconds
setInterval(checkLocation, 30000);

console.log('log.js setup complete');
