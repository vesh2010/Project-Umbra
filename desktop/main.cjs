const {app, BrowserWindow, desktopCapturer, dialog, session, ipcMain, globalShortcut, shell, screen} = require('electron');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const page = path.resolve(__dirname, '../assistant.html');
const pageURL = pathToFileURL(page).href;
let win;
const testMode = process.argv.includes('--smoke-test') || process.argv.includes('--workspace-test');
if (testMode) app.setPath('userData', require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'meeting-companion-test-')));
let shortcutStatus = {failed:[]}, expandedBounds;
if (!testMode && !app.requestSingleInstanceLock()) app.quit();
app.on('second-instance',()=>{if(win){win.show();win.focus();}});
app.whenReady().then(async () => {
  if (process.platform !== 'win32') { dialog.showErrorBox('Windows required', 'This desktop companion currently supports Windows only.'); app.quit(); return; }
  const ses = session.fromPartition(testMode ? 'companion-test-'+Date.now() : 'persist:meeting-companion');
  ses.setPermissionCheckHandler((wc, permission) => wc === win?.webContents && ['media', 'display-capture', 'clipboard-sanitized-write'].includes(permission));
  ses.setPermissionRequestHandler(async (wc, permission, callback) => {
    if (wc !== win?.webContents || !['media','display-capture','clipboard-sanitized-write'].includes(permission)) return callback(false);
    if (permission === 'clipboard-sanitized-write') return callback(true);
    if (permission === 'display-capture') return callback(true);
    const result = await dialog.showMessageBox(win, {type:'question', message:'Allow microphone access?', buttons:['Cancel','Allow'], defaultId:0, cancelId:0});
    callback(result.response === 1);
  });
  ses.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (request.frame !== win?.webContents.mainFrame || !request.userGesture) return callback({});
      const sources = await desktopCapturer.getSources({types:['screen'], thumbnailSize:{width:0,height:0}});
      const result = await dialog.showMessageBox(win, {
        type:'question', title:'Choose a display', message:'Capture a display and system audio?',
        detail:'All computer audio will be captured, including sounds from other apps. The selected display supplies screen context. This source picker may appear in a screen share; select your source before sharing.',
        buttons:['Cancel', ...sources.map((s,i) => `${i+1}. ${s.name}`)], defaultId:0, cancelId:0
      });
      const source = sources[result.response - 1];
      callback(source ? {video:source, audio:'loopback'} : {});
    } catch { callback({}); }
  });
  win = new BrowserWindow({width:700, height:850, minWidth:480, minHeight:400, show:false, alwaysOnTop:true,
    webPreferences:{session:ses, preload:path.join(__dirname,'preload.cjs'), nodeIntegration:false, contextIsolation:true, sandbox:true}});
  win.setMenu(null);
  win.setContentProtection(true);
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  win.webContents.on('will-navigate', (event, url) => { if (url !== pageURL) event.preventDefault(); });
  const trusted = event => event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame && event.senderFrame.url === pageURL;
  ipcMain.handle('companion:control',(event,action)=>{
    if(!trusted(event))throw new Error('Invalid sender');
    if(action==='hide'){if(globalShortcut.isRegistered('Control+Shift+Space'))win.hide();}
    else if(action==='close')win.close();
    else if(action==='compact'){expandedBounds=win.getBounds();win.setSize(620,560);}
    else if(action==='expand' && expandedBounds)win.setBounds(expandedBounds);
  });
  ipcMain.handle('companion:opacity',(event,value)=>{if(!trusted(event)||typeof value!=='number'||!Number.isFinite(value))throw new Error('Invalid opacity');win.setOpacity(Math.min(1,Math.max(.6,value)));});
  ipcMain.handle('companion:shortcuts',event=>{if(!trusted(event))throw new Error('Invalid sender');return shortcutStatus;});
  ipcMain.handle('companion:link',async(event,value)=>{if(!trusted(event)||typeof value!=='string')throw new Error('Invalid sender');const url=new URL(value);if(url.protocol!=='https:')throw new Error('Only HTTPS links are allowed');await shell.openExternal(url.href);});
  if(!testMode){
    const bind=(key,fn)=>{if(!globalShortcut.register(key,fn))shortcutStatus.failed.push(key);};
    bind('Control+Shift+Enter',()=>{win.showInactive();win.webContents.send('companion:action','assist');});
    bind('Control+Shift+Space',()=>{if(win.isVisible())win.hide();else win.show();});
    for(const [key,dx,dy] of [['Left',-40,0],['Right',40,0],['Up',0,-40],['Down',0,40]])bind('Control+Alt+'+key,()=>{
      const b=win.getBounds(), area=screen.getDisplayMatching(b).workArea;
      win.setPosition(Math.max(area.x,Math.min(area.x+area.width-b.width,b.x+dx)),Math.max(area.y,Math.min(area.y+area.height-b.height,b.y+dy)));
    });
  }
  await win.loadFile(page);
  if (!win.isContentProtected()) { dialog.showErrorBox('Protection unavailable','Windows capture protection could not be enabled.'); app.quit(); return; }
  if (process.argv.includes('--smoke-test')) {
    const loaded = await win.webContents.executeJavaScript("Boolean(document.getElementById('start') && window.meetingDesktop?.windowsCaptureProtection && document.getElementById('sharingHelp').textContent.includes('exclusion'))");
    console.log(JSON.stringify({rendererLoaded:loaded, contentProtection:win.isContentProtected()}));
    app.exit(loaded ? 0 : 1); return;
  }
  if(process.argv.includes('--workspace-test')){
    try { await require('./workspace-test.cjs')(win); app.exit(0); }
    catch(error){console.error(error);app.exit(1);} return;
  }
  win.show();
  if (process.argv.includes('--capture-test')) {
    try { if(!process.argv.includes('--compact-only'))await require('./capture-test.cjs')(win); if(process.argv.includes('--compact-test'))await require('./capture-test.cjs')(win,{compact:true}); }
    catch (error) { console.error('Capture test failed:', error); }
  }
});
app.on('window-all-closed', () => app.quit());
app.on('will-quit',()=>globalShortcut.unregisterAll());

