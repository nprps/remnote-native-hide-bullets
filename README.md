# Native Hide Bullets Everywhere

Prepared for this knowledge base. Automated tests passed. GitHub source repository creation and RemNote installation are in progress; live validation is still pending.

This sandboxed plugin enables RemNote's **real** Document / Hide Bullets property (`o.h = true`). It does not simulate the layout with CSS or change indentation. On activation it updates existing documents; it watches document changes and opened pages to update newly created documents and keep the setting on. Already-enabled settings are skipped.

RemNote's own renderer then controls paragraph alignment, list exceptions, headings, collapsing, keyboard actions, and copying. Native Hide Bullets deliberately retains bullets on some list/card/nested rows. This helper does not force those dots off or reset explicit per-row Show Bullet flags. The native UI has an additional legacy cleanup step when every child explicitly shows a bullet; that cleanup is not exposed by the supported SDK and is not reproduced here.

## Access

Requests `Powerup: o / ReadCreateModify`, scoped to the Document power-up and documents tagged with it. No delete permission, native execution mode, external network requests, or external libraries loaded at runtime. The official SDK 0.0.46 is bundled locally; the iframe's Content Security Policy blocks outgoing connections.

The plugin necessarily can read documents in its permission scope and modify their properties; this is new app access and must be approved before installation. The implementation only reads document status and the Hide Bullets property and writes that property. It never changes text, parent relationships, list/card flags, or CSS.

## Commands

- Native Hide Bullets: apply to all documents
- Native Hide Bullets: pause automatic enforcement
- Native Hide Bullets: resume automatic enforcement
- Native Hide Bullets: pause and restore previous settings

Original property values are saved in plugin-local storage before each first write. Run the restore command before uninstalling if you want to undo the document-setting changes. A previously absent property restores to an empty slot, which has the same disabled behavior. Existing enabled documents are never added to rollback history. Disabling/uninstalling stops enforcement but does not itself undo previously saved document settings.

## Installation and validation

Use RemNote Settings → Plugins and Themes → Build → Upload Plugin, with the prepared ZIP. Authorize the scoped access only after reviewing this source. Check a diagnostic document's native Hide Bullets switch and nested behavior, then create a new document to check automatic enforcement. The package has mocked API tests; it has not yet been tested within RemNote.

Source evidence: the loaded public native app's `setDocumentLevelNoBulletMode` writes the same `o.h` power-up slot. `renderAsNoBullet` and `canDisplayAsNoBullet` use model state that cannot be recovered perfectly from CSS selectors.

SDK/API references:
- https://plugins.remnote.com/advanced/powerups
- https://plugins.remnote.com/advanced/permissions
- https://plugins.remnote.com/advanced/events

The helper uses RemNote's current implementation; future app changes may require an update. It is not a guarantee that every bullet vanishes or that every native UI side effect is reproduced.
