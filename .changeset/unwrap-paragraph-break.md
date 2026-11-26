---
"@ngrok/remark-mdx-no-paragraph-wrap": patch
---

Put a newline before each paragraph after the first in a JSX element, also when another node sits between them. Before, their text ran together, as in `OneTwo`. Also walk the tree one time: a nested JSX element no longer walks its subtree again. On a synthetic tree of 20 nested elements, the transform takes about 19 µs, not 456 µs. Remove the `unist-util-visit` dependency.
