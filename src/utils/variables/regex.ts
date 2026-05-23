import { applyFilters } from '../filters';

/**
 * Resolve a regex variable against full HTML source.
 * Syntax: {{regex:pattern}} or {{regex:pattern:group}}
 *
 * @param regexExpr - The full expression after {{regex:...}}
 * @param fullHtml - The complete HTML string to search
 * @param filtersString - Optional filters after |
 * @returns The matched string or empty string
 */
export function resolveRegexVariable(
	regexExpr: string,
	fullHtml: string | undefined,
	filtersString?: string
): string {
	if (!fullHtml) {
		return '';
	}

	// Parse pattern and optional group
	// Format: pattern or pattern:group
	const firstColon = regexExpr.indexOf(':');
	if (firstColon === -1) {
		return '';
	}

	const rest = regexExpr.slice(firstColon + 1);

	// Handle potential filter separator confusion
	// The pattern itself might contain |, but filters are separated by |
	// We need to determine where pattern ends and filters begin
	// Approach: split by |, try each segment boundary to find a valid regex

	const segments = rest.split('|');
	let patternStr: string;
	let groupStr: string | undefined;
	let actualFilters: string | undefined;

	// Try progressively longer pattern segments
	for (let i = 1; i <= segments.length; i++) {
		patternStr = segments.slice(0, i).join('|');
		const remaining = segments.slice(i).join('|');

		// Check if pattern contains a group specifier
		const lastColon = patternStr.lastIndexOf(':');
		if (lastColon > 0) {
			const potentialGroup = patternStr.slice(lastColon + 1);
			// Group is a number or empty (empty means full match)
			if (/^\d*$/.test(potentialGroup)) {
				groupStr = potentialGroup || undefined;
				patternStr = patternStr.slice(0, lastColon);
			}
		}

		try {
			const regex = new RegExp(patternStr);
			actualFilters = remaining || undefined;
			break;
		} catch {
			if (i === segments.length) {
				// Last attempt, invalid regex
				console.error('Invalid regex pattern:', patternStr);
				return '';
			}
			// Continue trying longer pattern
		}
	}

	// Execute regex
	const regex = new RegExp(patternStr!);
	const match = regex.exec(fullHtml);

	if (!match) {
		return '';
	}

	// Extract group
	let result: string;
	if (groupStr) {
		const groupIndex = parseInt(groupStr, 10);
		result = match[groupIndex] || '';
	} else {
		result = match[0] || '';
	}

	// Apply filters
	if (actualFilters) {
		return applyFilters(result, actualFilters, '');
	}

	return result;
}
