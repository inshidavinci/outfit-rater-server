const video = document.getElementById('camera');
const analyzeBtn = document.getElementById('analyzeBtn');
const rizzScore = document.getElementById('rizzScore');

// Open camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => console.error("Camera access denied:", err));

analyzeBtn.addEventListener('click', () => {
  rizzScore.textContent = "Analyzing Rizz... 👀";
  setTimeout(() => {
    const randomRizz = Math.floor(Math.random() * 100);
    rizzScore.textContent = `Rizz Score: ${randomRizz}% 🔥`;
  }, 2000);
});
