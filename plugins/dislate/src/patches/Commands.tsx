import { logger } from "@vendetta"
import { registerCommand } from "@vendetta/commands"
import { showConfirmationAlert } from "@vendetta/ui/alerts"
import { Codeblock } from "@vendetta/ui/components"
import { findByProps, findByStoreName } from "@vendetta/metro"
import { FluxDispatcher } from "@vendetta/metro/common"
import { settings } from ".."
import { DeepLLangs, GTranslateLangs } from "../lang"
import { translate } from "../api"

// Enum values matching Kettu's ApplicationCommandTypes (no external path needed)
const ApplicationCommandType        = { CHAT: 1 }          as const
const ApplicationCommandInputType   = { BUILT_IN_TEXT: 1 } as const
const ApplicationCommandOptionType  = { STRING: 3 }        as const

const ClydeUtils = findByProps("sendBotMessage")
const MessageActions = findByProps("sendMessage", "editMessage")
const PendingReplyStore = findByStoreName("PendingReplyStore")

export default () => {
    // Vary language choices based on the active translator at load time
    const langOptions = settings.translator === 0
        ? Object.entries(DeepLLangs).map(([k, v]) => ({ name: k, displayName: k, value: v }))
        : Object.entries(GTranslateLangs).map(([k, v]) => ({ name: k, displayName: k, value: v }))

    return registerCommand({
        name: "translate",
        displayName: "translate",
        description: "Send a message using Dislate in any language chosen.",
        displayDescription: "Send a message using Dislate in any language chosen.",
        applicationId: "-1",
        type: ApplicationCommandType.CHAT as number,
        inputType: ApplicationCommandInputType.BUILT_IN_TEXT as number,
        options: [
            {
                name: "text",
                displayName: "text",
                description: "The text/message for Dislate to translate. Note: mention/emoji formatting may break.",
                displayDescription: "The text/message for Dislate to translate. Note: mention/emoji formatting may break.",
                type: ApplicationCommandOptionType.STRING as number,
                required: true
            },
            {
                name: "language",
                displayName: "language",
                description: "The language to translate into.",
                displayDescription: "The language to translate into.",
                type: ApplicationCommandOptionType.STRING as number,
                // @ts-ignore
                choices: langOptions,
                required: true
            }
        ],
        async execute(args, ctx) {
            const [text, lang] = args
            try {
                let content = await translate(text.value, lang.value)

                return await new Promise((resolve): void => showConfirmationAlert({
                    title: "Are you sure you want to send it?",
                    content: <Codeblock>{content.text}</Codeblock>,
                    confirmText: "Yep, send it!",
                    onConfirm: () => {
                        const channelId = ctx.channel.id
                        const pendingReply = PendingReplyStore?.getPendingReply?.(channelId)

                        if (pendingReply) {
                            // Send manually so we can attach the reply reference
                            MessageActions.sendMessage(
                                channelId,
                                { content: content.text },
                                {
                                    messageReference: {
                                        guild_id: pendingReply.message?.guild_id,
                                        channel_id: channelId,
                                        message_id: pendingReply.message?.id,
                                    },
                                    shouldMention: pendingReply.shouldMention ?? true,
                                }
                            )
                            // Clear the pending reply indicator from the UI
                            FluxDispatcher.dispatch({
                                type: "DELETE_PENDING_REPLY",
                                channelId,
                            })
                            // Return undefined so Kettu's wrapper doesn't double-send
                            resolve(undefined)
                        } else {
                            // No reply active — let Kettu's wrapper handle the send normally
                            resolve({ content: content.text })
                        }
                    },
                    cancelText: "Nope, don't send it"
                }))
            } catch (e) {
                logger.error(e)
                return ClydeUtils.sendBotMessage(ctx.channel.id, "Failed to translate message. Please check Debug Logs for more info.")
            }
        }
    })
}
