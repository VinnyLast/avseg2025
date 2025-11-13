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

// ---- LOGIN ADMIN (botão invisível canto direito) ----
const adminTrigger = document.createElement("div");
adminTrigger.id = "admin-trigger";
adminTrigger.style.position = "fixed";
adminTrigger.style.top = "10px";
adminTrigger.style.right = "10px";
adminTrigger.style.width = "40px";
adminTrigger.style.height = "40px";
adminTrigger.style.cursor = "pointer";
adminTrigger.style.zIndex = "999";
document.body.appendChild(adminTrigger);

// Botão de download (criado dinamicamente)
const downloadBtn = document.createElement("button");
downloadBtn.id = "download-btn";
downloadBtn.textContent = "📥 Baixar todas as fotos";
downloadBtn.style.position = "fixed";
downloadBtn.style.top = "60px";
downloadBtn.style.right = "20px";
downloadBtn.style.background = "gold";
downloadBtn.style.border = "none";
downloadBtn.style.padding = "10px 16px";
downloadBtn.style.borderRadius = "8px";
downloadBtn.style.cursor = "pointer";
downloadBtn.style.fontWeight = "bold";
downloadBtn.style.display = "none";
downloadBtn.style.zIndex = "998";
downloadBtn.style.boxShadow = "0 0 10px rgba(255, 204, 0, 0.4)";
document.body.appendChild(downloadBtn);

adminTrigger.addEventListener("click", () => {
  const senha = prompt("Digite a senha do administrador:");
  if (senha === "avseg2025") {
    adminMode = !adminMode;
    alert(adminMode ? "Modo administrador ativado!" : "Modo administrador desativado.");

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.style.display = adminMode ? "block" : "none";
    });
    downloadBtn.style.display = adminMode ? "block" : "none";
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
        0.8
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

    img.addEventListener("click", () => {
      modal.style.display = "block";
      modalImg.src = data.imageBase64;
      modalCaption.innerHTML = `
        <p><strong>${data.userName || "Anônimo"}</strong></p>
        ${data.description ? `<p>${data.description}</p>` : ""}
      `;
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.classList.add("delete-btn");
    delBtn.style.display = adminMode ? "block" : "none";
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
downloadBtn.addEventListener("click", async () => {
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

// ---- Confete dourado animado ----
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

let particles = [];
const colors = ["#ffcc00", "#fff1a8", "#ffe066"];
const maxParticles = 100;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    size: Math.random() * 5 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 2 + 1,
    angle: Math.random() * 360,
    rotationSpeed: Math.random() * 2 - 1,
  };
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let p of particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.angle * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();

    p.y += p.speed;
    p.angle += p.rotationSpeed;

    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
  }
  requestAnimationFrame(drawParticles);
}

for (let i = 0; i < maxParticles; i++) {
  particles.push(createParticle());
}
drawParticles();

loadGallery();
