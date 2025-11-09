// ---------- Get Coordinates ----------
async function getCoordinates(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ca&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}


// ---------- Reverse Geocode ----------
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const parts = [
        addr.house_number,
        addr.road,
        addr.city || addr.town || addr.village,
        addr.state,
      ].filter(Boolean);
      return parts.join(", ");
    }
  } catch {
    return null;
  }
  return null;
}


// ---------- Fetch Cafés ----------
async function fetchCafes(lat, lon, radiusKm) {
  const radiusMeters = Math.min(radiusKm * 1000, 20000);
  const query = `[out:json][timeout:5];
    node(around:${radiusMeters},${lat},${lon})[amenity=cafe];
    out tags;`;


  const servers = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];


  for (const server of servers) {
    try {
      const res = await fetch(`${server}?data=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();


      const cafes = [];
      for (const el of data.elements) {
        const name = el.tags.name || "Unnamed Café ☕";
        const addrParts = [
          el.tags["addr:housenumber"],
          el.tags["addr:street"],
          el.tags["addr:city"],
          el.tags["addr:province"],
        ].filter(Boolean);
        let address = addrParts.join(", ");
        if (!address) address = await reverseGeocode(el.lat, el.lon);
        if (!address) continue; // skip if unknown


        const mapQuery = encodeURIComponent(`${name} ${address}`);
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        cafes.push({ name, address, mapLink });
      }
      return cafes;
    } catch (err) {
      console.warn(`⚠️ ${server} failed, trying next...`, err);
    }
  }
  throw new Error("All Overpass servers failed.");
}


// ---------- Get Real Menu ----------
function getRealMenuForCafe(name) {
  const lower = name.toLowerCase();
  for (const key in menuDatabase) {
    if (lower.includes(key)) return menuDatabase[key];
  }
  return menuDatabase["generic"];
}


// ---------- Toggleable Drink List ----------
function toggleDrinkList(button, cafeName) {
  const existing = button.parentNode.nextElementSibling;
  if (existing && existing.classList.contains("drink-list")) {
    existing.remove();
    return;
  }


  document.querySelectorAll(".drink-list").forEach((d) => d.remove());


  const drinks = getRealMenuForCafe(cafeName);
  const div = document.createElement("div");
  div.classList.add("drink-list");
  div.innerHTML = `<h4>Top 5 Performative Drinks at ${cafeName}</h4>`;
  drinks.slice(0, 5).forEach((drink) => {
    const p = document.createElement("p");
    p.textContent = `🥤 ${drink}`;
    p.style.color = "black";
    div.appendChild(p);
  });
  button.parentNode.insertAdjacentElement("afterend", div);
}


// ---------- Search ----------
document.getElementById("searchBtn").addEventListener("click", async () => {
  const address = document.getElementById("addressInput").value.trim();
  const radius = parseFloat(document.getElementById("radiusInput").value);
  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loading");


  resultsDiv.innerHTML = "";
  if (!address || isNaN(radius)) {
    resultsDiv.innerHTML = "<p>Please enter both an address and radius ☺️</p>";
    return;
  }


  loadingDiv.classList.remove("hidden");
  resultsDiv.innerHTML = "<p style='color:black'>🔍 Searching nearby cafés...</p>";


  const coords = await getCoordinates(address);
  if (!coords) {
    loadingDiv.classList.add("hidden");
    resultsDiv.innerHTML = "<p>Could not find that address 😅</p>";
    return;
  }


  try {
    const cafes = await fetchCafes(coords.lat, coords.lon, radius);
    loadingDiv.classList.add("hidden");


    if (!cafes.length) {
      resultsDiv.innerHTML = `<p>No cafés found within ${radius} km of "${address}" 😢</p>`;
      return;
    }


    resultsDiv.innerHTML = `<h2 style="color:black">☕ Cafés within ${radius} km of "${address}"</h2>`;
    cafes.forEach((cafe) => {
      const div = document.createElement("div");
      div.classList.add("cafe");
      div.innerHTML = `
        <strong style="color:black">${cafe.name}</strong><br>
        <span style="color:black">📍 <a href="${cafe.mapLink}" target="_blank" style="color:#007bff;text-decoration:none;">
          ${cafe.address}</a></span><br>
        <button class="view-drinks" data-cafe="${cafe.name}">Top 5 Performative Drinks 💪🧋</button>
      `;
      resultsDiv.appendChild(div);
    });


    document.querySelectorAll(".view-drinks").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        toggleDrinkList(e.target, e.target.getAttribute("data-cafe"))
      )
    );
  } catch (err) {
    loadingDiv.classList.add("hidden");
    resultsDiv.innerHTML = "<p>⚠️ Failed to load cafés. Try again later.</p>";
    console.error(err);
  }
});

