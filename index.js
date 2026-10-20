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
  await announce(() => nativeBullets.applyAll());
  await queueOpenPanes();
}

async function onDeactivate(plugin) {
  nativeBullets?.dispose();
  for (const [event, callback] of subscriptions.splice(0)) plugin.event.removeListener(event, undefined, callback);
}
declareIndexPlugin(onActivate, onDeactivate);
