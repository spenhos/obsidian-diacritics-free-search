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
 * Find all match positions in the original text, searching without diacritics.
 * Returns an array of [startIndex, endIndex] in the ORIGINAL text.
 */
export function findMatchesIgnoringDiacritics(
	text: string,
	query: string,
	caseSensitive: boolean = false
): Array<{ start: number; end: number }> {
	if (!query) return [];

	const normalizedQuery = caseSensitive
		? stripDiacritics(query)
		: stripDiacritics(query).toLowerCase();

	// Build a mapping from normalized-index → original-index
	// We need this because stripping diacritics changes string length
	const originalChars: string[] = [...text]; // proper Unicode split
	const mapping: number[] = []; // mapping[normalizedIdx] = originalCharIdx
	let normalizedText = "";

	let origByteIdx = 0;
	for (let i = 0; i < originalChars.length; i++) {
		const char = originalChars[i];
		const normalizedChar = stripDiacritics(char);
		for (let j = 0; j < normalizedChar.length; j++) {
			mapping.push(origByteIdx);
			normalizedText += normalizedChar[j];
		}
		origByteIdx += char.length;
	}
	// Add sentinel for end-of-string mapping
	mapping.push(origByteIdx);

	const searchText = caseSensitive ? normalizedText : normalizedText.toLowerCase();
	const matches: Array<{ start: number; end: number }> = [];

	let searchFrom = 0;
	while (searchFrom <= searchText.length - normalizedQuery.length) {
		const idx = searchText.indexOf(normalizedQuery, searchFrom);
		if (idx === -1) break;

		const startOrig = mapping[idx];
		const endOrig = mapping[idx + normalizedQuery.length];

		matches.push({ start: startOrig, end: endOrig });
		searchFrom = idx + 1; // allow overlapping matches
	}

	return matches;
}
