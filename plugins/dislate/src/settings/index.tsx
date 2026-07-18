import { getAssetIDByName } from "@vendetta/ui/assets"
import { React, ReactNative, stylesheet, constants, NavigationNative, url } from "@vendetta/metro/common"
import { findByProps } from "@vendetta/metro"
import { semanticColors } from "@vendetta/ui"
import { Forms } from "@vendetta/ui/components"
import { manifest } from "@vendetta/plugin"
import { useProxy } from "@vendetta/storage"
import { settings } from ".."
import TargetLang from "./TargetLang"
import TranslatorPage from "./TranslatorPage"

const { ScrollView, Text, TextInput, View } = ReactNative
const { FormRow, FormSwitchRow } = Forms

// Modern Discord Table components — fall back to legacy Forms if unavailable
const TableSwitchRow = findByProps("TableSwitchRow")?.TableSwitchRow
const _TableRow = findByProps("TableRow")?.TableRow as any
const TableRow: typeof _TableRow & { Icon?: any } = _TableRow

const TRANSLATOR_NAMES = ["DeepL", "Google Translate", "Gemini", "Groq"]

const styles = stylesheet.createThemedStyleSheet({
    subheaderText: {
        color: semanticColors.HEADER_SECONDARY,
        textAlign: "center",
        margin: 10,
        marginBottom: 50,
        letterSpacing: 0.25,
        fontFamily: constants.Fonts.PRIMARY_BOLD,
        fontSize: 14
    }
})

export default () => {
    const navigation = NavigationNative.useNavigation()
    useProxy(settings)

    const SwitchComp = TableSwitchRow ?? FormSwitchRow
    const RowComp = TableRow ?? FormRow
    const RowIcon = TableRow?.Icon ?? FormRow.Icon

    // Prop shape differs between modern/legacy components
    const iconProp = (name: string) => TableRow
        ? { icon: <RowIcon source={getAssetIDByName(name)} /> }
        : { leading: <RowIcon source={getAssetIDByName(name)} /> }

    const navTrailing = TableRow
        ? { arrow: true }
        : { trailing: () => <FormRow.Arrow /> }

    const switchIconProp = TableSwitchRow
        ? { icon: <RowIcon source={getAssetIDByName("ic_chat_bubble_filled_24px")} /> }
        : { leading: <RowIcon source={getAssetIDByName("ic_chat_bubble_filled_24px")} /> }

    return (
        <ScrollView>
            <SwitchComp
                label="Immersive Translation"
                subLabel="Display both original and translation"
                {...switchIconProp}
                value={settings.immersive_enabled ?? true}
                onValueChange={(v: boolean) => { settings.immersive_enabled = v }}
            />
            <RowComp
                label="Translate to"
                subLabel={settings.target_lang?.toLowerCase()}
                {...iconProp("ic_activity_24px")}
                {...navTrailing}
                onPress={() => navigation.push("VendettaCustomPage", { title: "Translate to", render: TargetLang })}
            />
            <RowComp
                label="Translator"
                subLabel={TRANSLATOR_NAMES[settings.translator ?? 1]}
                {...iconProp("ic_locale_24px")}
                {...navTrailing}
                onPress={() => navigation.push("VendettaCustomPage", { title: "Translator", render: TranslatorPage })}
            />
            {(settings.translator ?? 1) === 2 && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={[styles.subheaderText, { textAlign: "left", marginBottom: 6, marginTop: 0, fontSize: 12 }]}>
                        Gemini API Key
                    </Text>
                    <TextInput
                        value={settings.gemini_api_key ?? ""}
                        onChangeText={(v: string) => { settings.gemini_api_key = v }}
                        placeholder="AIza..."
                        placeholderTextColor="#888"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{
                            color: "#fff",
                            backgroundColor: "#1e1f22",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 14,
                            fontFamily: constants.Fonts.PRIMARY_SEMIBOLD
                        }}
                    />
                </View>
            )}
            {(settings.translator ?? 1) === 3 && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={[styles.subheaderText, { textAlign: "left", marginBottom: 6, marginTop: 0, fontSize: 12 }]}>
                        Groq API Key
                    </Text>
                    <TextInput
                        value={settings.groq_api_key ?? ""}
                        onChangeText={(v: string) => { settings.groq_api_key = v }}
                        placeholder="gsk_..."
                        placeholderTextColor="#888"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{
                            color: "#fff",
                            backgroundColor: "#1e1f22",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 14,
                            fontFamily: constants.Fonts.PRIMARY_SEMIBOLD
                        }}
                    />
                </View>
            )}
            <Text style={styles.subheaderText} onPress={() => url.openURL("https://github.com/Rico040/bunny-plugins")}>
                {`Build: (${manifest.hash.substring(0, 7)})`}
            </Text>
        </ScrollView>
    )
}
