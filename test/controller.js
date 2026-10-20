/* Uses only supported RemNote APIs. No DOM access or external requests. */
(function (root) {
  class NativeBulletsController {
    constructor(plugin) {
      this.plugin = plugin;
      this.enabled = false;
      this.backup = {};
      this.pending = new Set();
      this.chain = Promise.resolve();
      this.timer = undefined;
    }
    async initialize() {
      this.backup = (await this.plugin.storage.getLocal('original-hide-bullets')) || {};
      this.enabled = (await this.plugin.storage.getLocal('automatic-enabled')) === true;
    }
    serial(task) {
      const result = this.chain.then(task, task);
      this.chain = result.catch(() => {});
      return result;
    }
    async applyDocument(rem, force = false) {
      if ((!this.enabled && !force) || !rem || !(await rem.isDocument())) return false;
      if ((await rem.getPowerupProperty('o', 'h')) === 'true') return false;
      if (!Object.prototype.hasOwnProperty.call(this.backup, rem._id)) {
        this.backup[rem._id] = (await rem.getPowerupPropertyAsRichText('o', 'h')) || [];
        // Persist the original setting BEFORE writing the document.
        await this.plugin.storage.setLocal('original-hide-bullets', this.backup);
      }
      await rem.setPowerupProperty('o', 'h', ['true']);
      return true;
    }
    applyOne(id) {
      return this.serial(async () => {
        const rem = await this.plugin.rem.findOne(id);
        if (!rem || !(await rem.isDocument())) throw new Error('Open a document before running the test.');
        return Number(await this.applyDocument(rem, true));
      });
    }
    applyAll() {
      return this.serial(async () => {
        if (!this.enabled) return 0;
        const documentPowerup = await this.plugin.powerup.getPowerupByCode('o');
        if (!documentPowerup) throw new Error('Document power-up is unavailable.');
        const documents = await documentPowerup.taggedRem();
        let changed = 0;
        for (const rem of documents) changed += Number(await this.applyDocument(rem));
        return changed;
      });
    }
    queueDocument(id) {
      if (!this.enabled || typeof id !== 'string') return;
      this.pending.add(id);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.flush().catch(error => this.plugin.app.toast('Hide Bullets: ' + error.message));
      }, 400);
    }
    flush() {
      return this.serial(async () => {
        const ids = [...this.pending];
        this.pending.clear();
        for (const id of ids) {
          if (!this.enabled) break;
          await this.applyDocument(await this.plugin.rem.findOne(id));
        }
      });
    }
    async pause() {
      this.enabled = false;
      clearTimeout(this.timer);
      this.pending.clear();
      await this.plugin.storage.setLocal('automatic-enabled', false);
      await this.chain;
    }
    async resume() {
      this.enabled = true;
      await this.plugin.storage.setLocal('automatic-enabled', true);
      return this.applyAll();
    }
    async restore() {
      await this.pause();
      return this.serial(async () => {
        let restored = 0;
        for (const [id, previous] of Object.entries(this.backup)) {
          const rem = await this.plugin.rem.findOne(id);
          // Respect a different setting the user has since chosen.
          if (rem && (await rem.getPowerupProperty('o', 'h')) === 'true') {
            await rem.setPowerupProperty('o', 'h', previous);
            restored++;
          }
          delete this.backup[id];
          await this.plugin.storage.setLocal('original-hide-bullets', this.backup);
        }
        return restored;
      });
    }
    dispose() {
      this.enabled = false;
      clearTimeout(this.timer);
      this.pending.clear();
    }
  }
  root.NativeBulletsController = NativeBulletsController;
  if (typeof module !== 'undefined') module.exports = { NativeBulletsController };
})(globalThis);
