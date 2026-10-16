export function initTouch({press,release,clear,begin=()=>{}}){
 const active=new Map();
 function end(e){const key=active.get(e.pointerId);if(key){active.delete(e.pointerId);if(![...active.values()].includes(key))release(key)}e.currentTarget.classList.remove('held');}
 for(const button of document.querySelectorAll('[data-hold]')){button.onpointerdown=e=>{e.preventDefault();press(button.dataset.hold);button.setPointerCapture(e.pointerId);active.set(e.pointerId,button.dataset.hold);button.classList.add('held')};button.onpointerup=end;button.onpointercancel=end;button.onlostpointercapture=end;}
 const fan=document.getElementById('touch-fan');let locked=false;
 fan.onclick=()=>{const next=!locked;if(next)press('ShiftLeft');else release('ShiftLeft');locked=next;fan.setAttribute('aria-pressed',String(locked));};
 const pad=document.getElementById('joystick'),stick=document.getElementById('stick');let pointer=null;const arrows=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
 function move(e){if(e.pointerId!==pointer)return;const r=pad.getBoundingClientRect(),dx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.4))),dy=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.4)));arrows.forEach(release);if(dx<-.22)press('ArrowLeft');if(dx>.22)press('ArrowRight');if(dy<-.22)press('ArrowUp');if(dy>.22)press('ArrowDown');stick.style.transform=`translate(${dx*26}px,${dy*26}px)`;}
 pad.onpointerdown=e=>{e.preventDefault();begin();pointer=e.pointerId;pad.setPointerCapture(pointer);move(e)};pad.onpointermove=move;
 function endStick(e){if(e.pointerId!==pointer)return;pointer=null;arrows.forEach(release);stick.style.transform='';}
 pad.onpointerup=endStick;pad.onpointercancel=endStick;pad.onlostpointercapture=endStick;
 const reset=()=>{active.clear();locked=false;fan.setAttribute('aria-pressed','false');pointer=null;stick.style.transform='';document.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));clear();};
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 return reset;
}
