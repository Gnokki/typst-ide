/**
 * Walkthrough 1 — First open
 * Shows the two-pane layout and blinking toolbar buttons.
 */
const { createRecorder, waitForEditor } = require("./helpers");

const shot = createRecorder("walkthrought1");

// Captures `count` frames spaced by `delay` ms — makes scenes as dense as typing ones
async function hold(label, count = 8, delay = 150) {
  for (let i = 0; i < count; i++) {
    await browser.pause(delay);
    await shot(`${label}_${i}`);
  }
}

describe("Walkthrough 1 : first open", () => {
  it("shows the main layout on startup", async () => {
    await waitForEditor();
    await hold("startup", 6);
    await shot("app-loaded");

    const saveBtn = await $("#unsaved-btn");
    const openBtn = await $("#open-project-btn");
    await saveBtn.waitForDisplayed();
    await openBtn.waitForDisplayed();
    await hold("toolbar", 8);
    await shot("toolbar-blinking");

    // const fichierMenu = await $("button.menu-trigger");
    // await fichierMenu.moveTo();
    // await hold("menu-hover", 6);
    // await shot("menu-fichier-hover");

    await $("body").click({ x: 600, y: 400 });
    await hold("idle", 10);
    await shot("idle");
  });
});
