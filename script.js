import { db, storage } from "./firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

const imagesCollection = collection(db, "images");

// Carregar imagens do Firestore
async function loadGallery() {
  gallery.innerHTML = "";
  const snapshot = await getDocs(imagesCollection);
  snapshot.forEach((doc) => {
    const data = doc.data();
    const img = document.createElement("img");
    img.src = data.url;
    gallery.appendChild(img);
  });
}

// Upload e salvar URL no Firestore
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Selecione uma imagem primeiro!");
    return;
  }

  const fileRef = ref(storage, "images/" + file.name);
  await uploadBytes(fileRef, file);

  const url = await getDownloadURL(fileRef);

  await addDoc(imagesCollection, { url });

  alert("Foto enviada com sucesso!");
  fileInput.value = "";
  loadGallery();
});

loadGallery();
