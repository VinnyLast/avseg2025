// Importar Firebase
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDC38KMC9I2twZAA2jY-qfUXsXOLTX0W9Y",
  authDomain: "avseg2025.firebaseapp.com",
  projectId: "avseg2025",
  storageBucket: "avseg2025.appspot.com",
  messagingSenderId: "624856699500",
  appId: "1:624856699500:web:028b4a8cdbe56175bb3e49"
};

// Inicializa
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
