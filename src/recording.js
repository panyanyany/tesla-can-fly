// Opt-in capture utility: records the actual WebGL scene, without browser chrome.
export function createRecorder({renderer,restart,getState,language}){
 if(!new URLSearchParams(location.search).has('record'))return {active:false,frame(){}};
 const zh=language==='zh',portrait=innerHeight>innerWidth;
 const canvas=document.createElement('canvas');canvas.width=portrait?720:1280;canvas.height=portrait?1280:720;
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const button=document.createElement('button');button.id='record-start';button.textContent=zh?'开始录制中文演示':'Record English demo';
 Object.assign(button.style,{position:'fixed',zIndex:100,top:'45%',left:'50%',transform:'translate(-50%,-50%)',padding:'20px',background:'#b8f268',color:'#14200c',border:'none',font:'bold 18px sans-serif',cursor:'pointer'});document.body.append(button);
 const api={active:false,frame};let recorder,stream,chunks=[],started=0,landedAt=0;
 button.onclick=async()=>{
  try{
   await document.fonts.ready;
   if(!canvas.captureStream||!window.MediaRecorder)throw Error('MediaRecorder unavailable');
   chunks=[];started=performance.now();landedAt=0;restart();api.active=true;
   stream=canvas.captureStream(30);
   const mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
   recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8_000_000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onstop=()=>{api.active=false;stream.getTracks().forEach(track=>track.stop());const blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`tesla-can-fly-${language}-${portrait?'portrait':'landscape'}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);button.textContent=zh?'录制完成 · 再录一次':'Recording complete · Record again';button.hidden=false;};
   frame();recorder.start(1000);button.hidden=true;
  }catch(e){api.active=false;button.textContent=e.message;button.hidden=false;}
 };
 function frame(){
  if(!api.active)return;
  const s=getState();ctx.drawImage(renderer.domElement,0,0,w,h);
  const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#06101fdd');gradient.addColorStop(.28,'#06101f00');gradient.addColorStop(.65,'#06101f00');gradient.addColorStop(1,'#06101fee');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const pad=portrait?40:52;
  ctx.fillStyle='#b8f268';ctx.font=`700 ${portrait?21:17}px sans-serif`;ctx.fillText('T /',pad,portrait?62:53);
  ctx.fillStyle='#eef4fa';ctx.font=`700 ${portrait?32:25}px sans-serif`;ctx.fillText(zh?'特斯拉能飞':'TESLA CAN FLY',pad+54,portrait?65:55);
  ctx.strokeStyle='#ffffff30';ctx.beginPath();ctx.moveTo(pad,portrait?89:78);ctx.lineTo(w-pad,portrait?89:78);ctx.stroke();
  const names=zh?{run:'01 / 加速进入坡道',ramp:'02 / 风扇吸附 · 倒挂',air:'03 / 腾空 · 姿态控制',braking:'04 / 精准着陆',landed:'05 / 着陆成功',crashed:'挑战结束'}:{run:'01 / LAUNCH RUN',ramp:'02 / SUCTION · INVERTED',air:'03 / AIRBORNE · ATTITUDE CONTROL',braking:'04 / PRECISION LANDING',landed:'05 / TOUCHDOWN',crashed:'ATTEMPT ENDED'};
  ctx.fillStyle='#b8f268';ctx.font=`500 ${portrait?23:18}px sans-serif`;ctx.fillText(names[s.state]||'',pad,portrait?133:117);
  const captions=zh?{run:'地面，只是起点。',ramp:'贴住坡道，驶向倒挂。',air:'一罐空气，掌控腾空。',braking:'对准绿区，平稳落地。',landed:'漂亮落地。'}:{run:'Beyond the ground.',ramp:'Grip the ramp. Go upside down.',air:'One air reserve. Full control.',braking:'Line up. Touch down. Stop inside.',landed:'Stick the landing.'};
  ctx.fillStyle='#f4f7fa';ctx.font=`500 ${portrait?36:30}px sans-serif`;ctx.fillText(captions[s.state]||'',pad,h-(portrait?200:153));
  const stats=[[String(Math.round(s.speed)).padStart(3,'0'),zh?'KM/H 速度':'KM/H SPEED'],[Math.max(0,s.y).toFixed(1),zh?'M 高度':'M HEIGHT'],[String(Math.round(s.gas))+'%',zh?'储气量':'AIR RESERVE']];
  stats.forEach(([value,label],i)=>{const x=pad+i*(portrait?215:195);ctx.fillStyle='#f1f6fc';ctx.font=`600 ${portrait?48:40}px monospace`;ctx.fillText(value,x,h-(portrait?112:77));ctx.fillStyle='#9eafbf';ctx.font=`500 ${portrait?16:12}px sans-serif`;ctx.fillText(label,x,h-(portrait?78:49));});
  const now=performance.now();if(s.state==='landed'&&!landedAt)landedAt=now;
  if(recorder?.state==='recording'&&((landedAt&&now-landedAt>2600)||now-started>45000))recorder.stop();
 }
 return api;
}
