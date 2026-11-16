const {contextBridge,ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('meetingDesktop', {
  windowsCaptureProtection:true,
  control:action=>ipcRenderer.invoke('companion:control',action),
  setOpacity:value=>ipcRenderer.invoke('companion:opacity',value),
  getShortcuts:()=>ipcRenderer.invoke('companion:shortcuts'),
  openLink:url=>ipcRenderer.invoke('companion:link',url),
  onAction:callback=>{ipcRenderer.on('companion:action',(_event,action)=>callback(action));}
});

