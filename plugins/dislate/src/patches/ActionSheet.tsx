import { findByProps, findByStoreName } from "@vendetta/metro"
import { FluxDispatcher, React, ReactNative, i18n, stylesheet } from "@vendetta/metro/common"
import { before, after } from "@vendetta/patcher"
import { semanticColors } from "@vendetta/ui"
import { getAssetIDByName } from "@vendetta/ui/assets"
import { Forms } from "@vendetta/ui/components"
import { showToast } from "@vendetta/ui/toasts"
import { logger } from "@vendetta"
import { findInReactTree } from "@vendetta/utils"
import { settings } from ".."
import { translate } from "../api"

const LazyActionSheet = findByProps("openLazy", "hideActionSheet")
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? Forms.FormRow
const MessageStore = findByStoreName("MessageStore")
const ChannelStore = findByStoreName("ChannelStore")
const separator = "\n"
const MAX_CACHE = 50

const styles = stylesheet.createThemedStyleSheet({
    iconComponent: {
        width: 24,
        height: 24,
        tintColor: semanticColors.INTERACTIVE_NORMAL
    }
})

let cachedData: object[] = []

export default () => before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message
    if (key !== "MessageLongPressActionSheet" || !message) return
    component.then(instance => {
        const unpatch = after("default", instance, (_, component) => {
            React.useEffect(() => () => { unpatch() }, [])

            const buttons = findInReactTree(component, x => x?.[0]?.type?.name === "ActionSheetRow")
            if (!buttons) return
            const position = Math.max(buttons.findIndex((x: any) => x.props.message === i18n.Messages.MARK_UNREAD), 0)

            const originalMessage = MessageStore.getMessage(message.channel_id, message.id)
            if (!originalMessage?.content && !message.content) return

            const messageId = originalMessage?.id ?? message.id
            const messageContent = originalMessage?.content ?? message.content
            const existingCachedObject = cachedData.find((o: any) => Object.keys(o)[0] === messageId)

            const translateType = existingCachedObject ? "Revert" : "Translate"
            const icon = translateType === "Translate"
                ? getAssetIDByName("LanguageIcon")
                : getAssetIDByName("ic_highlight")

            const onPress = async () => {
                LazyActionSheet.hideActionSheet()
                try {
                    const target_lang = settings.target_lang
                    const isTranslated = translateType === "Translate"
                    const isImmersive = settings.immersive_enabled

                    if (!originalMessage) return

                    const emojiRegex = /<(a?):\w+:\d+>|<@!?\d+>|<#\d+>/g
                    const placeholders: string[] = []
                    const textToTranslate = messageContent.replace(emojiRegex, (match) => {
                        placeholders.push(match)
                        return ` [[${placeholders.length - 1}]] `
                    })

                    logger.log(`[Dislate] translator=${settings.translator} target=${target_lang} text=${textToTranslate}`)
                    const result = await translate(textToTranslate, target_lang, !isTranslated)

                    let translatedText = result.text
                    placeholders.forEach((original, index) => {
                        translatedText = translatedText.replace(
                            new RegExp(`\\[\\[\\s*${index}\\s*\\]\\]`, "g"),
                            original
                        )
                    })

                    const finalContent = isTranslated
                        ? (isImmersive
                            ? `${messageContent}${separator}${translatedText.trim()} \`[${target_lang?.toLowerCase()}]\``
                            : `${translatedText.trim()} \`[${target_lang?.toLowerCase()}]\``)
                        : (existingCachedObject as any)[messageId]

                    FluxDispatcher.dispatch({
                        type: "MESSAGE_UPDATE",
                        message: {
                            id: messageId,
                            channel_id: originalMessage.channel_id,
                            guild_id: ChannelStore.getChannel(originalMessage.channel_id)?.guild_id,
                            content: finalContent,
                        },
                        log_edit: false,
                        otherPluginBypass: true
                    })

                    if (isTranslated) {
                        cachedData.unshift({ [messageId]: messageContent })
                        if (cachedData.length > MAX_CACHE) cachedData.length = MAX_CACHE
                    } else {
                        cachedData = cachedData.filter(e => e !== existingCachedObject)
                    }
                } catch (e) {
                    showToast("Failed to translate message. Please check Debug Logs for more info.", getAssetIDByName("Small"))
                    logger.error(e)
                }
            }

            buttons.splice(position, 0, (
                <ActionSheetRow
                    label={`${translateType} Message`}
                    icon={
                        <ActionSheetRow.Icon
                            source={icon}
                            IconComponent={() => (
                                <ReactNative.Image
                                    resizeMode="cover"
                                    style={styles.iconComponent}
                                    source={icon}
                                />
                            )}
                        />
                    }
                    onPress={onPress}
                />
            ))
        })
    })
})
