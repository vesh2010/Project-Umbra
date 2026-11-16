// Local visual regression test. No meeting, microphone, or network is used.
const {BrowserWindow, desktopCapturer, screen} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
module.exports = async function testCapture(win, {compact=false}={}) {
  const display = screen.getDisplayMatching(win.getBounds());
  const backdrop = new BrowserWindow({...display.bounds, frame:false, show:false,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  const originalBounds = win.getBounds();
  const prefix = compact ? 'compact-' : '';
  const dir = path.join(__dirname, 'test-results');
  await fs.mkdir(dir, {recursive:true});
  try {
    await backdrop.loadURL('data:text/html,' + encodeURIComponent('<body style="margin:0;background:#e3e8ee;font:28px Arial"><p style="margin:36px">Local full-display capture test</p><p style="margin:36px;font-size:18px">The assistant should be absent from the protected capture.</p></body>'));
    backdrop.show();
    if(compact){
      await win.webContents.executeJavaScript("if(!document.body.classList.contains('compact'))document.getElementById('compact').click()");
      await delay(250);
      const compactState=await win.webContents.executeJavaScript("document.body.classList.contains('compact') && document.getElementById('compact').textContent==='Expand'");
      if(!compactState || Math.abs(win.getSize()[0]-620)>4 || Math.abs(win.getSize()[1]-560)>4)throw new Error('Compact overlay did not activate correctly');
      win.setPosition(display.workArea.x+60,display.workArea.y+130);
      await fs.writeFile(path.join(dir,'compact-preview.png'),(await win.webContents.capturePage()).toPNG());
    }else{
      await fs.writeFile(path.join(dir,'updated-workspace.png'),(await win.webContents.capturePage()).toPNG());
      win.setBounds({x:display.workArea.x+60,y:display.workArea.y+130,width:520,height:650});
    }
    await win.webContents.executeJavaScript(`(() => { const marker=document.createElement('div'); marker.id='capture-test-marker'; marker.style='position:fixed;left:12px;top:12px;width:160px;height:100px;background:rgb(255,0,255);z-index:2147483647';document.body.append(marker); })()`);
    const capture = async name => {
      await delay(1500);
      const sources = await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:display.size.width,height:display.size.height}});
      const source = sources.find(s => s.display_id === String(display.id));
      if (!source) throw new Error('Target display was not found');
      const pixels = source.thumbnail.toBitmap();
      let markerPixels = 0;
      for(let i=0;i<pixels.length;i+=4) if(pixels[i]>240 && pixels[i+1]<15 && pixels[i+2]>240) markerPixels++;
      await fs.writeFile(path.join(dir,prefix+name+'.png'),source.thumbnail.toPNG());
      return markerPixels;
    };
    win.setContentProtection(false);
    win.show();
    backdrop.focus(); // The assistant must remain above a focused ordinary window.
    const controlPixels = await capture('unprotected-control');
    const overlayUnfocusedAtControl = !win.isFocused();
    win.setContentProtection(true);
    const protectedPixels = await capture('protected-full-display');
    // Windows may keep a different application focused instead of our backdrop.
    // A visible control marker while this overlay is unfocused still tests the
    // required behavior: it remains visible above another active application.
    const capturePassed = controlPixels>1000 && protectedPixels===0;
    const overlayPassed = controlPixels>1000 && win.isAlwaysOnTop() && overlayUnfocusedAtControl;
    const report = {timestamp:new Date().toISOString(),compact,windowSize:win.getSize(),alwaysOnTop:win.isAlwaysOnTop(),backgroundFocused:backdrop.isFocused(),overlayUnfocusedAtControl,contentProtection:win.isContentProtected(),controlMarkerPixels:controlPixels,protectedMarkerPixels:protectedPixels,capturePassed,overlayPassed,passed:capturePassed && overlayPassed,scope:'Local Electron full-display capture; not a remote meeting test.'};
    await fs.writeFile(path.join(dir,prefix+'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
  } finally {
    win.setContentProtection(true);
    await win.webContents.executeJavaScript("document.getElementById('capture-test-marker')?.remove()");
    if(!compact)win.setBounds(originalBounds);
    backdrop.destroy(); win.show();
  }
};

