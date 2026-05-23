import { resolveRegexVariable } from './regex';

describe('resolveRegexVariable', () => {
	const html = `<script>var createTime = '2026-04-05 09:40';</script>`;

	test('basic match with capture group', () => {
		expect(resolveRegexVariable("regex:var createTime = '([^']+)'", html))
			.toBe("2026-04-05 09:40");
	});

	test('full match without group', () => {
		expect(resolveRegexVariable("regex:var createTime = '[^']+'", html))
			.toBe("var createTime = '2026-04-05 09:40'");
	});

	test('specific capture group', () => {
		expect(resolveRegexVariable("regex:var (\\w+) = '([^']+)'", html))
			.toBe("var createTime = '2026-04-05 09:40'"); // group 0
	});

	test('specific capture group index 1', () => {
		expect(resolveRegexVariable("regex:var (\\w+) = '([^']+)':1", html))
			.toBe("createTime");
	});

	test('specific capture group index 2', () => {
		expect(resolveRegexVariable("regex:var (\\w+) = '([^']+)':2", html))
			.toBe("2026-04-05 09:40");
	});

	test('no match returns empty', () => {
		expect(resolveRegexVariable("regex:nonexistent", html)).toBe("");
	});

	test('invalid regex returns empty', () => {
		expect(resolveRegexVariable("regex:[invalid", html)).toBe("");
	});

	test('empty html returns empty', () => {
		expect(resolveRegexVariable("regex:test", "")).toBe("");
	});

	test('undefined html returns empty', () => {
		expect(resolveRegexVariable("regex:test", undefined)).toBe("");
	});

	test('with filter trim', () => {
		const htmlWithSpaces = `<script>  var createTime = '2026-04-05 09:40';  </script>`;
		expect(resolveRegexVariable("regex:var createTime = '([^']+)'", htmlWithSpaces, "trim"))
			.toBe("2026-04-05 09:40");
	});
});
