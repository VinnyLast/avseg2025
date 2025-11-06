// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Configuração do Firebase da AVSEG
const firebaseConfig = {
  apiKey: "AIzaSyDC38KMC9I2twZAA2jY-qfUXsXOLTX0W9Y",
  authDomain: "avseg2025.firebaseapp.com",
  projectId: "avseg2025",
  storageBucket: "avseg2025.firebasestorage.app",
  messagingSenderId: "624856699500",
  appId: "1:624856699500:web:028b4a8cdbe56175bb3e49"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
