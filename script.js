// ======================== 
// 🔥 Firebase imports
// ========================
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

// ========================
// ⚙️ Configuração Firebase
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyDC38KMC9I2twZAA2jY-qfUXsXOLTX0W9Y",
  authDomain: "avseg2025.firebaseapp.com",
  projectId: "avseg2025",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========================
// 🧩 Referências do DOM
// ========================
const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("photoInput");
const descInput = document.getElementById("photoDesc");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("photoModal");
const modalImg = document.getElementById("modalImage");
const modalCaption = document.getElementById("modalCaption");
const closeModal = document.querySelector(".close");
const adminTrigger = document.getElementById("admin-trigger");
const downloadBtn = document.getElementById("download-btn");

let userName = localStorage.getItem("userName");
let adminMode = false;

// ========================
// 👤 Pergunta o nome do usuário
// ========================
if (!userName) {
  userName = prompt("Qual é o seu nome?");
  if (userName && userName.trim() !== "") {
    localStorage.setItem("userName", userName.trim());
  } else {
    userName = "Anônimo";
  }
}

// ========================
// 🔑 Ativar modo administrador
// ========================
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

// ========================
// 📏 Redimensionar imagem (para celular)
// ========================
function resizeImage(file, maxWidth = 1024, maxHeight = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => (img.src = e.target.result);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        0.8
      );
    };

    reader.readAsDataURL(file);
  });
}

// ========================
// 🖼️ Carregar galeria
// ========================
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
    img.loading = "lazy"; // ⚡ carrega só quando aparece na tela

    // 📸 Modal
    img.addEventListener("click", (e) => {
      modal.style.display = "flex";
      modalImg.src = data.imageBase64;
      modalCaption.innerHTML = `
        <p><strong>${data.userName || "Anônimo"}</strong></p>
        ${data.description ? `<p>${data.description}</p>` : ""}
      `;
    });

    // 🗑️ Botão apagar (modo admin)
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

// ========================
// 📤 Enviar foto (com trava de clique duplo)
// ========================
let enviando = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (enviando) return; // impede clique duplo
  enviando = true;

  let file = fileInput.files[0];
  if (!file) {
    alert("Selecione uma imagem primeiro!");
    enviando = false;
    return;
  }

  // Mostra carregando visual
  const btn = form.querySelector("button");
  const originalText = btn.textContent;
  btn.textContent = "Enviando...";
  btn.disabled = true;

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
      await loadGallery();
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      alert("Erro ao enviar a foto.");
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
      enviando = false;
    }
  };
  reader.readAsDataURL(file);
});


// ========================
// ❌ Modal fechar (apenas se clicar fora da imagem)
// ========================
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ========================
// ⬇️ Baixar todas as fotos (modo admin)
// ========================
downloadBtn.addEventListener("click", async () => {
  try {
    const snapshot = await getDocs(collection(db, "fotos"));
    if (snapshot.empty) {
      alert("Nenhuma foto disponível para download.");
      return;
    }

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
  } catch (err) {
    console.error("Erro ao gerar ZIP:", err);
    alert("Erro ao baixar as fotos. Tente novamente.");
  }
});

// 🎉 Confete animado (mantido)
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
let particles = [];
const colors = ["#ffcc00", "#fff1a8", "#ffe066"];
const maxParticles = 80; // 🔥 reduzido p/ performance

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
    size: Math.random() * 4 + 1,
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
    if (p.y > canvas.height) p.y = -10;
  }
  requestAnimationFrame(drawParticles);
}

for (let i = 0; i < maxParticles; i++) particles.push(createParticle());
drawParticles();

// 🚀 Inicia galeria
loadGallery();
