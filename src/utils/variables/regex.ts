import { applyFilters } from '../filters';

/**
 * Resolve a regex variable against full HTML source.
 * Syntax: {{regex:/pattern/flags}} or {{regex:/pattern/flags:group}}
 *
 * @param regexExpr - The full expression: "regex:/pattern/flags[:group]"
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

	// Strip "regex:" prefix
	const inner = regexExpr.slice('regex:'.length);

	// Parse: /pattern/flags[:group]
	const parsed = parseRegexLiteral(inner);
	if (!parsed) {
		return '';
	}

	const { pattern, flags, group } = parsed;

	let regex: RegExp;
	try {
		regex = new RegExp(pattern, flags);
	} catch (e) {
		console.error('Invalid regex:', pattern, e);
		return '';
	}

	const match = regex.exec(fullHtml);
	if (!match) {
		return '';
	}

	// Extract result
	let result: string;
	if (group !== undefined) {
		result = match[group] || '';
	} else if (match.length > 1) {
		// Has capture groups, default to group 1
		result = match[1] || '';
	} else {
		result = match[0] || '';
	}

	// Apply filters
	if (filtersString) {
		return applyFilters(result, filtersString, '');
	}

	return result;
}

/**
 * Parse a JS regex literal: /pattern/flags[:group]
 * Returns { pattern, flags, group } or null if invalid.
 */
function parseRegexLiteral(literal: string): { pattern: string; flags: string; group?: number } | null {
	// Must start with /
	if (!literal.startsWith('/')) {
		return null;
	}

	// Find closing / (accounting for escaped \/)
	let i = 1;
	let escaped = false;
	while (i < literal.length) {
		if (escaped) {
			escaped = false;
			i++;
			continue;
		}
		if (literal[i] === '\\') {
			escaped = true;
			i++;
			continue;
		}
		if (literal[i] === '/') {
			break;
		}
		i++;
	}

	if (i >= literal.length) {
		return null; // no closing /
	}

	const pattern = literal.slice(1, i);
	const rest = literal.slice(i + 1);

	// Parse flags and optional :group
	// rest can be: "g" | "gi" | "g:1" | "" | ":1"
	const flagMatch = rest.match(/^([gimsuy]*)(?::(\d+))?$/);
	if (!flagMatch) {
		return null;
	}

	return {
		pattern,
		flags: flagMatch[1] || '',
		group: flagMatch[2] !== undefined ? parseInt(flagMatch[2], 10) : undefined,
	};
}
