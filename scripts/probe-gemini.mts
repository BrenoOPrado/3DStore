import "dotenv/config";

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
if (!key) {
  console.error("missing GEMINI_API_KEY");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: 'Responda APENAS JSON: {"ok":true,"reply":"teste"}' }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 120,
      responseMimeType: "application/json",
    },
  }),
});
const text = await res.text();
console.log("status", res.status, "model", model);
console.log(text.slice(0, 800));
