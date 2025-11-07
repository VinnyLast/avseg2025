// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDC38KMC9I2twZAA2jY-qfUXsXOLTX0W9Y",
  authDomain: "avseg2025.firebaseapp.com",
  projectId: "avseg2025",
};

// Inicializa Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referências
const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("photoInput");
const descInput = document.getElementById("photoDesc");
const gallery = document.getElementById("gallery");

const modal = document.getElementById("photoModal");
const modalImg = document.getElementById("modalImage");
const modalCaption = document.getElementById("modalCaption");
const closeModal = document.querySelector(".close");

let userName = localStorage.getItem("userName");
let adminMode = false;

// ---- Pergunta nome ----
if (!userName) {
  userName = prompt("Qual é o seu nome?");
  if (userName && userName.trim() !== "") {
    localStorage.setItem("userName", userName.trim());
  } else {
    userName = "Anônimo";
  }
}

// ---- LOGIN ADMIN ----
document.getElementById("admin-trigger").addEventListener("click", () => {
  const senha = prompt("Digite a senha do administrador:");
  if (senha === "avseg2025") {
    adminMode = true;
    alert("Modo administrador ativado!");
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.style.display = "block";
    });
    document.getElementById("download-btn").style.display = "block";
  } else if (senha !== null) {
    alert("Senha incorreta!");
  }
});

// ---- Carregar galeria ----
async function loadGallery() {
  gallery.innerHTML = "<p>Carregando...</p>";

  const q = query(collection(db, "fotos"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  gallery.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const imgContainer = document.createElement("div");
    imgContainer.classList.add("photo-item");

    const img = document.createElement("img");
    img.src = data.imageBase64;
    img.alt = "Foto enviada";
    img.classList.add("photo");

    // Abre modal ao clicar
    img.addEventListener("click", () => {
      modal.style.display = "block";
      modalImg.src = data.imageBase64;
      modalCaption.innerHTML = `
        <p><strong>${data.userName || "Anônimo"}</strong></p>
        ${data.description ? `<p>${data.description}</p>` : ""}
      `;
    });

    // Botão de apagar (admin)
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.classList.add("delete-btn");
    if (adminMode) delBtn.style.display = "block";
    delBtn.addEventListener("click", async () => {
      if (confirm("Deseja apagar esta foto?")) {
        await deleteDoc(doc(db, "fotos", docSnap.id));
        imgContainer.remove();
      }
    });

    imgContainer.appendChild(img);
    imgContainer.appendChild(delBtn);
    gallery.appendChild(imgContainer);
  });
}
// Função auxiliar para converter HEIC para JPEG
async function convertToJpeg(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.includes("heic")) return resolve(file); // já está OK

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const heic2any = await import("https://cdn.jsdelivr.net/npm/heic2any@0.0.3/dist/heic2any.min.js");
        const blob = await heic2any.default({
          blob: event.target.result,
          toType: "image/jpeg",
        });
        resolve(new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" }));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ---- Enviar foto ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("photoInput");
let file = fileInput.files[0];
file = await convertToJpeg(file); // <-- adiciona essa linha

  const description = descInput.value.trim();
  if (!file) return alert("Selecione uma imagem primeiro!");

  const reader = new FileReader();
  reader.onload = async (event) => {
    const imageBase64 = event.target.result;
    try {
      await addDoc(collection(db, "fotos"), {
        imageBase64,
        userName,
        description,
        timestamp: new Date(),
      });
      alert("Foto enviada com sucesso!");
      fileInput.value = "";
      descInput.value = "";
      loadGallery();
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      alert("Erro ao enviar a foto.");
    }
  };
  reader.readAsDataURL(file);
});

// ---- Fechar modal ----
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (event) => {
  if (event.target === modal) modal.style.display = "none";
};

// ---- Baixar todas as fotos (admin) ----
document.getElementById("download-btn").addEventListener("click", async () => {
  const snapshot = await getDocs(collection(db, "fotos"));
  const zip = new JSZip();
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const base64 = data.imageBase64.split(",")[1];
    const filename = `${data.userName || "sem_nome"}-${docSnap.id}.jpg`;
    zip.file(filename, base64, { base64: true });
  }
  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = "avseg_fotos.zip";
  a.click();
});

loadGallery();
