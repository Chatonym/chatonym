import once from 'lodash/once'
import { get as emo } from 'node-emoji'
import {
  bold,
  italic,
  join,
  link,
  pre,
  quote,
  underline,
} from 'telegraf/format'
import { TelegramEmoji } from 'telegraf/typings/core/types/typegram'

export const newline = '\n'

export const emoji = Object.freeze({
  skullAndCrossbones: emo('skull_and_crossbones')!,
  informationSource: emo('information_source')!,
  explodingHead: emo('exploding_head')!,
  speechBalloon: emo('speech_balloon')!,
  pageWithCurl: emo('page_with_curl')!,
  person: emo('bust_in_silhouette')!,
  floppyDisk: emo('floppy_disk')!,
  microscope: emo('microscope')!,
  massage: emo('massage_woman')!,
  shrug: emo('woman_shrugging')!,
  pointDown: emo('point_down')!,
  noGood: emo('no_good_woman')!,
  question: emo('question')!,
  noEntry: emo('no_entry')!,
  warning: emo('warning')!,
  shield: emo('shield')!,
  three: emo('three')!,
  link: emo('link')!,
  hash: emo('hash')!,
  bulb: emo('bulb')!,
  lock: emo('lock')!,
  cry: emo('cry')!,
  one: emo('one')!,
  two: emo('two')!,
  bug: emo('bug')!,
  saluting: '\uD83E\uDEE1',
  yoga: '\uD83E\uDDD8',
} as const)

export const react = Object.freeze({
  done: emoji.saluting as TelegramEmoji,
  failed: emoji.cry as TelegramEmoji,
  shrug: emoji.shrug as TelegramEmoji,
} as const)

export const replyHeader = ({
  replyLink,
  nickname,
}: {
  replyLink: string
  nickname: string
}) => {
  return quote(
    link(emoji.person, replyLink) as any,
    ' ',
    bold(italic(underline(nickname))),
  )
}

export const linkResponse = ({ startLink }: { startLink: string }) => {
  return join([
    emoji.pointDown,
    ' Here is your anonymous chat link:',
    newline,
    link('[Copy Me]', startLink),
  ])
}

export const helpResponse = () => {
  return join([
    'The most secure anonymous chat bot. ',
    bold('I never store any of your data!'),
    newline,
    newline,
    italic(emoji.link, ' Create your own /link and share it with others.'),
    newline,
    newline,
    italic(emoji.speechBalloon, " Want to use someone else's chat link? "),
    bold('Just click on it!'),
    newline,
    newline,
    emoji.informationSource,
    ' ',
    bold('Remember'),
    ", you need to reply to your recipient's nickname! Like this:",
    newline,
    replyHeader({
      replyLink: 'https://t.me',
      nickname: 'TheirNickname#ABC',
    }),
    newline,
    newline,
    emoji.pageWithCurl,
    ' ',
    bold('Dig deeper?'),
    newline,
    emoji.shield,
    ' /privacy',
    newline,
    emoji.saluting,
    ' /reactions',
    newline,
    emoji.noEntry,
    ' /terminate',
    newline,
    emoji.question,
    ' /faq',
    newline,
    emoji.warning,
    ' /disclaimer',
  ])
}

export const faqResponse = once(() => {
  const beginQuestion = bold(emoji.hash, ' ')

  return join([
    beginQuestion,
    bold(
      "How can I be sure you're ",
      underline('really'),
      ' not storing any of my data?',
    ),
    newline,
    "Checking out my code might help build some trust, but there's no 100% ",
    'sure way. How about running me on your own server?',
    newline,
    "If you've got ideas on how to further boost user trust, let me know. ",
    "I'm always open to suggestions.",
    newline,
    newline,
    beginQuestion,
    bold("Can I see the bot's source code?"),
    newline,
    'Sure thing! Check it out here.',
    newline,
    newline,
    beginQuestion,
    bold('How can I contribute?'),
    newline,
    'Find bugs, report them, help spread the word about me, ',
    "and if you've got the skills, send a PR.",
    newline,
    newline,
    beginQuestion,
    bold('Can I run this bot on my own server?'),
    newline,
    "Only if you swear you'll never store any user data. Deal?",
    newline,
    newline,
    beginQuestion,
    bold('Database leak nightmare?'),
    newline,
    "Don't sweat it! Worst case, hackers might grab your Telegram ID from ",
    "your link. But that's it. No clue who you chatted with or what chats ",
    "ended. Plus, they'd need your personal link, which is unlikely.",
    newline,
    newline,
    beginQuestion,
    bold("My question isn't here."),
    newline,
    'Click here.',
  ])
})

export const privacyResponse = once(() => {
  return join([
    emoji.massage,
    ' Relax, I got your privacy ',
    bold('covered!'),
    newline,
    newline,
    emoji.explodingHead,
    " I don't store any of your info – not your ",
    underline('messages'),
    ', nor ',
    underline('who'),
    ' you chat with.',
    newline,
    newline,
    emoji.link,
    ' Even when you create a link, ',
    underline('everything'),
    ' is stored in the link itself.',
    newline,
    "I don't keep ",
    bold('anything'),
    ' extra.',
    newline,
    newline,
    emoji.floppyDisk,
    ' The ',
    underline('only'),
    ' time I have to save something is when a chat gets ',
    underline('terminated.'),
    newline,
    'Then, I gotta store the ',
    underline('hashed'),
    ' user IDs of both parties in my database ',
    'to prevent the chat from resuming.',
    newline,
    newline,
    emoji.yoga,
    " But don't worry, even if someone gets access to my ",
    "database, they can't access your user ID.",
    newline,
    newline,
    emoji.warning,
    ' Here are three things you should do to keep your privacy ',
    'extra secure:',
    newline,
    newline,
    emoji.one,
    ' Create just ',
    bold('one'),
    'link and share it with others. Sharing multiple links ',
    "could pose a privacy risk, but don't stress too much about it.",
    newline,
    newline,
    emoji.two,
    " Be mindful of what info you share with the person you're ",
    'chatting with. ',
    bold('And never click on any links!'),
    newline,
    newline,
    emoji.three,
    " Don't freak out if two people have the same nickname. ",
    'As a result, never pay attention to the nickname of the person who ',
    'messaged you! ',
    bold('It might be a completely different person.'),
  ])
})

export const reactionsResponse = once(() => {
  return join([
    'I prefer using reactions to acknowledge your commands.',
    newline,
    "Here's what you can expect:",
    newline,
    newline,
    react.done,
    ' Your command has been successfully executed.',
    newline,
    newline,
    react.failed,
    ' An error has occurred. The source of the error could vary.',
    newline,
    newline,
    react.shrug,
    " I couldn't quite grasp your command and have disregarded it. ",
    'The most likely reason is that you forgot to reply to a message from the ',
    'person you want to chat with.',
  ])
})

export const terminateUsage = once(() => {
  return join([
    emoji.warning,
    ' Think ',
    bold('twice'),
    ' before terminating a chat. Once you do, ',
    bold("there's no going back!"),
    newline,
    newline,
    emoji.skullAndCrossbones,
    ' To terminate a chat permanently, reply to a ',
    'message from the person you want to block with the following command:',
    newline,
    newline,
    pre('message')('/terminate forever'),
    newline,
    newline,
    emoji.noGood,
    ' Once you do this, neither you nor the other person will ',
    'be able to message each other again.',
    newline,
    newline,
    emoji.bulb,
    ' Note that if you create a new link, everyone will be able to ',
    'message you again.',
  ])
})

export const disclaimerResponse = once(() => {
  return join([
    emoji.microscope,
    ' ',
    underline("I'm an experimental project."),
    newline,
    newline,
    emoji.lock,
    ' It seems like I should have very good security, but please ',
    'use me with more caution until I am tested a little more!',
    newline,
    newline,
    emoji.bug,
    ' Anyway, if your privacy is compromised because of using me, ',
    bold("it's your own responsibility!"),
  ])
})
