# Dummy Form Filler

A Chrome extension that fills every input on the current page with realistic dummy data. Click the toolbar icon (or press **Alt+Shift+F**) and each field gets a value that matches what it asks for.

## How it works

For each visible, editable field the extension reads its `type`, `name`, `id`, `placeholder`, `autocomplete`, `aria-label` and label text, then picks matching data:

| Field looks like | Filled with |
| --- | --- |
| First / last / full name | A consistent fake person (same name everywhere on the page) |
| Email, username | Derived from that name, `@example.com` |
| Password / confirm password | The same test password in both |
| Phone, address, city, state, ZIP, country | A matching US address |
| Company, job title, website | Fake company data |
| Date of birth, other dates, time, month, week | Valid values, respecting `min`/`max` |
| Number, range | Within `min`/`max`/`step` |
| Card number, CVV, expiry | Stripe's public test card `4242 4242 4242 4242` |
| Message / comment / bio, textareas | Lorem ipsum paragraph |
| Select | A real option (skips "Select…" placeholders) |
| Radio groups | One option per group |
| Checkboxes | Terms/consent boxes ticked, others random |

It also respects `maxlength`, `minlength` and simple `pattern`s, fires `input`/`change` events so React, Vue and Angular forms register the values, fills fields inside open shadow roots and iframes, and skips hidden, disabled and read-only fields. Every click generates a fresh person.

The badge on the icon shows how many fields were filled, and a small toast appears on the page.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this folder.
4. Pin the extension from the puzzle-piece menu so the icon is always visible.

To change the shortcut, go to `chrome://extensions/shortcuts`.

## Permissions

- `activeTab` – access to the page only when you click the icon.
- `scripting` – to inject the filler script at that moment.

No data leaves your browser. Chrome doesn't allow extensions on `chrome://` pages or the Chrome Web Store.

## License

MIT
