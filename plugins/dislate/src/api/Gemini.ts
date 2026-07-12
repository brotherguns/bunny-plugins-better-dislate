import { settings } from ".."
import { TranslateResult } from "../type"

const translate = async (text: string, source_lang = "auto", target_lang: string, original = false): Promise<TranslateResult> => {
    try {
        if (original) return { source_lang, text }

        const apiKey = settings.gemini_api_key?.trim()
        if (!apiKey) throw new Error("No Gemini API key set. Add it in plugin settings.")

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

        const prompt = source_lang === "auto"
            ? `Translate the following text to ${target_lang}. Reply with only the translated text, no explanation.\n\n${text}`
            : `Translate the following text from ${source_lang} to ${target_lang}. Reply with only the translated text, no explanation.\n\n${text}`

        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
            })
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
        }

        const data = await res.json()
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (!translated) throw new Error("Empty response from Gemini")

        return { source_lang, text: translated }
    } catch (e) {
        throw new Error(`Failed to fetch from Gemini: ${e}`)
    }
}

export default { translate }
