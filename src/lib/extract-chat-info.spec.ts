import chai, { expect } from 'chai'
import sinon from 'sinon'
import Sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as chatInfoCrypto from '../crypto/chat-token'
import { extractChatInfo } from './extract-chat-info'
import * as links from './links'
import * as tgUtils from './tg-utils'

chai.use(sinonChai)

describe('lib/extract-chat-info', () => {
  let parseDataUrl: Sinon.SinonStub
  let parseChatToken: Sinon.SinonStub
  let decryptChatInfo: Sinon.SinonStub

  before(() => {
    parseDataUrl = sinon.stub(tgUtils, 'parseDataUrl')
    parseChatToken = sinon.stub(links, 'parseChatToken')
    decryptChatInfo = sinon.stub(chatInfoCrypto, 'decrypt')
  })

  afterEach(() => sinon.reset())
  after(() => sinon.restore())

  it("returns null if the message doesn't contain a data URL", () => {
    const message: any = { testMeta: 'fake message' }

    parseDataUrl.withArgs(message).returns(null)

    const chatInfo = extractChatInfo({ botname: 'botfather', message })

    expect(chatInfo).to.be.null
    expect(parseDataUrl).to.have.been.calledOnceWithExactly(message)
    expect(parseChatToken).to.not.have.been.called
    expect(decryptChatInfo).to.not.have.been.called
  })

  it("returns null if the data URL doesn't contain a chat token", () => {
    const message: any = { testMeta: 'fake message' }
    const dataUrl: any = { testMeta: 'fake data URL' }

    parseDataUrl.withArgs(message).returns(dataUrl)
    parseChatToken.withArgs('botfather', dataUrl).returns(null)

    const chatInfo = extractChatInfo({ botname: 'botfather', message })

    expect(chatInfo).to.be.null
    expect(parseDataUrl).to.have.been.calledOnceWithExactly(message)
    expect(parseChatToken).to.have.been.calledOnceWithExactly(
      'botfather',
      dataUrl,
    )
    expect(decryptChatInfo).to.not.have.been.called
  })

  it('returns if decryption of chat token has been failed', () => {
    const message: any = { testMeta: 'fake message' }
    const dataUrl: any = { testMeta: 'fake data URL' }
    const chatToken: any = { testMeta: 'fake chat token' }

    parseDataUrl.withArgs(message).returns(dataUrl)
    parseChatToken.withArgs('botfather', dataUrl).returns(chatToken)
    decryptChatInfo.withArgs(chatToken).returns(null)

    const chatInfo = extractChatInfo({ botname: 'botfather', message })

    expect(chatInfo).to.be.null
    expect(parseDataUrl).to.have.been.calledOnceWithExactly(message)
    expect(parseChatToken).to.have.been.calledOnceWithExactly(
      'botfather',
      dataUrl,
    )
    expect(decryptChatInfo).to.have.been.calledOnceWithExactly(chatToken)
  })

  it('returns the decrypted chat info', () => {
    const message: any = { testMeta: 'fake message' }
    const dataUrl: any = { testMeta: 'fake data URL' }
    const chatToken: any = { testMeta: 'fake chat token' }
    const chatInfo: any = { testMeta: 'fake chat info' }

    parseDataUrl.withArgs(message).returns(dataUrl)
    parseChatToken.withArgs('botfather', dataUrl).returns(chatToken)
    decryptChatInfo.withArgs(chatToken).returns(chatInfo)

    const result = extractChatInfo({ botname: 'botfather', message })

    expect(result).to.be.equal(chatInfo)
    expect(parseDataUrl).to.have.been.calledOnceWithExactly(message)
    expect(parseChatToken).to.have.been.calledOnceWithExactly(
      'botfather',
      dataUrl,
    )
    expect(decryptChatInfo).to.have.been.calledOnceWithExactly(chatToken)
  })
})
