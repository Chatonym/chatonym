import { expect } from 'chai'

import * as tgUtils from './tg-utils'

/* eslint-disable camelcase */

describe('lib/tg-utils', () => {
  describe('.isRepliedToBot()', () => {
    it('returns true if the message is a reply to the bot', () => {
      const res = tgUtils.isRepliedToBot({
        message: {
          reply_to_message: {
            from: { id: 123 },
          },
        },
        botInfo: { id: 123 },
      })
      expect(res).to.be.true
    })

    context('returns false if...', () => {
      it('the context is undefined', () => {
        const res = tgUtils.isRepliedToBot(undefined)
        expect(res).to.be.false
      })

      it('the bot info is missing', () => {
        const res = tgUtils.isRepliedToBot({
          message: {
            reply_to_message: {
              from: { id: 123 },
            },
          },
        })
        expect(res).to.be.false
      })

      it('bot ID is null', () => {
        const res = tgUtils.isRepliedToBot({
          message: {
            reply_to_message: {
              from: { id: 123 },
            },
          },
          botInfo: { id: null },
        })
        expect(res).to.be.false
      })

      it('the message is not a reply', () => {
        const res = tgUtils.isRepliedToBot({
          message: {},
          botInfo: { id: 123 },
        })
        expect(res).to.be.false
      })

      it("the replied message doesn't have the sender ID", () => {
        const res = tgUtils.isRepliedToBot({
          message: {
            reply_to_message: {},
          },
          botInfo: { id: 123 },
        })
        expect(res).to.be.false
      })

      it('the sender ID is not the same as bot ID', () => {
        const res = tgUtils.isRepliedToBot({
          message: {
            reply_to_message: {
              from: { id: 123 },
            },
          },
          botInfo: { id: 456 },
        })
        expect(res).to.be.false
      })
    })
  })

  describe('.shiftEntities()', () => {
    it('shifts the offset of each entity by the delta', () => {
      const entities: any[] = [{ offset: 1 }, { offset: 2 }, { offset: 3 }]
      const res = tgUtils.shiftEntities(entities, 5)
      expect(res).to.deep.equal([{ offset: 6 }, { offset: 7 }, { offset: 8 }])
    })

    it('throws if delta is not a non-negative int', () => {
      expect(() => tgUtils.shiftEntities([], -1)).to.throw(TypeError)
      expect(() => tgUtils.shiftEntities([], 1.5)).to.throw(TypeError)
      expect(() => tgUtils.shiftEntities([], NaN)).to.throw(TypeError)
    })
  })

  describe('.getMessageContent()', () => {
    it('returns null the message is undefined', () => {
      const res = tgUtils.getMessageContent(undefined)
      expect(res).to.be.null
    })

    it('returns the text if the message has it', () => {
      const msg: any = { text: 'hello' }
      const res = tgUtils.getMessageContent(msg)
      expect(res).to.equal(msg.text)
    })

    it('returns the caption if the message has it', () => {
      const msg: any = { caption: 'world' }
      const res = tgUtils.getMessageContent(msg)
      expect(res).to.equal(msg.caption)
    })

    it('prefers text over caption', () => {
      const msg: any = { text: 'hello', caption: 'world' }
      const res = tgUtils.getMessageContent(msg)
      expect(res).to.equal(msg.text)
    })

    it('returns null if no content is found', () => {
      const msg: any = {}
      const res = tgUtils.getMessageContent(msg)
      expect(res).to.be.null
    })
  })

  describe('.getMessageEntities()', () => {
    it('returns null the message is undefined', () => {
      const res = tgUtils.getMessageEntities(undefined)
      expect(res).to.be.null
    })

    it('returns the entities if the message has them', () => {
      const entities = [{ type: 'bold' }]
      const msg: any = { entities }
      const res = tgUtils.getMessageEntities(msg)
      expect(res).to.equal(entities)
    })

    it('returns the caption entities if the message has them', () => {
      const caption_entities = [{ type: 'bold' }]
      const msg: any = { caption_entities }
      const res = tgUtils.getMessageEntities(msg)
      expect(res).to.equal(caption_entities)
    })

    it('returns null if no entities are found', () => {
      const msg: any = {}
      const res = tgUtils.getMessageEntities(msg)
      expect(res).to.be.null
    })
  })

  describe('.parseDataUrl()', () => {
    it('returns null if no content is found', () => {
      const msg: any = {}
      const res = tgUtils.parseDataUrl(msg)
      expect(res).to.be.null
    })

    it('returns the first link with zero offset', () => {
      const entities = [
        { type: 'text_link', offset: 0, url: 'https://first.tld' },
        { type: 'text_link', offset: 1, url: 'https://second.tld' },
      ]
      const msg: any = { entities, text: 'hello' }
      const res = tgUtils.parseDataUrl(msg)
      expect(res).to.equal(entities[0].url)
    })

    it('returns null if there is no link entity', () => {
      const captionEntities = [
        { type: 'bold' },
        {},
        { type: 'italic' },
        { type: 'code' },
      ]
      const msg: any = { caption_entities: captionEntities, caption: 'hello' }
      const res = tgUtils.parseDataUrl(msg)
      expect(res).to.be.null
    })

    it('returns null if there is no entity with zero offset', () => {
      const entities = [
        { type: 'text_link', offset: 1, url: 'https://first.tld' },
        { type: 'text_link', offset: 2, url: 'https://second.tld' },
      ]
      const msg: any = { entities, text: 'hello' }
      const res = tgUtils.parseDataUrl(msg)
      expect(res).to.be.null
    })

    it("returns null if link's URL is empty", () => {
      const captionEntities = [{ type: 'text_link', offset: 0, url: '' }]
      const msg: any = { caption_entities: captionEntities, caption: 'hello' }
      const res = tgUtils.parseDataUrl(msg)
      expect(res).to.be.null
    })
  })

  describe('.toFmtString()', () => {
    it('returns a FmtString object with the message text and entities', () => {
      const msg: any = { text: 'hello', entities: [{ type: 'bold' }] }
      const res = tgUtils.toFmtString(msg)
      expect(res.text).to.equal(msg.text)
      expect(res.entities).to.equal(msg.entities)
    })

    it('returns an empty FmtString if no content is found', () => {
      const msg: any = {}
      const res = tgUtils.toFmtString(msg)
      expect(res.text).to.equal('')
      expect(res.entities).to.be.empty
    })
  })

  describe('.isTextMessage()', () => {
    it('returns true if the message is a text message', () => {
      const msg: any = { text: 'hello' }
      const res = tgUtils.isTextMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isPhotoMessage()', () => {
    it('returns true if the message is a photo message', () => {
      const msg: any = { photo: [{}] }
      const res = tgUtils.isPhotoMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isAudioMessage()', () => {
    it('returns true if the message is an audio message', () => {
      const msg: any = { audio: {} }
      const res = tgUtils.isAudioMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isVoiceMessage()', () => {
    it('returns true if the message is a voice message', () => {
      const msg: any = { voice: {} }
      const res = tgUtils.isVoiceMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isVideoMessage()', () => {
    it('returns true if the message is a video message', () => {
      const msg: any = { video: {} }
      const res = tgUtils.isVideoMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isAnimationMessage()', () => {
    it('returns true if the message is an animation message', () => {
      const msg: any = { animation: {} }
      const res = tgUtils.isAnimationMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isStickerMessage()', () => {
    it('returns true if the message is a sticker message', () => {
      const msg: any = { sticker: {} }
      const res = tgUtils.isStickerMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isDocumentMessage()', () => {
    it('returns true if the message is a document message', () => {
      const msg: any = { document: {} }
      const res = tgUtils.isDocumentMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isContactMessage()', () => {
    it('returns true if the message is a contact message', () => {
      const msg: any = { contact: {} }
      const res = tgUtils.isContactMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isLocationMessage()', () => {
    it('returns true if the message is a location message', () => {
      const msg: any = { location: {} }
      const res = tgUtils.isLocationMessage(msg)
      expect(res).to.be.true
    })
  })

  describe('.isVideoNoteMessage()', () => {
    it('returns true if the message is a video note message', () => {
      const msg: any = { video_note: {} }
      const res = tgUtils.isVideoNoteMessage(msg)
      expect(res).to.be.true
    })
  })
})
