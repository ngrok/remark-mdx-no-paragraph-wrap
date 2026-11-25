import type { Root, RootContent } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";

import { remarkMdxNoParagraphWrap } from "./index.js";

/**
 * Compile MDX source with the plugin and return the output as a string.
 */
async function compileWithPlugin(mdx: string) {
	const result = await compile(mdx, {
		jsx: true,
		remarkPlugins: [remarkMdxNoParagraphWrap],
	});
	return String(result);
}

/**
 * Compile MDX source without the plugin and return the output as a string.
 */
async function compileWithoutPlugin(mdx: string) {
	const result = await compile(mdx, { jsx: true });
	return String(result);
}

describe("remarkMdxNoParagraphWrap", () => {
	it("basic: single-line JSX text has no <p> with or without plugin", async () => {
		const input = `<Foo>text</Foo>`;
		const output = await compileWithPlugin(input);

		expect(output).not.toContain("_components.p");
		expect(output).toContain("<Foo>");
	});

	it("multiline: MDX wraps in <p> without plugin, plugin removes it", async () => {
		const input = `<Foo>\n\ttext\n</Foo>`;
		const without = await compileWithoutPlugin(input);
		const output = await compileWithPlugin(input);

		expect(without).toContain("_components.p");
		expect(output).not.toContain("_components.p");
		expect(output).toContain("<Foo>");
	});

	it("nested JSX: removes <p> from nested JSX elements", async () => {
		const input = `<Outer>\n\t<Inner>\n\t\ttext\n\t</Inner>\n</Outer>`;
		const output = await compileWithPlugin(input);

		expect(output).not.toContain("_components.p");
		expect(output).toContain("<Outer>");
		expect(output).toContain("<Inner>");
	});

	it("separate paragraphs: keeps a break between their text", async () => {
		const input = `<Outer>\n<Foo>\n\nOne\n\nTwo\n\n</Foo>\n</Outer>`;
		const output = await compileWithPlugin(input);

		expect(output).not.toContain("_components.p");
		expect(output).toContain(String.raw`<Foo>{"One"}{"\n"}{"Two"}</Foo>`);
	});

	it("separate paragraphs: keeps the break across a definition or a comment", async () => {
		const input = `<Foo>\n\nOne\n\n[ref]: /url\n\nTwo\n\n{/* note */}\n\nThree\n\n</Foo>`;
		const output = await compileWithPlugin(input);

		expect(output).toContain(String.raw`{"One"}{"\n"}{"Two"}`);
		expect(output).toContain(String.raw`{"Two"}{}{"\n"}{"Three"}`);
	});

	it("separate paragraphs: keeps the break across an export", async () => {
		const input = `<Foo>\n\nOne\n\nexport const n = 1\n\nTwo\n\n</Foo>`;
		const output = await compileWithPlugin(input);

		expect(output).toContain(String.raw`<Foo>{"One"}{"\n"}{"Two"}</Foo>`);
	});

	it("separate paragraphs: reads the source of an expression with no ESTree, and skips frontmatter", () => {
		// Why a tree, not a compile: `remark-mdx` with `addResult: false` leaves out the ESTree, and
		// `remark-frontmatter` adds `yaml` and `toml` nodes. Neither plugin is a dependency.
		function transform(between: RootContent): RootContent[] {
			const paragraph = (value: string): RootContent => ({
				type: "paragraph",
				children: [{ type: "text", value }],
			});
			const foo: MdxJsxFlowElement = {
				type: "mdxJsxFlowElement",
				name: "Foo",
				attributes: [],
				// Why the cast: frontmatter is not flow content in the mdast types, but a plugin can put it here.
				children: [paragraph("One"), between, paragraph("Two")] as MdxJsxFlowElement["children"],
			};
			const tree: Root = { type: "root", children: [foo] };
			remarkMdxNoParagraphWrap()(tree);
			return foo.children;
		}
		const comment: RootContent = { type: "mdxFlowExpression", value: "/* note */" };
		const valueInComments: RootContent = {
			type: "mdxFlowExpression",
			value: `/* a */ "X" /* b */`,
		};
		const yaml: RootContent = { type: "yaml", value: "k: v" };
		// Why the cast: mdast does not type `toml`.
		const toml = { type: "toml", value: "k = 1" } as unknown as RootContent;
		const text = (value: string) => ({ type: "text", value });

		// A comment or frontmatter renders nothing, so the break stays.
		for (const between of [comment, yaml, toml]) {
			expect(transform(between)).toStrictEqual([text("One"), between, text("\n"), text("Two")]);
		}
		// A value between two comments renders, so it is the break.
		expect(transform(valueInComments)).toStrictEqual([text("One"), valueInComments, text("Two")]);
	});

	it("blocks in JSX: unwraps paragraphs in a blockquote and a list, and keeps prose outside", async () => {
		const input = `Before\n\n<Foo>\n> quote one\n>\n> quote two\n\n- a\n\n- b\n</Foo>\n\nAfter`;
		const output = await compileWithPlugin(input);
		const foo = output.slice(output.indexOf("<Foo>"), output.indexOf("</Foo>"));

		expect(foo).not.toContain("_components.p");
		// Why one newline: MDX puts it between blockquote children, so the plugin adds none.
		expect(foo).toContain(String.raw`{"quote one"}{"\n"}{"quote two"}`);
		expect(foo).toContain(String.raw`<_components.li>{"\n"}{"a"}{"\n"}</_components.li>`);
		expect(output).toContain(`<_components.p>{"Before"}</_components.p>`);
		expect(output).toContain(`<_components.p>{"After"}</_components.p>`);
	});

	it("mixed content: preserves inline formatting without <p> wrapper", async () => {
		const input = `<Foo>\n\ttext with **bold** and \`code\`\n</Foo>`;
		const output = await compileWithPlugin(input);

		expect(output).not.toContain("_components.p");
		expect(output).toContain("<Foo>");
	});

	it("normal prose: paragraphs outside JSX elements are unaffected", async () => {
		const input = `This is a paragraph.\n\nThis is another paragraph.`;
		const output = await compileWithPlugin(input);

		expect(output).toContain("_components.p");
	});

	it("explicit <p> in JSX: not stripped because it is a JSX element, not an mdast paragraph", async () => {
		const input = `<Foo>\n\t<p className="custom">text</p>\n</Foo>`;
		const output = await compileWithPlugin(input);

		expect(output).toContain('<p className="custom">');
	});

	it("jsx with attributes: works with JSX elements that have props", async () => {
		const input = `<PageHeader id="philosophy">\n\tPhilosophy\n</PageHeader>`;
		const output = await compileWithPlugin(input);

		expect(output).not.toContain("_components.p");
		expect(output).toContain('id="philosophy"');
	});

	it("multiple JSX elements: all have paragraphs removed independently", async () => {
		const input = `<Foo>\n\tHello\n</Foo>\n\n<Bar>\n\tWorld\n</Bar>`;
		const output = await compileWithPlugin(input);

		expect(output).not.toContain("_components.p");
		expect(output).toContain("<Foo>");
		expect(output).toContain("<Bar>");
	});
});
