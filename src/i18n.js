import {supportedLanguage,preferredLanguage,languageSuggestion} from './locale.js';
const phrases={
 '自动演示 · 竖屏观看':'DEMO · WATCH ONLY',
 '横屏后可驾驶':'Rotate to landscape to drive','竖屏仅供观看 · 转为横屏即可驾驶':'Portrait is watch-only · Rotate to landscape to drive',
 '整车已在绿色区域内停稳':'The whole car stopped inside the green zone.','查看全部检查数值':'Show all check values',
 '视角 C':'View C','EXPERIMENT 001 / 冷气推进':'EXPERIMENT 001 / COLD GAS','地面，只是起点。':'Beyond the ground.','吸附 · 腾空 · 翻转 · 着陆':'SUCTION · LIFT · ROLL · LAND',
 'KM/H / 速度':'KM/H / SPEED','METERS / 高度':'METERS / HEIGHT','% / 储气量':'% / AIR RESERVE','SUCTION / 风扇吸附':'SUCTION / FAN',
 '加速 / 制动':'Accelerate / Brake','空中翻滚 / 转向':'Roll / Steer','俯仰':'Pitch','重来':'Retry','吸附':'Suction','喷气':'Thrust','制动':'Brake','加速':'Accelerate','姿态':'Attitude','吸附锁定':'Lock suction',
 '↻ 自动演示':'↻ Replay demo','接管驾驶 ↗':'Drive ↗','重新挑战 ↗':'Retry ↗','Ⅱ 暂停 P':'Ⅱ Pause P','▶ 继续 P':'▶ Resume P',
 '自动演示 · 驾驶按键接管':'DEMO · Use controls to drive','自动演示 · 已暂停':'DEMO · PAUSED','手动驾驶':'MANUAL',
 '01 / 加速进入坡道':'01 / Accelerate to ramp','02 / 风扇吸附 · 倒挂':'02 / Suction · Inverted','03 / 冷气推进 · 翻转':'03 / Thrust · Roll','04 / 制动中 · 停稳后判定':'04 / Braking · Awaiting stop','05 / 区域内停稳':'05 / Stopped inside zone','任务中断':'ATTEMPT ENDED',
 '着陆成功 / TOUCHDOWN':'SUCCESS / TOUCHDOWN','着陆失败 · 原因明细':'LANDING FAILED · CHECKS','着陆失败 / TRY AGAIN':'LANDING FAILED / TRY AGAIN','自动演示完成':'Demo complete','任务完成 · ':'Completed · ',' 分':' points',
 '按 R 重来，或接管驾驶':'Press R to retry, or take control','保持吸附通过坡道，空中调整姿态':'Keep suction through the ramp; level the car in flight','按 R 立即重试':'Press R to retry',
 '着陆检查记录 · R 重试 / 点击「重新挑战」':'Landing report · R or Retry to restart','触地后滑出绿色区域：必须整车停稳在线内。':'Slid outside after touchdown. The whole car must stop inside the green zone.',
 '撞到坡道 / COLLISION\n车身已被坡道阻挡\n按 R 重试':'RAMP COLLISION\nThe ramp blocked the car.\nPress R to retry',
 '着陆检查 / 实时':'LANDING / LIVE','坡道吸附':'Ramp suction','倒挂段曾松开吸附':'Suction released on inverted ramp','完整通过':'Completed','尚未完整通过':'Not completed','按住 Shift 通过整个倒挂段':'Hold Shift (or lock suction) through the inverted section',
 '俯仰偏差':'Pitch error','翻滚偏差':'Roll error','前后落点':'Longitudinal position','左右落点':'Lateral position','垂直速度':'Vertical speed','需 < ':'limit < ','需 ≤ ':'limit ≤ ',
 '用 ↑ ↓ 调整车头':'Use ↑ ↓ or the stick to level the nose','用 ← → 把车轮转向地面':'Use ← → or the stick to level the wheels','车身范围 ':'Car extent ',' / 绿区 ':' / green zone ',
 '落得太早，需要飞得更远':'Landed short. Travel farther.','车身超出绿区远端，减少滞空时间':'Overshot. Reduce time in the air.','车身最外侧距中心 ':'Outer edge from center ',
 '用 A D 对准着陆区，整车需在线内':'Use A / D to align the whole car inside the zone','先调正车身，再点按空格减缓下降':'Level the car, then pulse thrust to slow descent',
 '预计触地点':'PREDICTED CONTACT','实际触地点':'ACTUAL CONTACT','中心 / TARGET':'CENTER / TARGET',
 '横屏驾驶视野更开阔，也可继续竖屏操作。':'Rotate for a wider driving view, or keep playing in portrait.','知道了':'Got it','关闭':'Close','概念场景 · 简化游戏物理 · 非车辆性能模拟':'Concept scene · Simplified game physics',
};
const replacements=Object.entries(phrases).sort((a,b)=>b[0].length-a[0].length);
const browserLanguages=navigator.languages||[navigator.language];
let stored;try{stored=localStorage.getItem('roadster-language')}catch{}
const requested=supportedLanguage(new URLSearchParams(location.search).get('lang')||'');
const routeLanguage=supportedLanguage(location.pathname.split('/')[1]);
export let language=routeLanguage||requested||(['zh','en'].includes(stored)?stored:preferredLanguage(browserLanguages)||'en');
export function t(value){let text=String(value);if(language==='zh')return text;if(phrases[text])return phrases[text];for(const [zh,en] of replacements)text=text.split(zh).join(en);return text}
export function applyLanguage(){document.documentElement.lang=language==='zh'?'zh-CN':'en';document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));document.getElementById('language').value=language;}
export function setLanguage(next){if(!['zh','en'].includes(next))return;try{localStorage.setItem('roadster-language',next)}catch{}if(routeLanguage&&next!==routeLanguage){location.assign(location.pathname.replace(/^\/(zh|en)(?=\/)/,`/${next}`));return}language=next;try{localStorage.setItem('roadster-language',next)}catch{}applyLanguage();document.getElementById('language-notice').hidden=true;window.dispatchEvent(new Event('languagechange'));}
export function initLanguage(){
 applyLanguage();
 document.getElementById('language').onchange=e=>setLanguage(e.target.value);
 const notice=document.getElementById('language-notice');
 const suggestion=languageSuggestion(language,browserLanguages);
 let dismissed=false;const key=`roadster-language-notice:${language}:${suggestion}`;
 try{dismissed=sessionStorage.getItem(key)==='dismissed'}catch{}
 if(suggestion&&!dismissed){
  notice.hidden=false;
  document.getElementById('language-message').textContent=suggestion==='zh'?'检测到你的浏览器偏好中文，当前显示 English。可切换为简体中文。':'Your browser prefers English. This page is in Chinese. Switch to English?';
  const button=document.getElementById('switch-language');button.textContent=suggestion==='zh'?'切换为简体中文':'Switch to English';
  button.onclick=()=>{try{sessionStorage.setItem(key,'dismissed')}catch{}setLanguage(suggestion)};
 }
 document.getElementById('dismiss-language').onclick=()=>{notice.hidden=true;try{sessionStorage.setItem(key,'dismissed')}catch{}};
}
