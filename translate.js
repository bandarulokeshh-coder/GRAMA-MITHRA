/**
 * Shared Telugu translation for Grama Mitra (Google Translate unofficial API).
 */
function setLanguagePref(telugu) {
  try {
    sessionStorage.setItem("gmLang", telugu ? "te" : "en");
  } catch (e) {
    /* ignore */
  }
}

function isTeluguPref() {
  try {
    return sessionStorage.getItem("gmLang") === "te";
  } catch (e) {
    return false;
  }
}

async function translateText(text) {
  if (!text || String(text).trim() === "") return "";
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(String(text))}`,
    );
    const data = await res.json();
    if (data && data[0]) return data[0].map((s) => s[0]).join("");
    return text;
  } catch (e) {
    console.error("Translation error:", e);
    return text;
  }
}

async function translateStringArray(arr) {
  if (!arr || !arr.length) return [];
  const out = [];
  for (const item of arr) {
    out.push(await translateText(item));
  }
  return out;
}

async function translateFaqArray(faqs) {
  if (!faqs || !faqs.length) return [];
  const out = [];
  for (const faq of faqs) {
    if (typeof faq === "object" && faq !== null && faq.question) {
      out.push({
        question: await translateText(faq.question),
        answer: faq.answer ? await translateText(faq.answer) : "",
      });
    } else {
      out.push(await translateText(faq));
    }
  }
  return out;
}

/** Translate scheme rows shown in lists (index, eligibility). */
async function translateSchemeListItems(schemes) {
  return Promise.all(
    schemes.map(async (scheme) => {
      const desc = scheme.short_description || scheme.description || "";
      const translatedDesc = desc ? await translateText(desc) : "";
      return {
        ...scheme,
        name: scheme.name ? await translateText(scheme.name) : "",
        short_description: translatedDesc,
        description: translatedDesc,
      };
    }),
  );
}
