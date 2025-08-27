// Firebase configuration
import { initializeApp as initApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
const app = initApp(firebaseConfig);
const database = getDatabase(app);

// Location-specific messages (no coordinates needed!)
const locationMessages = {
    work: "Jas is present, her soul is not.",
    music_studio: "🎶 Currently in a meeting with Bass, Guitar, and Saxophone.",
    home: "🏠 Today's commute: 12 steps.",
    gym: "🧗 Jas is upgrading her grip strength instead of her career.",
    other: "🦄 Galavanting with a donut"
};

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
}

function showStatus(data) {
    // Only log non-sensitive status info (no coordinates!)
    console.log('Showing status:', { 
        location_type: data?.location_type, 
        at_work: data?.at_work,
        distance: data?.distance_to_work,
        hasData: !!data 
    });
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    // Check if we have valid data with required fields
    if (!data || typeof data.at_work === 'undefined' || !data.location_type) {
        console.log('Invalid or incomplete data, skipping update');
        return; // Don't update UI with incomplete data
    }
    
    const isAtWork = data.at_work;
    const locationType = data.location_type || 'other';
    
    // Show "No, :)" when NOT at work, "Yes, :(" when AT work
    answerEl.textContent = isAtWork ? 'Yes, :(' : 'No, :)';
    answerEl.className = `answer ${isAtWork ? 'yes' : 'no'}`;
    
    // Get custom message based on location type (no coordinates needed!)
    const locationMessage = locationMessages[locationType] || locationMessages.other;
    
    subtitleEl.innerHTML = `
        <span class="live-indicator"></span>
        ${locationMessage}
    `;
    
    const distanceText = data.distance_to_work ? 
        (data.distance_to_work < 1609 ? `${(data.distance_to_work * 0.000621371).toFixed(1)} miles` : `${(data.distance_to_work * 0.000621371).toFixed(1)} miles`) : 
        'Unknown';
    
    const lastUpdated = formatTimestamp(data.timestamp);
    
    // Only show distance if not at work
    if (isAtWork) {
        detailsEl.innerHTML = `Last updated: ${lastUpdated}`;
    } else {
        detailsEl.innerHTML = `
            Distance from work: ${distanceText}<br>
            Last updated: ${lastUpdated}
        `;
    }
}

function showError(message) {
    console.error('DB error:', message);
    
    const answerEl = document.getElementById('answer');
    const subtitleEl = document.getElementById('subtitle');
    const detailsEl = document.getElementById('details');
    
    answerEl.textContent = '?';
    answerEl.className = 'answer error';
    subtitleEl.innerHTML = '<span class="live-indicator"></span>Connection error';
    detailsEl.innerHTML = `<div class="error">${message}</div>`;
}

function startListening() {
    console.log('Starting DB listener...');
    
    const statusRef = ref(database, 'locationStatus');
    
    // Listen for real-time updates
    onValue(statusRef, (snapshot) => {
        try {
            const data = snapshot.val();
            console.log('Raw Firebase data:', data);
            
            if (!data) {
                console.log('DB data received: No data');
                // Show error state only if we truly have no data
                const answerEl = document.getElementById('answer');
                const subtitleEl = document.getElementById('subtitle');
                const detailsEl = document.getElementById('details');
                
                answerEl.textContent = '?';
                answerEl.className = 'answer error';
                subtitleEl.innerHTML = '<span class="live-indicator"></span>No data available';
                detailsEl.innerHTML = '<div class="error">No status updates found</div>';
                return;
            }
            
            // Validate that we have the essential fields before processing
            if (data.hasOwnProperty('at_work') && data.hasOwnProperty('location_type')) {
                console.log('DB data received: Complete status updated');
                showStatus(data);
            } else {
                console.log('DB data received: Incomplete data, waiting for complete update');
                // Don't update UI with incomplete data, keep previous state
            }
            
        } catch (error) {
            console.error('Error processing DB data:', error);
            showError('Error processing status data');
        }
    }, (error) => {
        console.error('DB listening error:', error);
        showError(`DB connection error: ${error.message}`);
    });
}

// Start listening when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, starting DB listener...');
    
    // Easter egg for curious developers
    console.log('john get out of there 😸');
    
    try {
        startListening();
    } catch (error) {
        console.error('Failed to initialize DB listener:', error);
        showError('Failed to connect to DB');
    }
});

// Clean up listener when page unloads
window.addEventListener('beforeunload', function() {
    const statusRef = ref(database, 'locationStatus');
    off(statusRef);
});

console.log('lol.js setup complete');
