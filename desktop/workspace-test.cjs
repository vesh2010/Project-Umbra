const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
module.exports=async win=>{
  const run=source=>win.webContents.executeJavaScript(source);
  const failures=[];win.webContents.on('console-message',event=>{if(event.level==='error')failures.push(event.message);});
  const result=await run(`(async()=>{
    const checks=[];const check=(value,name)=>{if(!value)throw new Error(name);checks.push(name);};
    check(document.querySelectorAll('.tab-panel').length===4,'four workspace views');
    $('key').value='test-key-not-real';$('model').value='test-model';$('customPrompt').value='Be concise';savePreferences();
    check(!localStorage.getItem('companion-preferences').includes('test-key-not-real'),'credentials never persisted');
    append('We agreed to launch on Tuesday. Maya will prepare the checklist.');$('meetingTitle').value='Launch review';$('meetingNotes').value='Decision: launch Tuesday.';
    $('saveMeeting').click();check(meetings().length===1,'meeting saved');
    $('historySearch').value='Maya';renderMeetings();check($('meetingList').textContent.includes('Launch review'),'transcript history search');
    $('useHistory').checked=true;check(workspaceContext().includes('Maya'),'saved context included');
    let payload;window.fetch=async(url,options)=>{payload=JSON.parse(options.body);return{ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'Suggested reply',annotations:[{type:'url_citation',url:'https://example.com/source',title:'Source'},{type:'url_citation',url:'javascript:alert(1)',title:'Unsafe'}]}]}]})};};
    $('smart').checked=true;await draft('say');
    check(payload.tools[0].type==='web_search','web research request');check(payload.input[0].content[0].text.includes('natural sentences'),'say action prompt');
    check($('sources').querySelectorAll('a').length===1,'safe source links');
    check($('reply').textContent==='Suggested reply','answer rendered');
    await draft('summary');check($('meetingNotes').value==='Suggested reply','generated notes editable');
    $('saveMeeting').click();check(meetings().length===1,'save updates existing meeting');
    window.confirm=()=>true;loadMeeting(meetings()[0]);check(notes.length===1 && $('meetingTitle').value==='Launch review','saved meeting resumes');
    $('clearChat').click();check(answers.length===0 && notes.length===1,'clear conversation preserves transcript');
    $('clear').click();check(notes.length===0 && !window.currentMeetingId,'new meeting clears session');
    return checks;
  })()`);
  assert.equal(failures.length,0,failures.join('\n'));
  const initialWidth=win.getSize()[0];
  await run("$('compact').click()");await new Promise(r=>setTimeout(r,200));assert.ok(Math.abs(win.getSize()[0]-620)<=4,'compact window size (DPI rounding allowed)');
  await run("$('compact').click()");await new Promise(r=>setTimeout(r,200));assert.ok(Math.abs(win.getSize()[0]-initialWidth)<=4,'expanded size restored');
  await new Promise(resolve=>{win.webContents.once('did-finish-load',resolve);win.webContents.reload();});
  assert.ok(await run("meetings().length===1 && $('key').value==='' && $('customPrompt').value==='Be concise'"),'history/preferences survive reload; key does not');
  await run("showTab('live');$('reply').textContent='You could say: Letâ€™s confirm the launch checklist owner and agree on a final review before Tuesday.';$('meetingTitle').value='Product launch review'");
  await fs.mkdir(path.join(__dirname,'test-results'),{recursive:true});
  await fs.writeFile(path.join(__dirname,'test-results','workspace-preview.png'),(await win.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({passed:true,checks:[...result,'compact and expand native window','persistence and credential clearing on reload'],contentProtection:win.isContentProtected()}));
};

