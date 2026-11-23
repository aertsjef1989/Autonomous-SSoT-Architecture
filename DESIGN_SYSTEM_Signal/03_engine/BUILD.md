# Building the studio

    node bundle.js

Reads signal-kit.js, signal-detail.js, signal-shade.js, signal-app-model.js and editor-shell.html,
inlines them into signal-studio.html, then **parses every inline script exactly as a browser
would** and fails loudly if any of them break.

## Why that last step exists

The engine files are Node modules and end with an export line. The bundler strips it. The model's
export was guarded:

    if (typeof module !== "undefined") module.exports = { ... };

An earlier bundler only stripped the `module.exports = {...}` half, leaving a dangling `if (...)`
with no body. Node was happy, because Node never saw the stripped file. The browser was not:
`SyntaxError: Unexpected end of input`, and every symbol in that script vanished, which took the
whole editor with it.

The lesson is in the build now: **the bundler checks the artefact it produces, not the source it
reads from.** It parses each inline script with `new Function(src)` and greps for leftover
node-only code (`require(`, `module.exports`, `typeof module`).
