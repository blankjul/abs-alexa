'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { t, messages } = require('../lambda/lib/i18n');

const input = (locale) => ({ requestEnvelope: { request: { locale } } });

test('speaks German for de-DE and English for en-US', () => {
  assert.strictEqual(t(input('de-DE'), 'goodbye'), 'Bis bald!');
  assert.strictEqual(t(input('en-US'), 'goodbye'), 'Goodbye!');
});

test('falls back to English for an unknown locale or a missing request', () => {
  assert.strictEqual(t(input('fr-FR'), 'goodbye'), 'Goodbye!');
  assert.strictEqual(t({}, 'goodbye'), 'Goodbye!');
});

test('formats texts with arguments', () => {
  assert.strictEqual(t(input('de-DE'), 'goingToChapter', 3), 'Ich springe zu Kapitel 3.');
  assert.strictEqual(t(input('en-US'), 'playing', 'Book', 'Author'), 'Playing Book by Author');
  assert.strictEqual(t(input('en-US'), 'notFound', 'X', null), 'Could not find a playable book matching: X. Please try again.');
});

test('German has every key that English has', () => {
  assert.deepStrictEqual(Object.keys(messages.de).sort(), Object.keys(messages.en).sort());
});
