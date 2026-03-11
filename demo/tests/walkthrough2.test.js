/**
 * Walkthrough 2 — Typing
 * Types a Typst document and shows the preview updating in real time.
 */
const {
  createRecorder,
  waitForEditor,
  focusEditor,
  typeInEditor,
} = require("./helpers");

const shot = createRecorder("walkthrought2");

const DEMO_DOCUMENT = `= Hello, Typst IDE!
== Features
- Real-time preview
- Monaco editor with syntax highlighting
- Export to PDF

== Example
#let greet(name) = [Hello, *#name*!]
#greet("world")

#figure(
rect(width: 60%, height: 3cm, fill: blue.lighten(80%)),
caption: [A simple rectangle],
`;

describe("Walkthrough 2 : typing", () => {
  it("shows the preview updating as the user types", async () => {
    await waitForEditor();
    await shot("initial");

    await focusEditor();
    await typeInEditor(shot, DEMO_DOCUMENT);

    await browser.pause(800);
    await shot("final");
  });
});
