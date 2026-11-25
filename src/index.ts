import type { Node, Paragraph, Parent, Root, RootContent } from "mdast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";

/**
 * Remark plugin that automatically unwraps `<p>` (paragraph) nodes from
 * inside MDX JSX elements.
 *
 * MDX automatically wraps multiline text content in paragraph nodes. This
 * is usually desirable for prose, but causes invalid/unexpected nesting
 * inside custom components like `<PageHeader>` where you don't want
 * paragraph wrapping.
 *
 * This plugin processes ALL MDX JSX elements automatically — no sentinel
 * attribute is required in the MDX source.
 *
 * Explicit `<p>` tags written in JSX (e.g., `<p className="custom">`) are
 * not affected — they are parsed as `mdxJsxFlowElement`/`mdxJsxTextElement`
 * nodes, not mdast `paragraph` nodes, so they pass through untouched.
 */
export function remarkMdxNoParagraphWrap(): (tree: Root) => void {
	return (tree) => {
		unwrapParagraphs(tree, false);
	};
}

/**
 * Walk the subtree of a node one time, and replace each paragraph inside an MDX JSX element with
 * its own children.
 */
function unwrapParagraphs(node: Parent, insideJsx: boolean): void {
	const unwrap = insideJsx || isMdxJsxElement(node);
	// Why the check: most lists hold no paragraph, so they keep their array.
	if (unwrap && node.children.some(isParagraph)) {
		// Why only for a JSX element: MDX puts a newline between the children of other blocks, such as
		// a blockquote, but not between the children of a JSX element.
		node.children = withoutParagraphs(node.children, isMdxJsxElement(node));
	}
	for (const child of node.children) {
		if (hasChildren(child)) {
			unwrapParagraphs(child, unwrap);
		}
	}
}

/**
 * Copy a list of nodes, with each paragraph replaced by its children. With `separate`, put a
 * newline between the text of two paragraphs.
 */
function withoutParagraphs(children: RootContent[], separate: boolean): RootContent[] {
	const result: RootContent[] = [];
	let afterParagraph = false;
	for (const child of children) {
		if (isParagraph(child)) {
			// Why the separator: the break between two paragraphs is the only space between their text.
			// Without it, the text runs together, as in "OneTwo".
			if (separate && afterParagraph) {
				result.push({ type: "text", value: "\n" });
			}
			result.push(...child.children);
			afterParagraph = true;
		} else {
			result.push(child);
			afterParagraph &&= rendersNothing(child);
		}
	}
	return result;
}

// Matches source text made of only comments and white space, such as `/* note */`. Why
// `(?:[^*]|\*(?!\/))`: a block comment cannot match past its first `*/`, so a value between two
// comments does not count as a comment. Why the lookahead: a line comment runs to its line end, so
// the match cannot split white space between `\s` and the comment, which backtracks.
const onlyComments =
	/^(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/|\/\/[^\n\r\u2028\u2029]*(?=[\n\r\u2028\u2029]|$))*$/u;

/**
 * Check if a node renders nothing in place: a definition, an `import` or `export`, frontmatter, or
 * an expression that holds only a comment.
 */
function rendersNothing(node: RootContent): boolean {
	// Why a string check: `toml` comes from `remark-frontmatter`, and mdast does not type it.
	if ((node.type as string) === "toml") {
		return true;
	}
	switch (node.type) {
		// Why `mdxjsEsm`: MDX hoists an `import` or `export` out of the rendered children. Why
		// `yaml`: `remark-frontmatter` can find frontmatter anywhere, and MDX does not render it.
		case "definition":
		case "footnoteDefinition":
		case "mdxjsEsm":
		case "yaml": {
			return true;
		}
		case "mdxFlowExpression": {
			// Why the fallback: `remark-mdx` with `addResult: false`, or another plugin, can leave out
			// the ESTree. Then read the source text.
			const estree = node.data?.estree;
			return estree == null ? onlyComments.test(node.value) : estree.body.length === 0;
		}
		default: {
			return false;
		}
	}
}

/**
 * Type guard that checks if a node is an mdast `paragraph` node.
 * These are the auto-generated paragraph wrappers that MDX creates
 * around bare text content — not explicit `<p>` JSX elements.
 */
function isParagraph(node: Node): node is Paragraph {
	return node.type === "paragraph";
}

/**
 * Type guard that checks if a node has a `children` array.
 */
function hasChildren(node: Node): node is Parent {
	return "children" in node && Array.isArray(node.children);
}

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement;

/**
 * Type guard that checks if a node is an MDX JSX element (flow or text).
 */
function isMdxJsxElement(node: Node): node is MdxJsxElement {
	return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}
