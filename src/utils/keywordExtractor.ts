/**
 * Intelligent keyword extraction and manual highlight management for short-form video hooks & scripts.
 * Supports:
 * 1. Manual selection highlighting (Only user-selected words/phrases)
 * 2. Combined AI + Manual highlighting
 * 3. Bracket markup [word] or [selected phrase]
 */

// Common high-impact viral words for AI auto-detection
const IMPACT_DICTIONARY = new Set([
  'killed', 'killing', 'kills', 'kill',
  'burns', 'burned', 'burning',
  'died', 'death', 'dead', 'dying',
  'murder', 'murdered',
  'dragged', 'drag',
  'rifles', 'rifle', 'guns', 'gun', 'weapon',
  'hurt', 'injuries', 'injured', 'wound', 'bleeding', 'blood',
  'war', 'battle', 'army', 'soldier',
  'police', 'arrested', 'jail', 'prison', 'crime',
  'secret', 'secrets', 'shocking', 'shocked',
  'mystery', 'mysterious', 'unexplained',
  'danger', 'dangerous', 'warning', 'banned', 'illegal',
  'disaster', 'tragic', 'tragedy', 'curse', 'cursed',
  'truth', 'lie', 'lies', 'conspiracy', 'revealed',
  'insane', 'craziest', 'unbelievable', 'impossible',
  'legend', 'legendary', 'hero', 'heroes',
  'famous', 'star', 'stars', 'celebrity',
  'survived', 'survivor', 'rescue', 'saved',
  'segregated', 'racist', 'supremacist',
  'monster', 'creature', 'ghost', 'demon',
  'money', 'million', 'millions', 'billion', 'billions', 'fortune', 'wealth',
  'piano', 'hollywood', 'titanic', 'strongheart', 'etzel', 'berlin',
  'alabama', 'birmingham', 'studio',
  'first', 'last', 'only', 'never',
]);

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'over', 'after', 'before', 'between', 'under', 'during',
  'without', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can',
  'will', 'just', 'don', 'should', 'now', 'he', 'she', 'it', 'they', 'we', 'i', 'you',
  'his', 'her', 'their', 'our', 'my', 'your', 'him', 'them', 'us', 'me',
  'was', 'were', 'is', 'am', 'are', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'doing', 'would', 'could', 'come', 'came', 'went', 'go',
  'see', 'saw', 'seen', 'put', 'bought', 'told', 'tell', 'ran', 'run', 'found',
]);

/**
 * Extracts phrases wrapped in brackets like [selected text] from the script.
 */
export function extractBracketHighlights(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\[(.*?)\]/g);
  if (!matches) return [];
  return matches
    .map((m) => m.replace(/^\[|\]$/g, '').trim())
    .filter((m) => m.length > 0);
}

/**
 * Clean punctuation from word for comparison
 */
export function cleanPunctuation(str: string): string {
  if (!str) return '';
  // Support Unicode letters and numbers (\p{L} and \p{N}) across all languages including Urdu/Arabic
  return str.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase().trim();
}

/**
 * Extracts a list of active keywords based on highlight mode:
 * - 'manual-only': ONLY user-selected phrases and bracketed words!
 * - 'auto-and-manual': user-selected phrases + bracketed words + AI entity detection
 * - 'none': empty list (no highlights)
 */
export function getActiveHighlights(
  text: string,
  mode: 'manual-only' | 'auto-and-manual' | 'none' = 'auto-and-manual',
  customKeywords: string[] = [],
  excludedKeywords: string[] = []
): string[] {
  if (mode === 'none' || !text || !text.trim()) return [];

  const excludedSet = new Set(excludedKeywords.map((k) => cleanPunctuation(k)));
  const foundKeywords = new Set<string>();

  // 1. Add user-selected custom keywords
  for (const custom of customKeywords) {
    const trimmed = custom.trim();
    if (trimmed && !excludedSet.has(cleanPunctuation(trimmed))) {
      foundKeywords.add(trimmed);
    }
  }

  // 2. Add any [bracketed text] from script
  const bracketMatches = extractBracketHighlights(text);
  for (const b of bracketMatches) {
    if (!excludedSet.has(cleanPunctuation(b))) {
      foundKeywords.add(b);
    }
  }

  // If mode is 'manual-only', return ONLY manual / selected items!
  if (mode === 'manual-only') {
    return Array.from(foundKeywords);
  }

  // 3. For 'auto-and-manual': Add known entities & impact words
  const multiWordCandidates = [
    'First World War',
    'Walk of Fame',
    'Nat King Cole',
    'German Shepherd',
    'white supremacist',
    'Rin Tin Tin',
    'nineteen twenty one',
    'nineteen fifty six',
    'nineteen twelve',
    'Apollo eleven',
    'Great Emu War',
  ];

  for (const phrase of multiWordCandidates) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    if (regex.test(text) && !excludedSet.has(cleanPunctuation(phrase))) {
      foundKeywords.add(phrase);
    }
  }

  const wordTokens = text.split(/\s+/);
  wordTokens.forEach((rawWord, idx) => {
    const clean = cleanPunctuation(rawWord);
    if (!clean || clean.length < 2) return;

    if (excludedSet.has(clean)) return;

    // Numbers or years (e.g. 1921, 1956, 100)
    if (/^\d+/.test(clean)) {
      foundKeywords.add(clean);
      return;
    }

    // Impact dictionary words
    if (IMPACT_DICTIONARY.has(clean)) {
      foundKeywords.add(clean);
      return;
    }

    // Capitalized proper nouns
    const rawClean = rawWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    const isCapitalized = /^[A-Z][a-z0-9]/.test(rawClean);
    const isSentenceStarter = idx === 0 || /[.!?]\s*$/.test(wordTokens[idx - 1] || '');

    if (isCapitalized && !STOP_WORDS.has(clean)) {
      if (!isSentenceStarter) {
        foundKeywords.add(rawClean);
      } else {
        if (IMPACT_DICTIONARY.has(clean) || ['strongheart', 'birmingham', 'etzel', 'rin'].includes(clean)) {
          foundKeywords.add(rawClean);
        }
      }
    }
  });

  return Array.from(foundKeywords);
}

/**
 * Checks if a specific word (or part of phrase) matches active highlights.
 */
export function isWordKeyword(word: string, activeKeywords: string[]): boolean {
  if (!word || !activeKeywords.length) return false;
  const cleanWord = cleanPunctuation(word);
  if (!cleanWord) return false;

  for (const kw of activeKeywords) {
    const cleanKw = cleanPunctuation(kw);
    // Exact word match only! Never match arbitrary sub-words of multi-word phrases.
    if (cleanKw === cleanWord) {
      return true;
    }
  }

  return false;
}
