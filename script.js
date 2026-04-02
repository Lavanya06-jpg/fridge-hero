const form = document.getElementById("ingredients-form");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // 1. Gets values from 3 ingredient inputs
  const ingredient1 = form.querySelector('[name="ingredient1"]')?.value.trim();
  const ingredient2 = form.querySelector('[name="ingredient2"]')?.value.trim();
  const ingredient3 = form.querySelector('[name="ingredient3"]')?.value.trim();

  // 2. Validates they're not empty
  if (!ingredient1 || !ingredient2 || !ingredient3) {
    showError("Please enter all 3 ingredients.");
    return;
  }

  // 3. Build prompt
  const prompt = `You are a creative chef. Given these 3 ingredients: ${ingredient1}, ${ingredient2}, ${ingredient3}, create:
1. A fancy French-inspired dish name
2. A 3-step cooking instruction (each step one sentence)
Return ONLY JSON:
{ dishName: string, steps: string[] }`;

  // 4. Use the API key and new endpoint model ("gemini-1.5-pro"), not -latest, and v1
  const apiKey = (window.__GEMINI_API_KEY__ && window.__GEMINI_API_KEY__.trim());
  if (!apiKey) {
    showError("Missing Gemini API key");
    return;
  }
  // 5. Build the required API url
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  console.log(url);

  showLoading();

  try {
    // 6. Send request in correct JSON format, no extra keys
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    // 7. Parse JSON response safely
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let jsonMatch = text.match(/{[\s\S]*}/);
    let result;
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("Failed to parse JSON.");
      }
    } else {
      throw new Error("No JSON found in response.");
    }

    // 8. Display result
    showResultCard(result.dishName, result.steps);
  } catch (err) {
    // 9. Handle errors
    showError(err.message || "Something went wrong.");
  } finally {
    hideLoading();
  }

  // Helpers
  function showResultCard(dishName, steps) {
    let card = document.getElementById("result-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "result-card";
      card.style.transition = "opacity 0.4s, transform 0.4s";
      card.style.opacity = 0;
      card.style.transform = "translateY(24px)";
      document.body.appendChild(card);
    }
    card.innerHTML = `<h2>${dishName}</h2>
      <ol>${steps.map(s => `<li>${s}</li>`).join("")}</ol>`;
    requestAnimationFrame(() => {
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    });
  }

  function showError(msg) {
    let err = document.getElementById("result-error");
    if (!err) {
      err = document.createElement("div");
      err.id = "result-error";
      err.style.color = "crimson";
      err.style.fontWeight = "bold";
      err.style.margin = "1em 0";
      document.body.appendChild(err);
    }
    err.textContent = msg;
    let card = document.getElementById("result-card");
    if (card) card.style.opacity = 0;
  }

  function showLoading() {
    let spin = document.getElementById("result-spinner");
    if (!spin) {
      spin = document.createElement("div");
      spin.id = "result-spinner";
      spin.textContent = "Loading...";
      spin.style.margin = "1em";
      document.body.appendChild(spin);
    }
    spin.style.display = "";
  }

  function hideLoading() {
    let spin = document.getElementById("result-spinner");
    if (spin) spin.style.display = "none";
  }
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // 1. Get values from 3 ingredient inputs
  const ingredient1 = form.querySelector('[name="ingredient1"]')?.value.trim();
  const ingredient2 = form.querySelector('[name="ingredient2"]')?.value.trim();
  const ingredient3 = form.querySelector('[name="ingredient3"]')?.value.trim();

  // 2. Validate they're not empty
  if (!ingredient1 || !ingredient2 || !ingredient3) {
    showError("Please enter all 3 ingredients.");
    return;
  }

  // 3. Build prompt
  const prompt = `You are a creative chef. Given these 3 ingredients: ${ingredient1},
${ingredient2}, ${ingredient3}, create:
1. A fancy French-inspired dish name
2. A 3-step cooking instruction (each step one sentence)
Format as JSON: {dishName: string, steps: string[]}`;

  // Use API key from window or meta tag
  const apiKey =
    (window.__GEMINI_API_KEY__ && window.__GEMINI_API_KEY__.trim()) ||
    (document.querySelector('meta[name="gemini-api-key"]')?.content?.trim());

  if (!apiKey) {
    showError('Missing Gemini API key');
    return;
  }

  // API endpoint with API key from environment
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${window.__GEMINI_API_KEY__}`;

  // Optionally, update button state and show loading
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Cooking…";
  }
  showLoading();

  try {
    // 3. Call Gemini API
    const response = await fetch(url,{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.error?.message || response.statusText || "Request failed";
      throw new Error(`Gemini API error (${response.status}): ${msg}`);
    }

    // 4. Parse JSON response (extract text and parse as JSON)
    const textResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text ||
      "";
    let parsed;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      throw new Error("Could not parse model response as JSON.");
    }

    // 5. Display in result card with animation
    showRecipe(parsed.dishName, parsed.steps);

  } catch (err) {
    // 6. Handle errors gracefully
    showError(
      `Could not generate recipe. ${
        err instanceof Error ? err.message : "Unknown error."
      }`
    );
    console.error("Recipe generation error:", err);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Cook Magic ✨";
    }
  }
});
const resultCard = document.getElementById("result-card");
const resultText = document.getElementById("result-text");
const submitButton = form.querySelector('button[type="submit"]');

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

/**
 * API key: set `window.__GEMINI_API_KEY__` before this script (e.g. local config snippet),
 * or add `<meta name="gemini-api-key" content="YOUR_KEY" />` in the document head.
 * Never commit real keys to source control.
 */
function getGeminiApiKey() {
  if (typeof window !== "undefined") {
    const w = window.__GEMINI_API_KEY__;
    if (typeof w === "string" && w.trim()) return w.trim();
  }
  const meta = document.querySelector('meta[name="gemini-api-key"]');
  if (meta?.content?.trim()) return meta.content.trim();
  return "";
}

function buildPrompt(ingredient1, ingredient2, ingredient3) {
  return `You are a creative chef. Given these 3 ingredients: ${ingredient1},
${ingredient2}, ${ingredient3}, create:
1. A fancy French-inspired dish name
2. A 3-step cooking instruction (each step one sentence)
Format as JSON: {dishName: string, steps: string[]}
Return only valid JSON, no markdown fences.`;
}

function showCardWithAnimation() {
  resultCard.hidden = true;
  void resultCard.offsetWidth;
  resultCard.hidden = false;
}

function showLoading() {
  resultText.style.color = "";
  resultText.textContent = "Cooking up your magic recipe…";
  showCardWithAnimation();
}

function showRecipe(dishName, steps) {
  resultText.style.color = "";
  resultText.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = String(dishName || "").trim();

  const list = document.createElement("ol");
  (Array.isArray(steps) ? steps : []).forEach((step) => {
    const item = document.createElement("li");
    item.textContent = String(step);
    list.appendChild(item);
  });

  resultText.append(title, list);
  showCardWithAnimation();
}

function showError(message) {
  resultText.replaceChildren();
  resultText.textContent = String(message);
  resultText.style.color = "#ffd6d6";
  showCardWithAnimation();
}

function hideResult() {
  resultCard.hidden = true;
  resultText.replaceChildren();
  resultText.style.color = "";
}

function parseGeminiJson(textResponse) {
  if (!textResponse) {
    throw new Error("Empty model response.");
  }

  const cleaned = textResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not find JSON in model response.");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const validSteps =
    Array.isArray(parsed.steps) &&
    parsed.steps.length === 3 &&
    parsed.steps.every((step) => typeof step === "string" && step.trim().length > 0);

  if (typeof parsed.dishName !== "string" || !parsed.dishName.trim() || !validSteps) {
    throw new Error("Unexpected response shape.");
  }

  return {
    dishName: parsed.dishName.trim(),
    steps: parsed.steps.map((step) => step.trim())
  };
}

["ingredient-1", "ingredient-2", "ingredient-3"].forEach((id) => {
  document.getElementById(id).addEventListener("input", hideResult);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ingredient1 = document.getElementById("ingredient-1").value.trim();
  const ingredient2 = document.getElementById("ingredient-2").value.trim();
  const ingredient3 = document.getElementById("ingredient-3").value.trim();

  if (!ingredient1 || !ingredient2 || !ingredient3) {
    showError("Please fill in all three ingredient fields.");
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    showError(
      "Missing API key. Set window.__GEMINI_API_KEY__ before this script or add a meta tag gemini-api-key (see script.js comment)."
    );
    return;
  }

  const prompt = buildPrompt(ingredient1, ingredient2, ingredient3);
  submitButton.disabled = true;
  submitButton.textContent = "Cooking…";
  showLoading();

  try {
    const response = await fetch(`${GEMINI_BASE_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.error?.message || response.statusText || "Request failed";
      throw new Error(`Gemini API error (${response.status}): ${msg}`);
    }

    const textResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text ||
      "";

    if (data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== "STOP") {
      throw new Error(`Generation stopped: ${data.candidates[0].finishReason}`);
    }

    const parsed = parseGeminiJson(textResponse);
    showRecipe(parsed.dishName, parsed.steps);
  } catch (error) {
    const friendly =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating the recipe.";
    showError(`Could not generate recipe. ${friendly}`);
    console.error("Recipe generation error:", error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Cook Magic ✨";
  }
});
