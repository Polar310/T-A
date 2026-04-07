const app = document.getElementById("app");
const pagerDots = [...document.querySelectorAll(".pager-dot")];
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const emojiLayer = document.getElementById("emoji-rain-layer");
const floatingLoveLayer = document.getElementById("floating-love-layer");

const photoInput = document.getElementById("photo-input");
const track = document.getElementById("carousel-track");
const prevSlideBtn = document.getElementById("prev-slide");
const nextSlideBtn = document.getElementById("next-slide");
const carousel = document.getElementById("carousel");

const envelopeStage = document.getElementById("envelope-stage");
const envelope = document.getElementById("envelope");
const swipeProgress = document.getElementById("swipe-progress");
const letterSheet = document.getElementById("letter-sheet");
const letterCloseBtn = document.getElementById("letter-close-btn");

let currentScreen = 0;
let noScale = 1;
let emojiTimer = null;
let slideIndex = 0;
const slides = [];

const emojiSet = ["💖", "💘", "💝", "💕", "💞", "😍", "😘", "❤️", "🥰", "💓"];
const ambientSet = ["💗", "✨", "💞", "💓", "🌸"];

function startAmbientBackground() {
  if (!floatingLoveLayer) return;

  const spawn = () => {
    const node = document.createElement("span");
    node.className = "float-love";
    node.textContent = ambientSet[Math.floor(Math.random() * ambientSet.length)];
    node.style.left = `${Math.random() * 100}%`;
    node.style.fontSize = `${12 + Math.random() * 14}px`;
    node.style.animationDuration = `${6.5 + Math.random() * 6.5}s`;
    node.style.opacity = `${0.35 + Math.random() * 0.45}`;
    floatingLoveLayer.appendChild(node);
    node.addEventListener("animationend", () => node.remove());
  };

  spawn();
  setInterval(spawn, 680);
}

function goToScreen(index) {
  currentScreen = Math.max(0, Math.min(2, index));
  app.style.transform = `translateX(-${currentScreen * 100}vw)`;
  pagerDots.forEach((dot, i) => dot.classList.toggle("active", i === currentScreen));
}

pagerDots.forEach((dot) => {
  dot.addEventListener("click", () => goToScreen(Number(dot.dataset.screen)));
});

function startEmojiRain(durationMs = 2600, spawnEveryMs = 80) {
  if (emojiTimer) {
    clearInterval(emojiTimer);
  }

  emojiTimer = setInterval(() => {
    const drop = document.createElement("span");
    drop.className = "emoji-drop";
    drop.textContent = emojiSet[Math.floor(Math.random() * emojiSet.length)];
    drop.style.left = `${Math.random() * 100}vw`;
    drop.style.fontSize = `${16 + Math.random() * 24}px`;
    drop.style.animationDuration = `${1.8 + Math.random() * 2.1}s`;
    drop.style.opacity = `${0.65 + Math.random() * 0.35}`;
    emojiLayer.appendChild(drop);

    drop.addEventListener("animationend", () => drop.remove());
  }, spawnEveryMs);

  setTimeout(() => {
    clearInterval(emojiTimer);
    emojiTimer = null;
  }, durationMs);
}

yesBtn.addEventListener("click", () => {
  startEmojiRain(3100, 70);
  setTimeout(() => goToScreen(1), 700);
});

noBtn.addEventListener("click", () => {
  noScale = Math.max(0, noScale - 0.18);
  noBtn.style.transform = `scale(${noScale})`;
  noBtn.style.opacity = String(noScale);

  if (noScale <= 0.15) {
    noBtn.classList.add("disappear");
    noBtn.disabled = true;
  }
});

function updateSlidePosition() {
  if (!slides.length) {
    track.style.transform = "translateX(0)";
    return;
  }
  slideIndex = (slideIndex + slides.length) % slides.length;
  track.style.transform = `translateX(-${slideIndex * 100}%)`;
}

function createSlide(src, fileName, customCaption = "", featured = false) {
  const slide = document.createElement("div");
  slide.className = `slide${featured ? " featured" : ""}`;
  const defaultCaption =
    customCaption || `A moment with you - ${fileName.replace(/\.[^.]+$/, "")}`;

  slide.innerHTML = `
    <article class="photo-card">
      <img src="${src}" alt="Uploaded memory photo">
      <div class="caption-row">
        <input type="text" value="${defaultCaption}" aria-label="Photo caption">
        <button class="like-btn" type="button" aria-label="Like photo">🤍</button>
      </div>
    </article>
  `;

  const likeBtn = slide.querySelector(".like-btn");
  let liked = false;

  likeBtn.addEventListener("click", () => {
    liked = !liked;
    likeBtn.textContent = liked ? "❤️" : "🤍";
    likeBtn.classList.toggle("liked", liked);
  });

  slides.push(slide);
  track.appendChild(slide);
  updateSlidePosition();
}

function createStarterSlide() {
  const src = "assets/featured-memory.png";
  createSlide(
    src,
    "featured-memory",
    "My favorite smile, my favorite person, my favorite everything.",
    true
  );
}

photoInput.addEventListener("change", (event) => {
  const files = [...event.target.files];
  if (!files.length) return;

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      createSlide(reader.result, file.name);
      slideIndex = slides.length - 1;
      updateSlidePosition();
    };
    reader.readAsDataURL(file);
  });

  photoInput.value = "";
});

prevSlideBtn.addEventListener("click", () => {
  slideIndex -= 1;
  updateSlidePosition();
});

nextSlideBtn.addEventListener("click", () => {
  slideIndex += 1;
  updateSlidePosition();
});

let carouselStartX = 0;
let carouselDeltaX = 0;

carousel.addEventListener(
  "touchstart",
  (e) => {
    carouselStartX = e.touches[0].clientX;
    carouselDeltaX = 0;
  },
  { passive: true }
);

carousel.addEventListener(
  "touchmove",
  (e) => {
    carouselDeltaX = e.touches[0].clientX - carouselStartX;
  },
  { passive: true }
);

carousel.addEventListener("touchend", () => {
  if (Math.abs(carouselDeltaX) < 40) return;
  if (carouselDeltaX < 0) {
    slideIndex += 1;
  } else {
    slideIndex -= 1;
  }
  updateSlidePosition();
});

let swipeStartX = 0;
let swipeCurrent = 0;
let envelopeOpened = false;
let isEnvelopeInteracting = false;
let letterExpanded = false;

function onEnvelopeSwipeMove(clientX) {
  if (envelopeOpened) return;

  const delta = Math.max(0, clientX - swipeStartX);
  const width = envelopeStage.clientWidth || 1;
  const progress = Math.min(1, delta / (width * 0.55));
  swipeCurrent = progress;
  envelope.style.setProperty("--open-progress", progress.toFixed(3));
  envelope.classList.add("opening");
  swipeProgress.textContent = `Swipe progress: ${Math.round(progress * 100)}%`;

  if (progress >= 1) {
    envelopeOpened = true;
    envelope.classList.remove("opening");
    envelope.classList.add("open");
    swipeProgress.textContent = "Opened with love 💚";
  }
}

envelopeStage.addEventListener("pointerdown", (e) => {
  if (envelopeOpened || letterExpanded) return;
  swipeStartX = e.clientX;
  swipeCurrent = 0;
  isEnvelopeInteracting = true;
  envelope.classList.add("opening");
  envelopeStage.setPointerCapture(e.pointerId);
});

envelopeStage.addEventListener("pointermove", (e) => onEnvelopeSwipeMove(e.clientX));

envelopeStage.addEventListener("pointerup", () => {
  isEnvelopeInteracting = false;
  if (!envelopeOpened && swipeCurrent < 1) {
    swipeProgress.textContent = "Swipe progress: 0%";
    envelope.style.setProperty("--open-progress", "0");
    envelope.classList.remove("opening");
  }
});

envelopeStage.addEventListener("pointercancel", () => {
  isEnvelopeInteracting = false;
  if (!envelopeOpened) {
    swipeProgress.textContent = "Swipe progress: 0%";
    envelope.style.setProperty("--open-progress", "0");
    envelope.classList.remove("opening");
  }
});

function setLetterExpanded(isExpanded) {
  letterExpanded = isExpanded;
  envelopeStage.classList.toggle("expanded", isExpanded);
  swipeProgress.textContent = isExpanded
    ? "Reading mode: tap close to return"
    : "Opened with love 💚";
}

letterSheet.addEventListener("click", (event) => {
  if (!envelopeOpened || letterExpanded) return;
  if (event.target.closest("#letter-close-btn")) return;
  setLetterExpanded(true);
});

letterCloseBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!letterExpanded) return;
  setLetterExpanded(false);
});

let pageSwipeStartX = 0;
let pageSwipeDeltaX = 0;
let isPageSwiping = false;

function canStartPageSwipe(target) {
  if (letterExpanded || isEnvelopeInteracting) return false;
  if (target.closest(".carousel, .carousel-btn, .caption-row, input, button")) return false;
  if (target.closest(".envelope-stage")) return false;
  return true;
}

document.addEventListener("pointerdown", (e) => {
  if (!canStartPageSwipe(e.target)) return;
  isPageSwiping = true;
  pageSwipeStartX = e.clientX;
  pageSwipeDeltaX = 0;
});

document.addEventListener("pointermove", (e) => {
  if (!isPageSwiping) return;
  pageSwipeDeltaX = e.clientX - pageSwipeStartX;
});

document.addEventListener("pointerup", () => {
  if (!isPageSwiping) return;
  isPageSwiping = false;
  if (Math.abs(pageSwipeDeltaX) < 70) return;
  if (pageSwipeDeltaX < 0) goToScreen(currentScreen + 1);
  if (pageSwipeDeltaX > 0) goToScreen(currentScreen - 1);
});

document.addEventListener("pointercancel", () => {
  isPageSwiping = false;
  pageSwipeDeltaX = 0;
});

startAmbientBackground();
createStarterSlide();
