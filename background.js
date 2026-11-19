// Runs when the toolbar icon is clicked (or Alt+Shift+F is pressed).
// Injects filler.js into the page and every frame we're allowed to touch.

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;

  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["filler.js"],
    });
  } catch (err) {
    // Some cross-origin frames may be off-limits; fall back to the top frame only.
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["filler.js"],
      });
    } catch (err2) {
      // chrome://, Chrome Web Store, PDF viewer, etc. can't be scripted.
      await flashBadge(tab.id, "!", "#d93025");
      console.warn("Dummy Form Filler: cannot run on this page.", err2);
      return;
    }
  }

  const filled = (results || []).reduce(
    (sum, r) => sum + (typeof r.result === "number" ? r.result : 0),
    0
  );
  await flashBadge(tab.id, String(filled), filled > 0 ? "#188038" : "#5f6368");
});

async function flashBadge(tabId, text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
    await chrome.action.setBadgeText({ tabId, text });
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {});
    }, 2500);
  } catch (_) {
    /* tab may have closed */
  }
}
