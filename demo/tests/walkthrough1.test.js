/**
 * Walkthrough 1 — First open
 * Shows the two-pane layout and blinking toolbar buttons.
 */
const { createRecorder, waitForEditor } = require("./helpers");

const shot = createRecorder("walkthrought1");

describe("Walkthrough 1 : first open", () => {
  it("shows the main layout on startup", async () => {
    await waitForEditor();
    await shot("app-loaded");

    const saveBtn = await $("#unsaved-btn");
    const openBtn = await $("#open-project-btn");
    await saveBtn.waitForDisplayed();
    await openBtn.waitForDisplayed();
    await shot("toolbar-blinking");

    const fichierMenu = await $("button.menu-trigger");
    await fichierMenu.moveTo();
    await browser.pause(300);
    await shot("menu-fichier-hover");

    await $("body").click({ x: 600, y: 400 });
    await browser.pause(300);
    await shot("idle");
  });
});
