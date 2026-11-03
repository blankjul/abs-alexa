'use strict';
// Spoken texts per locale. English is the fallback for every locale and key.

const messages = {
  en: {
    askPlayFirst: 'Please ask me to play an audiobook first.',
    welcome: 'Welcome to Audiobookshelf, you can say "play audiobook" to start listening.',
    noRecent: "You haven't listened to any audiobooks recently.",
    recentList: (list) => `You've most recently listened to: ${list}.`,
    playing: (title, author) => 'Playing ' + title + ' by ' + author,
    playingNoAuthor: (title) => 'Playing ' + title,
    notUnderstood: 'I did not understand the request. For example, try saying "Play audiobook title by author".',
    notFound: (title, author) => 'Could not find a playable book matching: ' + title + (author ? ' by ' + author : '') + '. Please try again.',
    lastChapter: (title) => 'This is the last chapter of ' + title + '.',
    noChapters: 'This audiobook does not include chapter information.',
    chapterRange: (n) => `Please choose a chapter between 1 and ${n}.`,
    goingToChapter: (n) => `Going to chapter ${n}.`,
    notSupported: "Sorry, I can't support that yet.",
    help: 'You can say "play audio" to start playing your book! How can I help?',
    goodbye: 'Goodbye!',
    unknown: "Sorry, I don't know about that. Please try again.",
    notYet: "Sorry, I can't do that yet.",
    trouble: 'Sorry, I had trouble doing what you asked. Please try again.',
  },
  de: {
    askPlayFirst: 'Bitte sag mir zuerst, welches Hörbuch ich abspielen soll.',
    welcome: 'Willkommen im Hörbuchregal. Sag zum Beispiel "spiele Ninjago", um zu starten.',
    noRecent: 'Du hast in letzter Zeit noch kein Hörbuch gehört.',
    recentList: (list) => `Zuletzt hast du gehört: ${list}.`,
    playing: (title, author) => 'Ich spiele ' + title + ' von ' + author,
    playingNoAuthor: (title) => 'Ich spiele ' + title,
    notUnderstood: 'Das habe ich nicht verstanden. Sag zum Beispiel "spiele Ninjago".',
    notFound: (title) => 'Ich habe kein Hörbuch zu ' + title + ' gefunden. Bitte versuche es noch einmal.',
    lastChapter: (title) => 'Das ist das letzte Kapitel von ' + title + '.',
    noChapters: 'Dieses Hörbuch hat keine Kapitel.',
    chapterRange: (n) => `Bitte wähle ein Kapitel zwischen 1 und ${n}.`,
    goingToChapter: (n) => `Ich springe zu Kapitel ${n}.`,
    notSupported: 'Das kann ich leider noch nicht.',
    help: 'Du kannst zum Beispiel sagen "spiele Ninjago" oder "spiele das letzte Hörbuch". Was möchtest du hören?',
    goodbye: 'Bis bald!',
    unknown: 'Das kenne ich leider nicht. Bitte versuche es noch einmal.',
    notYet: 'Das kann ich leider noch nicht.',
    trouble: 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.',
  },
};

function t(handlerInput, key, ...args) {
  const locale = handlerInput?.requestEnvelope?.request?.locale || 'en-US';
  const table = messages[locale.split('-')[0]] || messages.en;
  const entry = table[key] !== undefined ? table[key] : messages.en[key];
  return typeof entry === 'function' ? entry(...args) : entry;
}

module.exports = { t, messages };
