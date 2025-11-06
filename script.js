import { storage } from "./firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

const imagesRef = ref(storage, "images/");

// Função para carregar imagens existentes
async function loadGallery() {
  gallery.innerHTML = "";
  const list = await listAll(imagesRef);
  for (const item of list.items) {
    const url = await getDownloadURL(item);
    const img = document.createElement("img");
    img.src = url;
    gallery.appendChild(img);
  }
}

// Upload de imagem
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Selecione uma imagem primeiro!");
    return;
  }

  const fileRef = ref(storage, "images/" + file.name);
  await uploadBytes(fileRef, file);
  alert("Foto enviada com sucesso!");
  fileInput.value = "";
  loadGallery();
});

loadGallery();
