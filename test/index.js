let nativeBullets;
const subscriptions = [];

async function onActivate(plugin) {
  nativeBullets = new NativeBulletsController(plugin);
  await nativeBullets.initialize();
  const announce = async action => {
    try {
      const count = await action();
      await plugin.app.toast('Native Hide Bullets: ' + count + ' document settings updated.');
    } catch (error) {
      await plugin.app.toast('Native Hide Bullets could not finish: ' + error.message);
    }
  };
  await plugin.app.registerCommand({
    id: 'native-hide-bullets-test-current', name: 'Native Hide Bullets: test current document',
    action: () => announce(async () => {
      const pane = await plugin.window.getFocusedPaneId();
      const id = await plugin.window.getOpenPaneRemId(pane);
      if (!id) throw new Error('Open a document before running the test.');
      return nativeBullets.applyOne(id);
    })
  });
  await plugin.app.registerCommand({
    id: 'native-hide-bullets-apply', name: 'Native Hide Bullets: apply to all documents',
    action: () => announce(() => nativeBullets.applyAll())
  });
  await plugin.app.registerCommand({
    id: 'native-hide-bullets-pause', name: 'Native Hide Bullets: pause automatic enforcement',
    action: async () => { await nativeBullets.pause(); await plugin.app.toast('Automatic Hide Bullets paused. Existing document settings remain.'); }
  });
  await plugin.app.registerCommand({
    id: 'native-hide-bullets-resume', name: 'Native Hide Bullets: resume automatic enforcement',
    action: () => announce(() => nativeBullets.resume())
  });
  await plugin.app.registerCommand({
    id: 'native-hide-bullets-restore', name: 'Native Hide Bullets: pause and restore previous settings',
    action: () => announce(() => nativeBullets.restore())
  });
  const queueChanged = data => nativeBullets.queueDocument(typeof data === 'string' ? data : data?.remId || data?._id || data?.rem?._id);
  const queueOpenPanes = async () => {
    try {
      for (const id of await plugin.window.getOpenPaneRemIds()) nativeBullets.queueDocument(id);
    } catch (error) { await plugin.app.toast('Hide Bullets: ' + error.message); }
  };
  for (const [event, callback] of [
    [AppEvents.GlobalRemChanged, queueChanged],
    [AppEvents.GlobalOpenRem, queueChanged],
    [AppEvents.URLChange, queueOpenPanes]
  ]) {
    plugin.event.addListener(event, undefined, callback);
    subscriptions.push([event, callback]);
  }
  if (nativeBullets.enabled) await announce(() => nativeBullets.applyAll());
  else await plugin.app.toast('Hide Bullets live test ready. Automatic enforcement is paused.');
  await queueOpenPanes();
}

async function onDeactivate(plugin) {
  nativeBullets?.dispose();
  for (const [event, callback] of subscriptions.splice(0)) plugin.event.removeListener(event, undefined, callback);
}
declareIndexPlugin(onActivate, onDeactivate);
