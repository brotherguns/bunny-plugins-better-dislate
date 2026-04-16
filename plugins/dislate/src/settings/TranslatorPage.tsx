import { React, ReactNative } from "@vendetta/metro/common"
import { findByProps } from "@vendetta/metro"
import { Forms } from "@vendetta/ui/components"
import { showToast } from "@vendetta/ui/toasts"
import { getAssetIDByName } from "@vendetta/ui/assets"
import { useProxy } from "@vendetta/storage"
import { settings } from ".."

const { ScrollView } = ReactNative
const { FormRow } = Forms
const TableRadioGroup = findByProps("TableRadioGroup")?.TableRadioGroup
const TableRadioRow = findByProps("TableRadioRow")?.TableRadioRow

const TRANSLATORS = [
    { label: "DeepL", value: "0" },
    { label: "Google Translate", value: "1" }
]

export default () => {
    useProxy(settings)

    if (TableRadioGroup && TableRadioRow) {
        return (
            <TableRadioGroup
                title="Translator"
                value={String(settings.translator ?? 1)}
                onChange={(v: string) => {
                    settings.translator = Number(v)
                    showToast(`Saved Translator to ${TRANSLATORS[Number(v)].label}`, getAssetIDByName("check"))
                }}
            >
                {TRANSLATORS.map(({ label, value }) => (
                    <TableRadioRow key={value} label={label} value={value} />
                ))}
            </TableRadioGroup>
        )
    }

    // Legacy fallback — show a checkmark on the active translator
    return (
        <ScrollView style={{ flex: 1 }}>
            {TRANSLATORS.map(({ label, value }) => (
                <FormRow
                    key={value}
                    label={label}
                    trailing={settings.translator === Number(value)
                        ? () => <FormRow.Icon source={getAssetIDByName("check")} />
                        : () => <FormRow.Arrow />
                    }
                    onPress={() => {
                        const n = Number(value)
                        if (settings.translator === n) return
                        settings.translator = n
                        showToast(`Saved Translator to ${label}`, getAssetIDByName("check"))
                    }}
                />
            ))}
        </ScrollView>
    )
}
