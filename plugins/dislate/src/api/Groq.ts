import { settings } from ".."
import { TranslateResult } from "../type"

const translate = async (text: string, source_lang = "auto", target_lang: string, original = false): Promise<TranslateResult> => {
    try {
        if (original) return { source_lang, text }

        const apiKey = settings.groq_api_key?.trim()
        if (!apiKey) throw new Error("No Groq API key set. Add it in plugin settings.")

        const prompt = source_lang === "auto"
            ? `Translate the following text to ${target_lang}. Reply with only the translated text, no explanation.\n\n${text}`
            : `Translate the following text from ${source_lang} to ${target_lang}. Reply with only the translated text, no explanation.\n\n${text}`

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: settings.groq_model?.trim() || "quen/quen3.6-27b",
                temperature: 0.1,
                messages: [{ role: "user", content: prompt }]
            })
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
        }

        const data = await res.json()
        const translated = data?.choices?.[0]?.message?.content?.trim()
        if (!translated) throw new Error("Empty response from Groq")

        return { source_lang, text: translated }
    } catch (e) {
        throw new Error(`Failed to fetch from Groq: ${e}`)
    }
}

export default { translate }
