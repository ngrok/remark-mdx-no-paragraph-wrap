# @ngrok/remark-mdx-no-paragraph-wrap

Remark plugin that prevents MDX from wrapping JSX component children in `<p>` tags.

## Why

MDX automatically wraps multiline content inside JSX components in `<p>` tags. For prose content this is great, but it causes **invalid or unexpected nesting** when using custom components like headers, cards, or layout wrappers:

```jsx
const PageHeader = ({ children, id }) => <h1 id={id}>{children}</h1>;
```

```mdx
<PageHeader id="philosophy">Philosophy</PageHeader>
```

MDX compiles this into:

```html
<h1 id="philosophy">
	<p>Philosophy</p>
</h1>
```

That `<p>` inside `<h1>` is invalid HTML — it breaks styling, violates nesting rules, and causes hydration mismatches.

## What

This remark plugin **automatically** strips paragraph nodes from inside **all** MDX JSX elements at the mdast (Markdown AST) level — before they are ever converted to HTML. No sentinel attribute or manual annotation is needed.

```mdx
<PageHeader id="philosophy">Philosophy</PageHeader>
```

Compiles to:

```html
<h1 id="philosophy">Philosophy</h1>
```

No `<p>` wrapper. All JSX elements are handled automatically.

## Installation

| package manager | command                                             |
| --------------- | --------------------------------------------------- |
| npm             | npm install -DE @ngrok/remark-mdx-no-paragraph-wrap |
| pnpm            | pnpm add -DE @ngrok/remark-mdx-no-paragraph-wrap    |
| bun             | bun add -DE @ngrok/remark-mdx-no-paragraph-wrap     |
| yarn            | yarn add -DE @ngrok/remark-mdx-no-paragraph-wrap    |

## Configuration

### With `@mdx-js/rollup` (Vite, Rollup)

```ts
import mdx from "@mdx-js/rollup";
import { remarkMdxNoParagraphWrap } from "@ngrok/remark-mdx-no-paragraph-wrap";

export default {
	plugins: [
		mdx({
			remarkPlugins: [remarkMdxNoParagraphWrap],
		}),
	],
};
```

### With `@mdx-js/mdx` (compile API)

```ts
import { compile } from "@mdx-js/mdx";
import { remarkMdxNoParagraphWrap } from "@ngrok/remark-mdx-no-paragraph-wrap";

const result = await compile(mdxSource, {
	remarkPlugins: [remarkMdxNoParagraphWrap],
});
```

## How it works

The plugin operates at the **mdast (Markdown AST)** level, running as a remark transform before MDX converts to HTML (hast).

1. **Walk the tree** — visits each node one time.
2. **Find JSX elements** — looks for `mdxJsxFlowElement` and `mdxJsxTextElement` nodes.
3. **Unwrap paragraphs** — inside a JSX element, at any depth, replaces each `paragraph` node with its own children. Before each paragraph after the first in a JSX element, it puts a newline, so their text does not run together.

Normal markdown prose outside JSX elements is unaffected.

Explicit `<p>` tags written in JSX (e.g., `<p className="custom">text</p>`) are **not** affected — MDX parses them as JSX element nodes, not mdast `paragraph` nodes, so they pass through untouched.

## API

### `remarkMdxNoParagraphWrap()`

Returns a remark transformer function. No options are needed — all MDX JSX elements are processed automatically.

## License

MIT
