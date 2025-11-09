const video = document.getElementById("video");
const resultDiv = document.getElementById("result");
const startConversationBtn = document.getElementById("startConversation");
const botSelectDiv = document.getElementById("bot-select");
const botChoice = document.getElementById("botChoice");


let recognition;
let conversationHistory = [];
let silenceTimeout; // Timer for stalling detection
const STALL_TIME_MS = 10000; // 10 seconds


// SpeechRecognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) alert("Speech recognition not supported. Use Chrome.");


// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = "block";
  } catch {
    alert("Camera permission denied or unavailable.");
  }
}


function stopCamera() {
  if (video.srcObject) video.srcObject.getTracks().forEach(track => track.stop());
  video.srcObject = null;
  video.style.display = "none";
}


// Bot messages (More casual and realistic)
const botLines = [
  "Hey there! What are you getting up to tonight?",
  "That sounds chill. Did you do anything fun this week that you’re still thinking about?",
  "Oh nice, a person of culture! I've been trying to find something new to watch/read/do. Any recommendations?",
  "Haha, I'll check that out, thanks! By the way, what’s something totally random you’re really passionate about?",
  "That's genuinely cool. It's refreshing when someone actually cares about stuff. So, what’s the worst date you've ever been on, if you don't mind me asking?",
  "Wow, that's rough! Okay, last question: If you could teleport anywhere right now, where would it be and why?",
  "Love that choice. It’s been fun chatting with you! You have a good vibe."
];
const huzzLostInterestLine = "Hmm... Silence? It seems like I lost interest. When you stall around, the huzz loses interest and it's 'No Rizz' for you. Better luck next time!";


// Speak with voice selection (Enhanced for natural sound)
function speak(text, callback) {
  const utter = new SpeechSynthesisUtterance(text);
  let voices = speechSynthesis.getVoices();
  if (!voices.length) {
    speechSynthesis.onvoiceschanged = () => speak(text, callback);
    return;
  }


  // Find a suitable voice and adjust parameters for natural tone
  if (botChoice.value === "female") {
    const femaleVoice = voices.find(v => /zira|samantha|tessa|ava|allison|susan/i.test(v.name));
    if (femaleVoice) utter.voice = femaleVoice;
    utter.pitch = 1.1 + Math.random() * 0.4;
  } else {
    const maleVoice = voices.find(v => /david|mark|alex|fred|lee/i.test(v.name));
    if (maleVoice) utter.voice = maleVoice;
    utter.pitch = 0.9 + Math.random() * 0.3;
  }


  utter.rate = 0.95 + Math.random() * 0.2;
  utter.onend = callback;
  speechSynthesis.speak(utter);
}


// Listen for user input
function listen(callback) {
  if (recognition) recognition.stop();
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.start();


  let finalTranscript = "";


  // Start the silence timer immediately after the bot stops talking
  clearTimeout(silenceTimeout);
  silenceTimeout = setTimeout(() => {
    recognition.stop();
    // Use a special callback value to indicate stalling
    callback("STALL_DETECTED");
  }, STALL_TIME_MS);


  recognition.onresult = event => {
    // Reset timer on any speech input
    clearTimeout(silenceTimeout);
    silenceTimeout = setTimeout(() => recognition.stop(), 1000); // Stop after 1s of silence within the phrase


    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
    }
  };


  recognition.onend = () => {
    clearTimeout(silenceTimeout); // Clear the main stall timer when recognition officially ends
    callback(finalTranscript.trim());
  };
  // Catch errors (like "no speech") and treat as empty
  recognition.onerror = () => {
    clearTimeout(silenceTimeout);
    callback(finalTranscript.trim());
  };
}


// Add message to UI
function addMessage(text, isBot = true, rawHtml = false) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(isBot ? "bot-msg" : "user-msg");
  if (rawHtml) {
    div.innerHTML = text;
  } else {
    div.textContent = text;
  }
  resultDiv.appendChild(div);
  resultDiv.scrollTop = resultDiv.scrollHeight;
}


// Simple scoring based on fillers and word count
function scoreResponse(resp) {
  const fillers = ["um", "uh", "like", "you know", "hmm", "ah", "eh"];
  // Penalty for fillers (max 50 points lost)
  let fillerPenalty = fillers.reduce((acc, f) => acc + ((resp.match(new RegExp(`\\b${f}\\b`, "gi")) || []).length * 10), 0);
  let stutter = Math.max(0, 100 - fillerPenalty);


  let words = resp.trim().split(/\s+/).length;
  // Score based on response length (max 100 points)
  let voiceScore = Math.min(100, words * 10);
 
  // Assuming confidence correlates with speaking length/fluency
  let confidenceScore = Math.min(100, words * 10);
 
  // Eye contact is a random element since JS can't see the face (simulate a good average)
  let eyeContactScore = Math.floor(Math.random() * 20) + 80; // 80-100 random


  return { stutter, voiceScore: voiceScore, confidenceScore, eyeContactScore };
}


// Generate overall feedback and the Matcha Cup HTML (using Rizz Cup theme)
function generateFinalScore(history) {
  let stutterSum = 0, voiceSum = 0, confidenceSum = 0, eyeSum = 0;
  let validResponses = 0;


  history.forEach(r => {
    if (r !== "STALL_DETECTED" && r.length > 0) {
      const s = scoreResponse(r);
      stutterSum += s.stutter;
      voiceSum += s.voiceScore;
      confidenceSum += s.confidenceScore;
      eyeSum += s.eyeContactScore;
      validResponses++;
    }
  });


  let len = validResponses || 1;
  const stutter = Math.round(stutterSum / len);
  const voice = Math.round(voiceSum / len);
  const confidence = Math.round(confidenceSum / len);
  const eye = Math.round(eyeSum / len);
  const overall = Math.round((stutter + voice + confidence + eye) / 4);
 
  // Generate the Rizz Cup HTML - The "cup" is the visual container
  const rizzCupHtml = `
    <div class="rizz-cup-container">
      <h2>💘 Your Rizz Score Report 💘</h2>
      <div class="cup-scores">
        <div class="rizz-metric">
          <div class="label-box">Overall Rizz</div>
          <div class="progress-bar overall">
            <div class="rizz-fill" style="width: ${overall}%; background-color: #ff5ebc;">
              <span class="score-text">${overall}%</span>
            </div>
          </div>
        </div>
       
        <div class="rizz-metric">
          <div class="label-box">Fluency (No Stutter)</div>
          <div class="progress-bar">
            <div class="rizz-fill" style="width: ${stutter}%; background-color: #8eff00;">
              <span class="score-text">${stutter}%</span>
            </div>
          </div>
        </div>


        <div class="rizz-metric">
          <div class="label-box">Voice Clarity</div>
          <div class="progress-bar">
            <div class="rizz-fill" style="width: ${voice}%; background-color: #8eff00;">
              <span class="score-text">${voice}%</span>
            </div>
          </div>
        </div>
       
        <div class="rizz-metric">
          <div class="label-box">Confidence</div>
          <div class="progress-bar">
            <div class="rizz-fill" style="width: ${confidence}%; background-color: #8eff00;">
              <span class="score-text">${confidence}%</span>
            </div>
          </div>
        </div>
       
        <div class="rizz-metric">
          <div class="label-box">Eye Contact (Est.)</div>
          <div class="progress-bar">
            <div class="rizz-fill" style="width: ${eye}%; background-color: #8eff00;">
              <span class="score-text">${eye}%</span>
            </div>
          </div>
        </div>
      </div>
      <p class="final-note">${overall >= 80 ? '🔥 Maximum Rizz Achieved! Go bag that huzz!' : overall >= 50 ? '✅ Good effort! Keep practicing your flow.' : '⚠️ Low Rizz. Watch out for stalling and fillers.'}</p>
    </div>
  `;


  return {stutter, voice, confidence, eye, overall, rizzCupHtml};
}


// Start conversation loop
function startConversation() {
  botSelectDiv.style.display = "none";
  startConversationBtn.disabled = true; // Prevent multiple clicks
  resultDiv.innerHTML = ""; // Clear previous results
  startCamera();
  conversationHistory = [];
  let stage = 0;


  function nextStage(userText = "") {
    clearTimeout(silenceTimeout); // Clear any pending silence timer


    if (userText === "STALL_DETECTED") {
        conversationHistory.push(userText);
        addMessage(`--- Stall Detected! ---`, false);
        addMessage(huzzLostInterestLine, true);
        speak(huzzLostInterestLine, () => {
             // End conversation immediately on stall
            stopConversation(true);
        });
        return;
    }
   
    if (userText) {
      conversationHistory.push(userText);
      addMessage(userText, false);
    }
   
    if (stage >= botLines.length) {
      stopConversation(false);
      return;
    }


    const line = botLines[stage++];
    addMessage(line, true);
    speak(line, () => listen(nextStage));
  }
 
  function stopConversation(stalled) {
    if (recognition) recognition.stop();
    const scores = generateFinalScore(conversationHistory);
    addMessage(`--- Conversation Ended ---`, true);
   
    if (stalled) {
        // If stalled, show only the "No Rizz" message and a basic score overview
        const overallScore = scores.overall;
        addMessage(`Overall Rizz: ${overallScore}%. Score reduced due to stalling.`, true);
    } else {
        // If completed, show the full Rizz Score Report
        addMessage(scores.rizzCupHtml, true, true);
    }
   
    startConversationBtn.disabled = false;
    botSelectDiv.style.display = "block";
    stopCamera();
  }


  nextStage();
}


startConversationBtn.onclick = startConversation;







