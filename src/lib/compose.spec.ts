import { expect } from 'chai'
import { FmtString } from 'telegraf/format'

import {
  disclaimerResponse,
  faqResponse,
  helpResponse,
  linkResponse,
  privacyResponse,
  reactionsResponse,
  replyHeader,
  terminateUsage,
} from './compose'

describe('lib/compose', () => {
  describe('.replyHeader()', () => {
    context('returns a FmtString which...', () => {
      it('includes the nickname', () => {
        const header = replyHeader({
          chatLink: 'https://example.com',
          nickname: 'alice',
        })
        expect(header.text).to.include('alice')
      })

      it('starts with the chat link', () => {
        const header = replyHeader({
          chatLink: 'https://example.com',
          nickname: 'alice',
        })
        const ent = header.entities?.find?.((e) => e.type === 'text_link')
        expect(ent).to.exist
        expect(ent!).to.have.property('offset', 0)
        expect(ent!).to.have.property('url', 'https://example.com')
      })
    })
  })

  describe('.linkResponse()', () => {
    it('returns a FmtString which includes the start link', () => {
      const resp = linkResponse({ startLink: 'https://example.com' })

      const ent = resp.entities?.find?.((e) => e.type === 'text_link')
      expect(ent).to.exist
      expect(ent!).to.have.property('url', 'https://example.com')
    })
  })

  describe('.helpResponse()', () => {
    it('returns a FmtString', () => {
      const resp = helpResponse()
      expect(resp).to.be.instanceOf(FmtString)
    })
  })

  describe('.faqResponse()', () => {
    it('returns a FmtString', () => {
      const resp = faqResponse()
      expect(resp).to.be.instanceOf(FmtString)
    })
  })

  describe('.privacyResponse()', () => {
    it('returns a FmtString', () => {
      const resp = privacyResponse()
      expect(resp).to.be.instanceOf(FmtString)
    })
  })

  describe('.reactionsResponse()', () => {
    it('returns a FmtString', () => {
      const resp = reactionsResponse()
      expect(resp).to.be.instanceOf(FmtString)
    })
  })

  describe('.terminateUsage()', () => {
    it('returns a FmtString', () => {
      const resp = terminateUsage()
      expect(resp).to.be.instanceOf(FmtString)
    })
  })

  describe('.disclaimerResponse()', () => {
    it('returns a FmtString', () => {
      const resp = disclaimerResponse()
      expect(resp).to.be.instanceOf(FmtString)
    })
  })
})
