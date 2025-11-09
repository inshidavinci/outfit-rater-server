import React, { useState, useRef } from "react";

export default function utfitRater() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const SERVER_URL = "http://localhost:5000"; // your Node server

  // File upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Camera capture
  const handleCamera = async () => {
    if (!cameraStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        videoRef.current.srcObject = stream;
      } catch {
        alert("Camera access denied or unavailable 😢");
      }
    } else {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL("image/png");
      setUploadedImage(imageData);

      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Analyze outfit via Node server
  const analyzeOutfit = async () => {
    if (!uploadedImage) {
      setResult("👀 Upload or take a picture first!");
      return;
    }

    setLoading(true);
    setResult("Analyzing outfit... 🔎");

    try {
      const resp = await fetch(`${SERVER_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Server error");

      // Customize feedback
      const labels = json?.modelResponse?.labels || [];
      let score = 0;
      let feedback = [];
      if (labels.includes("baggy jeans")) { score++; feedback.push("Baggy jeans energy 😎"); }
      if (labels.includes("jacket")) { score++; feedback.push("Layered like a pro 🧥"); }
      if (labels.includes("bag") || labels.includes("purse")) { score++; feedback.push("Bag game strong 👜"); }
      if (labels.includes("necklace") || labels.includes("bracelet")) { score += 2; feedback.push("Accessorized queen 👑"); }
      if (score === 0) feedback.push("Clean and minimalistic 🖤");

      setResult(`Performative Outfit Score: ${score}/5\n${feedback.join(", ")}`);
    } catch (err) {
      console.error(err);
      setResult("❌ Error analyzing outfit 😢");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-6 space-y-4 bg-gradient-to-br from-pink-100 via-white to-green-100 rounded-2xl shadow-md max-w-md mx-auto">
      <h1 className="text-3xl font-bold">
        👗 <span className="text-green-600">Outfit</span><span className="text-pink-500">Rater</span>
      </h1>
      <p className="text-gray-600">Upload your fit or take a picture 💅</p>

      <input type="file" accept="image/*" onChange={handleUpload} />
      <button onClick={handleCamera} className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-lg">
        {cameraStream ? "📸 Capture Photo" : "📷 Take Photo"}
      </button>

      <video ref={videoRef} autoPlay playsInline hidden={!cameraStream} className="rounded-xl" />
      <canvas ref={canvasRef} hidden></canvas>

      {uploadedImage && <img src={uploadedImage} alt="Outfit Preview" className="max-w-xs rounded-xl border-2 border-pink-200" />}

      <button onClick={analyzeOutfit} disabled={loading} className="bg-pink-400 hover:bg-pink-500 text-white px-5 py-2 rounded-lg mt-3">
        {loading ? "Analyzing..." : "Rate My Fit"}
      </button>

      <p className="mt-3 text-gray-800 whitespace-pre-line">{result}</p>
    </div>
  );
}
