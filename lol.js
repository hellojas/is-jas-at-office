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
        radius: 100,
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
