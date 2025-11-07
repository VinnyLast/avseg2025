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

// ---- Redimensionar imagem (resolve problemas no celular) ----
function resizeImage(file, maxWidth = 1024, maxHeight = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const resizedFile = new File([blob], file.name, { type: "image/jpeg" });
          resolve(resizedFile);
        },
        "image/jpeg",
        0.8 // Qualidade 80%
      );
    };

    reader.readAsDataURL(file);
  });
}

// ---- Função para carregar galeria ----
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

    // Modal ao clicar
    img.addEventListener("click", () => {
      modal.style.display = "block";
      modalImg.src = data.imageBase64;
      modalCaption.innerHTML = `
        <p><strong>${data.userName || "Anônimo"}</strong></p>
        ${data.description ? `<p>${data.description}</p>` : ""}
      `;
    });

    // Botão apagar (admin)
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

// ---- Enviar foto ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let file = fileInput.files[0];
  if (!file) return alert("Selecione uma imagem primeiro!");

  // Redimensiona para celular
  file = await resizeImage(file);

  const reader = new FileReader();
  reader.onload = async (event) => {
    const imageBase64 = event.target.result;
    try {
      await addDoc(collection(db, "fotos"), {
        imageBase64,
        userName,
        description: descInput.value.trim(),
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
