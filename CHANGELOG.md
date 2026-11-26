# @ngrok/remark-mdx-no-paragraph-wrap

## 0.1.1

### Patch Changes

- [#4](https://github.com/ngrok/remark-mdx-no-paragraph-wrap/pull/4) [`60fc5d6`](https://github.com/ngrok/remark-mdx-no-paragraph-wrap/commit/60fc5d6ff55d80b9f38daac599b153fc93532172) Thanks [@cody-dot-js](https://github.com/cody-dot-js)! - Update dependencies within the 6h minimum release age. Build with tsdown: `dist/index.js` is now one bundled file with no source maps. The exports do not change.

- [#4](https://github.com/ngrok/remark-mdx-no-paragraph-wrap/pull/4) [`60fc5d6`](https://github.com/ngrok/remark-mdx-no-paragraph-wrap/commit/60fc5d6ff55d80b9f38daac599b153fc93532172) Thanks [@cody-dot-js](https://github.com/cody-dot-js)! - Put a newline before each paragraph after the first in a JSX element, also when another node sits between them. Before, their text ran together, as in `OneTwo`. Also walk the tree one time: a nested JSX element no longer walks its subtree again. On a synthetic tree of 20 nested elements, the transform takes about 19 µs, not 456 µs. Remove the `unist-util-visit` dependency.

## 0.1.0

### Minor Changes

- [`c0a516e`](https://github.com/ngrok/remark-mdx-no-paragraph-wrap/commit/c0a516e972d143ef00e8bfaf3cb113847b3defc6) Thanks [@cody-dot-js](https://github.com/cody-dot-js)! - hoist up to own repo and re-release
