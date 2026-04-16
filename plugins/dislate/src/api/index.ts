import { settings } from ".."
import { TranslateResult } from "../type"
import DeepL from "./DeepL"
import GTranslate from "./GTranslate"

export { DeepL, GTranslate }

/** Unified translate helper — picks the active translator from settings automatically. */
export async function translate(text: string, target_lang: string, original = false): Promise<TranslateResult> {
    switch (settings.translator) {
        case 0:  return DeepL.translate(text, undefined, target_lang, original)
        case 1:
        default: return GTranslate.translate(text, undefined, target_lang, original)
    }
}
