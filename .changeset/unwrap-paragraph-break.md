---
"@ngrok/remark-mdx-no-paragraph-wrap": patch
---

Keep a newline between two adjacent paragraphs in a JSX element. Before, their text ran together, as in `OneTwo`. Also walk the tree one time: a nested JSX element no longer walks its subtree again. On a synthetic tree of 20 nested elements, the transform takes about 23 µs, not 450 µs. Remove the `unist-util-visit` dependency.
