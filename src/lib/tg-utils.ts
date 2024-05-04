import { Context } from 'telegraf'
import { FmtString } from 'telegraf/format'
import {
  Contact,
  Location,
  Message,
  MessageEntity,
} from 'telegraf/typings/core/types/typegram'

import * as compose from './compose'

export type ContentedMessage = Message.TextMessage | Message.CaptionableMessage
export type OptionalContentedMessage = ContentedMessage | null | undefined

export const NO_LINK_PREVIEW: Readonly<any> = Object.freeze({
  /* eslint-disable-next-line camelcase */
  disable_web_page_preview: true,
})

const COMMON_RESEND_EXTRA = {
  /* eslint-disable-next-line camelcase */
  protect_content: true,
  ...NO_LINK_PREVIEW,
}

export const isRepliedToBot = (ctx: any) => {
  const replyToMessage = ctx?.message?.reply_to_message
  const fromId = replyToMessage?.from?.id
  const botId = ctx?.botInfo?.id
  return !!botId && !!fromId && fromId === botId
}

export const shiftEntities = (entities: MessageEntity[], delta: number) => {
  if (delta < 0 || !Number.isSafeInteger(delta)) {
    throw new TypeError('Delta must be a non-negative safe integer')
  }

  return entities.map((e) => ({ ...e, offset: e.offset + delta }))
}

export const getMessageContent = (msg: OptionalContentedMessage) => {
  if (!msg) {
    return null
  }
  if ('text' in msg) {
    return msg.text || ''
  }
  if ('caption' in msg) {
    return msg.caption || ''
  }
  return null
}

export const getMessageEntities = (msg: OptionalContentedMessage) => {
  if (!msg) {
    return null
  }
  if ('entities' in msg) {
    return msg.entities
  }
  if ('caption_entities' in msg) {
    return msg.caption_entities
  }
  return null
}

export const parseDataUrl = (msg: OptionalContentedMessage) => {
  const entities = getMessageEntities(msg) || []
  const content = getMessageContent(msg)
  if (!content) {
    return null
  }

  type LinkOrUndefined = MessageEntity.TextLinkMessageEntity | undefined
  const linkEnt = <LinkOrUndefined>(
    entities.find((e) => e.type === 'text_link' && !e.offset && e.url)
  )

  return linkEnt?.url || null
}

export const toFmtString = (msg: OptionalContentedMessage) =>
  new FmtString(getMessageContent(msg) || '', getMessageEntities(msg) || [])

export const isTextMessage = (
  msg: Message.ServiceMessage,
): msg is Message.TextMessage => {
  return 'text' in msg && Boolean(msg.text)
}

export const isPhotoMessage = (
  msg: Message.ServiceMessage,
): msg is Message.PhotoMessage => {
  return 'photo' in msg && (msg.photo as unknown[]).length > 0
}

export const isAudioMessage = (
  msg: Message.ServiceMessage,
): msg is Message.AudioMessage => {
  return 'audio' in msg && Boolean(msg.audio)
}

export const isVideoMessage = (
  msg: Message.ServiceMessage,
): msg is Message.VideoMessage => {
  return 'video' in msg && Boolean(msg.video)
}

export const isAnimationMessage = (
  msg: Message.ServiceMessage,
): msg is Message.AnimationMessage => {
  return 'animation' in msg && Boolean(msg.animation)
}

export const isVoiceMessage = (
  msg: Message.ServiceMessage,
): msg is Message.VoiceMessage => {
  return 'voice' in msg && Boolean(msg.voice)
}

export const isDocumentMessage = (
  msg: Message.ServiceMessage,
): msg is Message.DocumentMessage => {
  return 'document' in msg && Boolean(msg.document)
}

export const isContactMessage = (
  msg: Message.ServiceMessage,
): msg is Message.ContactMessage => {
  return 'contact' in msg && Boolean(msg.contact)
}

export const isLocationMessage = (
  msg: Message.ServiceMessage,
): msg is Message.LocationMessage => {
  return 'location' in msg && Boolean(msg.location)
}

export const isStickerMessage = (
  msg: Message.ServiceMessage,
): msg is Message.StickerMessage => {
  return 'sticker' in msg && Boolean(msg.sticker)
}

export const isVideoNoteMessage = (
  msg: Message.ServiceMessage,
): msg is Message.VideoNoteMessage => {
  return 'video_note' in msg && Boolean(msg.video_note)
}

export const prepareResendCaptionExtra = (
  caption: string,
  captionEntities: MessageEntity[],
) => {
  return {
    ...COMMON_RESEND_EXTRA,
    caption,
    /* eslint-disable-next-line camelcase */
    caption_entities: captionEntities,
  }
}

export const prepareResendContactExtra = (contact: Contact) => {
  return {
    ...COMMON_RESEND_EXTRA,
    /* eslint-disable-next-line camelcase */
    ...(contact.first_name ? { last_name: contact.last_name } : {}),
    ...(contact.vcard ? { vcard: contact.vcard } : {}),
  }
}

export const prepareResendLocationExtra = (loc: Location) => {
  const ha = loc.horizontal_accuracy
  return {
    ...COMMON_RESEND_EXTRA,
    /* eslint-disable-next-line camelcase */
    ...(ha ? { horizontal_accuracy: ha } : {}),
  }
}

export const resendMessage = async ({
  ctx,
  recipientId,
  response,
  pointDown = `\n${compose.emoji.pointDown}`,
}: {
  ctx: Context
  recipientId: number
  response: FmtString
  pointDown?: string
}) => {
  const msg = ctx.message as Message.ServiceMessage
  const entities = response.entities || []
  const tg = ctx.telegram

  const sendText = (text: string) =>
    tg.sendMessage(recipientId, text, {
      ...COMMON_RESEND_EXTRA,
      entities,
    })

  if (isTextMessage(msg)) {
    await sendText(response.text)
    return true
  }

  const captionExtra = prepareResendCaptionExtra(response.text, entities)

  if (isPhotoMessage(msg)) {
    const photoId = msg.photo[0].file_id
    await tg.sendPhoto(recipientId, photoId, captionExtra)
    return true
  }

  if (isAudioMessage(msg)) {
    const audioId = msg.audio.file_id
    await tg.sendAudio(recipientId, audioId, captionExtra)
    return true
  }

  if (isVideoMessage(msg)) {
    const videoId = msg.video.file_id
    await tg.sendVideo(recipientId, videoId, captionExtra)
    return true
  }

  if (isAnimationMessage(msg)) {
    const animId = msg.animation.file_id
    await tg.sendAnimation(recipientId, animId, captionExtra)
    return true
  }

  if (isVoiceMessage(msg)) {
    const voiceId = msg.voice.file_id
    await tg.sendVoice(recipientId, voiceId, captionExtra)
    return true
  }

  if (isDocumentMessage(msg)) {
    const docId = msg.document.file_id
    await tg.sendDocument(recipientId, docId, captionExtra)
    return true
  }

  const sendHeader = () => sendText(response.text.trim() + pointDown)

  if (isContactMessage(msg)) {
    const con = msg.contact
    const extra = prepareResendContactExtra(con)
    await sendHeader()
    await tg.sendContact(recipientId, con.phone_number, con.first_name, extra)
    return true
  }

  if (isLocationMessage(msg)) {
    const loc = msg.location
    const extra = prepareResendLocationExtra(loc)
    await sendHeader()
    await tg.sendLocation(recipientId, loc.latitude, loc.longitude, extra)
    return true
  }

  if (isVideoNoteMessage(msg)) {
    const vnoteId = msg.video_note.file_id
    await sendHeader()
    await tg.sendVideoNote(recipientId, vnoteId, COMMON_RESEND_EXTRA)
    return true
  }

  if (isStickerMessage(msg)) {
    const stickerId = msg.sticker.file_id
    await sendHeader()
    await tg.sendSticker(recipientId, stickerId, COMMON_RESEND_EXTRA)
    return true
  }

  return false
}
