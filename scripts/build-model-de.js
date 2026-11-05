'use strict';
// Builds skill-package/interactionModels/custom/de-DE.json from en-US.json plus the titles, series
// and authors of the Audiobookshelf library, so Alexa recognises the real names of the books.
// Usage: SERVER_URL=https://... ABS_API_KEY=... node scripts/build-model-de.js
// Re-run and import the model again whenever books are added.

const fs = require('fs');
const path = require('path');

const { SERVER_URL, ABS_API_KEY } = process.env;
if (!SERVER_URL || !ABS_API_KEY) throw new Error('Set SERVER_URL and ABS_API_KEY');
const dir = path.join(__dirname, '..', 'skill-package', 'interactionModels', 'custom');
const INVOCATION = process.env.INVOCATION_NAME || 'geschichten kiste';

async function get(p) {
  const res = await fetch(SERVER_URL.replace(/\/$/, '') + p, { headers: { Authorization: 'Bearer ' + ABS_API_KEY } });
  if (!res.ok) throw new Error(`${p}: HTTP ${res.status}`);
  return res.json();
}

// Alexa slot values: no digits-only noise, no characters that break the model.
const clean = (s) => s.replace(/[?!:()[\]{}"“”|\\/<>#*_]/g, ' ').replace(/\s+/g, ' ').trim();

function addValue(map, name, synonyms) {
  const key = clean(name);
  if (!key) return;
  const entry = map.get(key.toLowerCase()) || { name: key, synonyms: new Set() };
  for (const s of synonyms) {
    const c = clean(s);
    if (c && c.toLowerCase() !== key.toLowerCase()) entry.synonyms.add(c);
    // Alexa turns spoken numbers into digits ("drei" -> "3"), so the digit form must match as well.
    const digits = c.replace(/\bdrei\b/gi, '3');
    if (digits !== c && digits.toLowerCase() !== key.toLowerCase()) entry.synonyms.add(digits);
  }
  map.set(key.toLowerCase(), entry);
}

async function main() {
  const libs = (await get('/api/libraries')).libraries.filter((l) => l.mediaType === 'book');
  const titles = new Map();
  const authors = new Map();
  const seriesSeen = new Map();
  for (const lib of libs) {
    const items = (await get(`/api/libraries/${lib.id}/items?limit=0`)).results;
    for (const it of items) {
      const m = it.media.metadata;
      const series = m.seriesName ? m.seriesName.replace(/\s+#[\d.]+$/, '') : null;
      const seq = m.seriesName && /#([\d.]+)$/.exec(m.seriesName)?.[1];
      const syn = [];
      if (series && seq) {
        const short = series.replace(/^(lego|die|der|das)\s+/i, '');
        for (const s of new Set([series, short])) syn.push(`${s} Folge ${seq}`, `${s} ${seq}`, `Folge ${seq} ${s}`);
      }
      addValue(titles, m.title, syn);
      if (series && !seriesSeen.has(series)) {
        seriesSeen.set(series, true);
        addValue(titles, series, [series.replace(/^(lego|die|der|das)\s+/i, '')]);
      }
      for (const a of (m.authorName || '').split(/,\s*/)) if (a) addValue(authors, a, []);
    }
  }
  const toType = (name, map) => ({
    name,
    values: [...map.values()].map((e) => ({ name: { value: e.name, synonyms: [...e.synonyms] } })),
  });

  const model = JSON.parse(fs.readFileSync(path.join(dir, 'en-US.json'), 'utf8'));
  const lm = model.interactionModel.languageModel;
  lm.invocationName = INVOCATION;
  lm.types = [toType('LIBRARY_TITLE', titles), toType('LIBRARY_AUTHOR', authors)];

  const samples = {
    'AMAZON.CancelIntent': ['beenden', 'abbrechen', 'schluss'],
    PlayLastIntent: ['spiele das letzte Hörbuch', 'weiter hören', 'spiele weiter', 'mach da weiter wo ich aufgehört habe'],
    RecentBooksIntent: ['was habe ich zuletzt gehört', 'was höre ich gerade', 'welche Hörbücher habe ich zuletzt gehört', 'meine letzten Hörbücher'],
    GoBackXTimeIntent: ['spule {time} zurück', 'gehe {time} zurück', 'zurück {time}', 'springe {time} zurück'],
    GoForwardXTimeIntent: ['spule {time} vor', 'gehe {time} vor', 'vor {time}', 'springe {time} vor', 'überspringe {time}'],
    PlayBookIntent: ['spiele {title}', 'spiel {title}', 'starte {title}', 'ich möchte {title} hören', 'spiele {title} von {author}', 'spiele {title} vom Autor {author}'],
    GoToChapterX: ['gehe zu Kapitel {chapterNumber}', 'springe zu Kapitel {chapterNumber}', 'Kapitel {chapterNumber}'],
  };
  const slotSamples = {
    GoBackXTimeIntent: { time: ['{time} zurück', 'zurück {time}'] },
    GoForwardXTimeIntent: { time: ['{time} vor', 'vor {time}'] },
  };
  for (const intent of lm.intents) {
    if (samples[intent.name]) intent.samples = samples[intent.name];
    for (const slot of intent.slots || []) {
      if (intent.name === 'PlayBookIntent') slot.type = slot.name === 'title' ? 'LIBRARY_TITLE' : 'LIBRARY_AUTHOR';
      if (slotSamples[intent.name]?.[slot.name]) slot.samples = slotSamples[intent.name][slot.name];
    }
  }
  for (const intent of model.interactionModel.dialog.intents) {
    if (intent.name !== 'PlayBookIntent') continue;
    for (const slot of intent.slots) slot.type = slot.name === 'title' ? 'LIBRARY_TITLE' : 'LIBRARY_AUTHOR';
  }
  const prompts = [
    'Zum Beispiel: gehe fünfzehn Sekunden zurück.',
    'Zum Beispiel: spule fünfzehn Sekunden vor.',
    'Zum Beispiel: gehe zu Kapitel zwölf.',
  ];
  model.interactionModel.prompts.forEach((p, i) => { p.variations[0].value = prompts[i]; });

  fs.writeFileSync(path.join(dir, 'de-DE.json'), JSON.stringify(model, null, 2) + '\n');
  console.log(`de-DE.json: ${titles.size} titles/series, ${authors.size} authors, invocation "${INVOCATION}"`);
}

main().catch((e) => { console.error(e); process.exit(1); });
