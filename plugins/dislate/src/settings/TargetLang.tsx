import { getAssetIDByName } from "@vendetta/ui/assets"
import { React, ReactNative } from "@vendetta/metro/common"
import { Forms, Search } from "@vendetta/ui/components"
import { showToast } from "@vendetta/ui/toasts"
import { useProxy } from "@vendetta/storage"
import { settings } from ".."
import { DeepLLangs, GTranslateLangs } from "../lang"

const { FormRow } = Forms
const { ScrollView } = ReactNative

export default () => {
    useProxy(settings)
    const [query, setQuery] = React.useState("")

    // Pick language list based on active translator; no duplicate branches
    const langs = settings.translator === 0 ? DeepLLangs : GTranslateLangs
    const filtered = Object.entries(langs).filter(([key]) =>
        key.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <ScrollView style={{ flex: 1 }}>
            <Search
                style={{ padding: 15 }}
                placeholder="Search Language"
                onChangeText={(text: string) => setQuery(text)}
            />
            {filtered.map(([key, value]) => (
                <FormRow
                    key={value}
                    label={key}
                    trailing={settings.target_lang === value
                        ? () => <FormRow.Icon source={getAssetIDByName("check")} />
                        : () => <FormRow.Arrow />
                    }
                    onPress={() => {
                        if (settings.target_lang === value) return
                        settings.target_lang = value
                        showToast(`Saved ToLang to ${key}`, getAssetIDByName("check"))
                    }}
                />
            ))}
        </ScrollView>
    )
}
