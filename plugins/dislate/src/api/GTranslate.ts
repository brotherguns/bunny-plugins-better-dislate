// "inspired" by https://github.com/Vendicated/Vencord/blob/main/src/plugins/translate/utils.ts
import { GTranslateResponse, TranslateResult } from "../type"

const translate = async (text: string, source_lang = "auto", target_lang: string, original = false): Promise<TranslateResult> => {
    try {
        if (original) return { source_lang, text }

        const API_URL = "https://translate.googleapis.com/translate_a/single?" + new URLSearchParams({
            client: "gtx", sl: source_lang, tl: target_lang,
            dt: "t", dj: "1", source: "input", q: text
        })

        const data: GTranslateResponse = await (await fetch(API_URL)).json()
        if (!data.sentences?.length) throw new Error("Empty response from Google Translate")

        return {
            source_lang: data.src ?? source_lang,
            text: data.sentences.map(s => s.trans ?? "").join("")
        }
    } catch (e) {
        throw Error(`Failed to fetch from Google Translate: ${e}`)
    }
}

export default { translate }
