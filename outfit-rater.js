const outfitOptions = {
  shirts: [
    { name: "Red Shirt", img: "img/shirts/red shirt.png" },
    { name: "Blue Shirt", img: "img/shirts/blue shirt.png" },
    { name: "Green Shirt", img: "img/shirts/green shirt.png" },
    { name: "Yellow Shirt", img: "img/shirts/yellow shirt.png" },
    { name: "Purple Shirt", img: "img/shirts/purple shirt.png" },
    { name: "Black Shirt", img: "img/shirts/black shirt.png" },
    { name: "White Shirt", img: "img/shirts/white shirt.png" }
  ],
  pants: [
    { name: "Baggie Jeans", img: "img/pants/baggie-jeans.png" },
    { name: "Straight Jeans", img: "img/pants/straight-jeans.png" }
  ],
  shoes: [
    { name: "Boots", img: "img/shoes/boots.png" },
    { name: "Sneakers", img: "img/shoes/sneakers.png" }
  ],
  hats: [
    { name: "Beanie", img: "img/hats/beanie.png" },
    { name: "Cap", img: "img/hats/cap.png" }
  ],
  accessories: [
    { name: "Bag", img: "img/accessories/bag.png" },
    { name: "Watch", img: "img/accessories/watch.png" }
  ]
};

let userOutfit = {
  shirts: [],
  pants: null,
  shoes: null,
  hats: null,
  accessories: []
};

const container = document.getElementById("outfit-options");

for (let category in outfitOptions) {
  const section = document.createElement("div");
  section.classList.add("option-section");
  const title = document.createElement("h3");
  title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  section.appendChild(title);

  outfitOptions[category].forEach(item => {
    const btn = document.createElement("button");
    btn.textContent = item.name;
    btn.addEventListener("click", () => {
      handleSelection(category, item.name);
      updateButtonHighlights(section, category);
      updatePersonPreview();
      updateRizzMeter();
    });
    section.appendChild(btn);
  });
  container.appendChild(section);
}

function handleSelection(category, itemName) {
  if (category === "accessories") {
    const idx = userOutfit.accessories.indexOf(itemName);
    idx > -1 ? userOutfit.accessories.splice(idx, 1) : userOutfit.accessories.push(itemName);
  } else if (category === "shirts") {
    userOutfit.shirts = [itemName]; // single shirt for now
  } else {
    userOutfit[category] = (userOutfit[category] === itemName) ? null : itemName;
  }
}

function updateButtonHighlights(section, category) {
  section.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
  if (category === "accessories") {
    section.querySelectorAll("button").forEach(b => {
      if (userOutfit.accessories.includes(b.textContent)) b.classList.add("selected");
    });
  } else if (category === "shirts") {
    section.querySelectorAll("button").forEach(b => {
      if (userOutfit.shirts.includes(b.textContent)) b.classList.add("selected");
    });
  } else {
    section.querySelectorAll("button").forEach(b => {
      if (userOutfit[category] === b.textContent) b.classList.add("selected");
    });
  }
}

function updatePersonPreview() {
  const layers = {
    shirt: document.getElementById("person-shirt"),
    pants: document.getElementById("person-pants"),
    shoes: document.getElementById("person-shoes"),
    hat: document.getElementById("person-hat"),
    accessories: document.getElementById("person-accessories")
  };

  for (let key in layers) layers[key].innerHTML = "";

  // Hat
  if (userOutfit.hats) {
    const img = document.createElement("img");
    img.src = outfitOptions.hats.find(i => i.name === userOutfit.hats).img;
    img.style.width = "80%";
    layers.hat.appendChild(img);
  }

  // Shirt
  if (userOutfit.shirts[0]) {
    const img = document.createElement("img");
    img.src = outfitOptions.shirts.find(i => i.name === userOutfit.shirts[0]).img;
    img.style.width = "90%";
    layers.shirt.appendChild(img);
  }

  // Pants
  if (userOutfit.pants) {
    const img = document.createElement("img");
    img.src = outfitOptions.pants.find(i => i.name === userOutfit.pants).img;
    img.style.width = "90%";
    layers.pants.appendChild(img);
  }

  // Shoes
  if (userOutfit.shoes) {
    const img = document.createElement("img");
    img.src = outfitOptions.shoes.find(i => i.name === userOutfit.shoes).img;
    img.style.width = "60%";
    layers.shoes.appendChild(img);
  }

  // Accessories
  userOutfit.accessories.forEach(acc => {
    const img = document.createElement("img");
    img.src = outfitOptions.accessories.find(i => i.name === acc).img;
    img.style.width = "40px";
    layers.accessories.appendChild(img);
  });
}

function updateRizzMeter() {
  let score = 0;
  let total = 0;

  ["shirts","pants","shoes","hats"].forEach(cat => {
    if (cat === "shirts") score += userOutfit.shirts.length > 0 ? 1 : 0;
    else if (userOutfit[cat]) score += 1;
    total += 1;
  });

  const accessoryPercent = Math.min(userOutfit.accessories.length / outfitOptions.accessories.length, 1);
  score += accessoryPercent;
  total += 1;

  const percent = Math.min((score/total)*100,100);
  const fill = document.getElementById("score-fill");
  fill.style.width = percent + "%";
  fill.style.background = `linear-gradient(90deg, #7CFC00 ${percent}%, #ff66a3 100%)`;

  const result = document.getElementById("resultText");
  result.textContent = percent === 100 ? "🔥 Max Rizz! Outfit complete!" : `Rizz Progress: ${Math.round(percent)}% 👗`;
}
