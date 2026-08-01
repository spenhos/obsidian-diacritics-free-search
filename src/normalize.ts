/**
 * Strip diacritics / combining marks from text.
 *
 * Supports:
 * - Hebrew nikud & cantillation (U+0591–U+05C7)
 * - Arabic tashkil (U+0610–U+061A, U+064B–U+065F, U+0670, U+06D6–U+06DC, etc.)
 * - Latin/Cyrillic/Greek combining marks (via NFD decomposition)
 * - Devanagari & other Indic scripts
 * - Any other combining mark in Unicode (category Mn = Mark, Nonspacing)
 */

// Use Unicode property escape to match ALL nonspacing marks (category Mn).
// This covers Hebrew nikud, Arabic tashkil, Latin combining accents, Devanagari,
// and any other combining diacritical mark in Unicode — past, present, and future.
// After NFD decomposition, accents become separate Mn codepoints that this regex removes.
const DIACRITICS_RE = /\p{Mn}/gu;

// Per-character strip cache.
//
// The set of *distinct* characters in any document is tiny (a few hundred), but
// stripping used to call normalize()+regex once per character *occurrence* —
// hundreds of thousands of times in a large note, on every search. Memoizing by
// character collapses that to one normalize()+regex per distinct character, with
// identical output.
const stripCharCache = new Map<string, string>();

function stripChar(ch: string): string {
	let stripped = stripCharCache.get(ch);
	if (stripped === undefined) {
		stripped = ch.normalize("NFD").replace(DIACRITICS_RE, "");
		stripCharCache.set(ch, stripped);
	}
	return stripped;
}

/**
 * Normalize text by removing all diacritical marks.
 * The original string structure (length, positions) is NOT preserved —
 * this is used only for comparison/matching purposes.
 */
export function stripDiacritics(text: string): string {
	// NFD decomposes characters like "é" into "e" + combining acute accent
	// Then we remove all combining marks (category Mn)
	return text.normalize("NFD").replace(DIACRITICS_RE, "");
}

/**
 * A reusable, diacritics-stripped view of some text, plus a mapping from each
 * normalized-string index back to the corresponding index in the ORIGINAL text.
 */
export interface NormalizedIndex {
	/** mapping[normalizedIdx] = original-string index */
	mapping: number[];
	normalizedText: string;
	/** Cached lower-cased form so case-insensitive searches don't re-lower per call. */
	normalizedTextLower: string;
}

/**
 * Build a {@link NormalizedIndex} for `text`.
 *
 * Building the index is the expensive part of a diacritics-free search, so
 * callers that search the same text repeatedly (e.g. as the user types) should
 * build it once and reuse it with {@link findMatchesInIndex}.
 */
export function buildNormalizedIndex(text: string): NormalizedIndex {
	// Build a mapping from normalized-index → original-index.
	// We need this because stripping diacritics changes string length.
	const originalChars: string[] = [...text]; // proper Unicode split
	const mapping: number[] = []; // mapping[normalizedIdx] = originalCharIdx
	let normalizedText = "";

	let origByteIdx = 0;
	for (let i = 0; i < originalChars.length; i++) {
		const char = originalChars[i];
		const normalizedChar = stripChar(char);
		for (let j = 0; j < normalizedChar.length; j++) {
			mapping.push(origByteIdx);
		}
		normalizedText += normalizedChar;
		origByteIdx += char.length;
	}
	// Add sentinel for end-of-string mapping
	mapping.push(origByteIdx);

	return {
		mapping,
		normalizedText,
		normalizedTextLower: normalizedText.toLowerCase(),
	};
}

/**
 * Find all matches of `query` inside a prebuilt {@link NormalizedIndex}.
 * Returns an array of { start, end } offsets in the ORIGINAL text.
 */
export function findMatchesInIndex(
	index: NormalizedIndex,
	query: string,
	caseSensitive: boolean = false
): Array<{ start: number; end: number }> {
	if (!query) return [];

	const normalizedQuery = caseSensitive
		? stripDiacritics(query)
		: stripDiacritics(query).toLowerCase();
	// A query made up entirely of diacritics strips to nothing; treat as no query
	// (rather than matching at every position, which is both useless and slow).
	if (!normalizedQuery) return [];

	const { mapping } = index;
	const searchText = caseSensitive ? index.normalizedText : index.normalizedTextLower;
	const matches: Array<{ start: number; end: number }> = [];

	let searchFrom = 0;
	while (searchFrom <= searchText.length - normalizedQuery.length) {
		const idx = searchText.indexOf(normalizedQuery, searchFrom);
		if (idx === -1) break;

		matches.push({ start: mapping[idx], end: mapping[idx + normalizedQuery.length] });
		searchFrom = idx + 1; // allow overlapping matches
	}

	return matches;
}

/**
 * Find all match positions in the original text, searching without diacritics.
 * Returns an array of { start, end } in the ORIGINAL text.
 *
 * Convenience wrapper that builds a one-off index. Prefer
 * {@link buildNormalizedIndex} + {@link findMatchesInIndex} when searching the
 * same text repeatedly.
 */
export function findMatchesIgnoringDiacritics(
	text: string,
	query: string,
	caseSensitive: boolean = false
): Array<{ start: number; end: number }> {
	if (!query) return [];
	return findMatchesInIndex(buildNormalizedIndex(text), query, caseSensitive);
}
