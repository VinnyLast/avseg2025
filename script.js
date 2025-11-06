// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDC38KMC9I2twZAA2jY-qfUXsXOLTX0W9Y",
  authDomain: "avseg2025.firebaseapp.com",
  projectId: "avseg2025",
};

// Inicializa Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("photoInput");
const gallery = document.getElementById("gallery");

// Função pra carregar as imagens
async function loadGallery() {
  gallery.innerHTML = "<p>Carregando...</p>";

  const q = query(collection(db, "fotos"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  gallery.innerHTML = "";
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const img = document.createElement("img");
    img.src = data.imageBase64;
    img.alt = "Foto enviada";
    img.classList.add("photo");
    gallery.appendChild(img);
  });
}

// Quando o usuário enviar o formulário
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) return alert("Selecione uma imagem primeiro!");

  const reader = new FileReader();

  reader.onload = async (event) => {
    const imageBase64 = event.target.result;

    try {
      await addDoc(collection(db, "fotos"), {
        imageBase64,
        timestamp: new Date(),
      });

      alert("Foto enviada com sucesso!");
      fileInput.value = "";
      loadGallery();
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      alert("Erro ao enviar a foto.");
    }
  };

  reader.readAsDataURL(file); // Converte imagem para Base64
});

loadGallery();
