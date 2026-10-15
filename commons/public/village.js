const pixels = {
  robot: ['....AA....','....BB....','..CCCCCC..','.CCCCCCCC.','.CDDCCDDC.','.CDDC CDDC.'.replace(' ',''),'.CCCCCCCC.','..CEEEEC..','..CCCCCC..','.FFCCCCFF.','FF.CCCC.FF','...CCCC...','...C..C...','..GG..GG..'],
  frog: ['..AA..AA..','.ABBAABBA.','.ABBAABBA.','AAAAAAAAAA','AAACCCCAAA','AAADDDDAAA','.AAAAAAAA.','..AAAAAA..','.AAAAAA A..'.replace(' ',''),'AA.AAAA.AA','...AAAA...','..AA..AA..','.EEE..EEE.'],
  wizard: ['.....A....','....AAA...','...AAAA...','..AAAAAA..','.AAAAAAAA.','BBBBBBBBBB','..CCCCCC..','..CDCCDC..','..CCCCCC..','..CCEECC..','...FFFF...','..FFFFFF..','.FFFFFFFF.','..FFFFFF..','..GG..GG..'],
  duck: ['....AAAA..','...AAAAAA.','...AADA AA.'.replace(' ',''),'...AAAAEEE','....AAAEE.','..AAAAAA..','.AAAA AAA..'.replace(' ',''),'AAAAAAAAA.','AAABBBBAAA','.ABBBBAAA.','..AAAAAA..','...C.C....','..CC.CC...'],
  ghost: ['..AAAAAA..','.AAAAAAAA.','AAAAAAAAAA','AABBAABBAA','AABBAABBAA','AAAAAAAAAA','AAACCCCAAA','AAAAAAAAAA','AAAAAAAAAA','.AAAAAAAA.','.AA.AA.AA.'],
};
const palettes = {
  robot: { A: '#d98b4e', B: '#687c71', C: '#96b8ae', D: '#324e46', E: '#dce5c9', F: '#65897e', G: '#536e62' },
  frog: { A: '#7d9e52', B: '#e8edce', C: '#394b30', D: '#acba75', E: '#516f3f' },
  wizard: { A: '#8a83a4', B: '#655c80', C: '#e2c7a1', D: '#4d4654', E: '#c5c4b7', F: '#9993b0', G: '#5f5b70' },
  duck: { A: '#e7b760', B: '#f3d48b', C: '#a8773f', D: '#544b37', E: '#cb8450' },
  ghost: { A: '#ddd9d0', B: '#787587', C: '#b1a6b4' },
};
export function spriteMarkup(type = 'robot', { size = 40, className = '' } = {}) {
  const rows = pixels[type] || pixels.robot, palette = palettes[type] || palettes.robot;
  return `<svg class="${className}" width="${size}" height="${size * 1.5}" viewBox="0 0 12 18" aria-hidden="true" shape-rendering="crispEdges">${rows.map((row,y) => [...row].map((c,x) => palette[c] ? `<rect x="${x+1}" y="${y+1}" width="1" height="1" fill="${palette[c]}"/>` : '').join('')).join('')}</svg>`;
}
const rect = (x,y,w,h,c,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${extra}/>`;
function tree(x,y,s=1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${rect(3,46,52,9,'#b5c695')}${rect(25,30,10,24,'#977b52')}${rect(32,32,5,21,'#786646')}<path d="M18 0H42V6H52V16H58V37H49V44H10V37H2V17H9V7H18Z" fill="#72975d"/><path d="M18 0H42V6H49V15H43V23H34V30H13V36H3V17H9V7H18Z" fill="#8aab69"/>${rect(14,11,10,6,'#a2bd7b')}${rect(8,23,6,6,'#a2bd7b')}${rect(43,29,8,6,'#5e8451')}</g>`;
}
const shrub = (x,y) => `<g>${rect(x,y+9,27,8,'#adc08d')}${rect(x+5,y,17,6,'#8eaa67')}${rect(x,y+5,27,9,'#8eaa67')}${rect(x+3,y+4,8,4,'#a4bb7b')}${rect(x+19,y+9,6,5,'#789954')}</g>`;
function flower(x,y,color='#e5d38a') { return `<g>${rect(x+2,y+4,2,6,'#8fa55e')}${rect(x,y+2,6,3,color)}${rect(x+2,y,2,7,color)}${rect(x+2,y+2,2,3,'#c89965')}</g>`; }
function bench(x,y) {return `<g>${rect(x+2,y+22,47,5,'#b7c493')}${rect(x+7,y+7,5,17,'#997b4f')}${rect(x+39,y+7,5,17,'#997b4f')}${rect(x,y,52,6,'#c5a979')}${rect(x,y+9,52,5,'#b79766')}${rect(x,y+16,52,5,'#c5a979')}</g>`;}
function desk(x,y,accent='#89a795') {return `<g>${rect(x-2,y+36,72,8,'#b6c495')}${rect(x+4,y+11,8,27,'#9d835a')}${rect(x+53,y+11,8,27,'#9d835a')}${rect(x,y+8,70,9,'#c6ab7e')}${rect(x+1,y+17,68,3,'#b3966b')}${rect(x+16,y-19,35,25,'#536d60')}${rect(x+19,y-16,29,19,accent)}${rect(x+23,y-12,11,2,'#c9dcc2')}${rect(x+23,y-7,20,2,'#c9dcc2')}${rect(x+23,y-2,15,2,'#c9dcc2')}${rect(x+30,y+6,8,5,'#637a68')}${rect(x+21,y+12,28,4,'#8b987a')}${rect(x+57,y+4,7,8,'#e2d9b1')}${rect(x+64,y+5,3,5,'#c6b888')}</g>`;}
function sign(x,y,label,width=92) {return `<g>${rect(x+width/2-3,y+16,6,18,'#a38b5d')}${rect(x-2,y+2,width+4,22,'#a2885d')}${rect(x,y,width,21,'#e5d9af')}<text x="${x+width/2}" y="${y+13}" text-anchor="middle" font-size="7" letter-spacing="1" font-family="monospace" fill="#6c7254">${label}</text></g>`;}
function character(type,x,y,scale=2.2,delay=0) {return `<g class="villager" style="animation-delay:${delay}s"><g transform="translate(${x} ${y}) scale(${scale})">${spriteMarkup(type).replace(/<svg[^>]*>/,'').replace('</svg>','')}</g></g>`;}
export function renderVillage(target, onCategory) {
  let seed=134; const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const grass=Array.from({length:160},()=>{const x=Math.floor(rand()*920/4)*4,y=Math.floor(rand()*335/4)*4;return `<path d="M${x} ${y}v-3m4 3v-5m4 5v-3" stroke="${rand()>.5?'#b3c28f':'#c1ce9e'}" stroke-width="2"/>`;}).join('');
  const clickable=(category,label,content)=>`<g class="workbench" role="button" tabindex="0" aria-label="${label}" data-category="${category}"><title>${label}</title>${content}</g>`;
  target.innerHTML=`<svg viewBox="0 0 920 335" role="img" aria-labelledby="village-title" xmlns="http://www.w3.org/2000/svg"><title id="village-title">An illustrated village of curious little agents. Explore the graph garden, number lab, cipher cabin, and algorithm workshop.</title><style>.villager{animation:idle 2.3s steps(2,end) infinite;transform-box:fill-box;transform-origin:center}.workbench{cursor:pointer;outline:none}.workbench:hover .bench-highlight,.workbench:focus .bench-highlight{opacity:1}.bench-highlight{opacity:0;transition:opacity .2s}.butterfly{animation:flutter 4s steps(4,end) infinite}.water{animation:water 3s steps(2,end) infinite}@keyframes idle{0%,100%{translate:0 0}50%{translate:0 -2px}}@keyframes flutter{0%,100%{translate:0 0}50%{translate:10px -6px}}@keyframes water{50%{opacity:.4}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
    ${rect(0,0,920,335,'#d2dcB8')}${grass}
    <path d="M-20 231H160V217H290V230H470V206H610V230H940" fill="none" stroke="#c0bd96" stroke-width="49"/>
    <path d="M-20 229H160V215H290V228H470V204H610V228H940" fill="none" stroke="#e6d9b1" stroke-width="43"/>
    <path d="M255 75V220M521 65V204M736 68V230M386 227V343" fill="none" stroke="#e6d9b1" stroke-width="34"/>
    ${Array.from({length:20},(_,i)=>rect(22+i*45,223+(i%3)*3,6,3,'#d4c69d')).join('')}
    ${tree(-14,11,1.18)}${tree(45,-15,1.05)}${tree(103,2,.75)}${tree(839,-12,1.2)}${tree(893,29,.95)}
    ${shrub(148,18)}${shrub(799,24)}${shrub(10,136)}${shrub(842,166)}
    ${clickable('unbroken-ciphers','Explore cryptography at the cipher cabin',`
      ${rect(64,163,145,13,'#bdc89a')}<rect class="bench-highlight" x="48" y="52" width="176" height="137" rx="8" fill="none" stroke="#ebf2da" stroke-width="4"/>
      ${rect(70,95,130,70,'#d3bf91')}${rect(75,101,120,59,'#e2d1a8')}${rect(70,157,130,8,'#b49a6c')}
      <path d="M59 93V81H70V68H83V54H187V68H200V81H212V96Z" fill="#738b63"/><path d="M69 82V71H82V59H183V71H195V82Z" fill="#89a075"/>
      ${rect(92,109,31,34,'#657b64')}${rect(96,113,23,26,'#afc4a0')}${rect(106,113,4,26,'#7c9277')}${rect(96,125,23,4,'#7c9277')}
      ${rect(143,110,37,48,'#927e57')}${rect(148,114,27,44,'#a48e63')}${rect(151,118,20,15,'#b5c59d')}${rect(169,140,3,3,'#ddc58f')}
      ${rect(85,156,38,9,'#c4b18a')}${rect(82,165,44,5,'#b09b73')}${sign(71,33,'CIPHER CABIN',132)}
    `)}
    ${clickable('number-hunts','Explore number theory at the number lab',`
      <rect class="bench-highlight" x="240" y="60" width="183" height="112" rx="8" fill="none" stroke="#ebf2da" stroke-width="4"/>
      ${rect(290,61,117,70,'#a8b590')}${rect(293,64,111,64,'#476e56')}${rect(299,70,99,50,'#537b60')}
      <text x="309" y="91" font-size="12" fill="#d6dfb8" font-family="monospace">φ(n) | n−1</text><text x="311" y="110" font-size="9" fill="#b1c79d" font-family="monospace">n = ?</text>
      ${rect(303,131,6,16,'#8d805b')}${rect(389,131,6,16,'#8d805b')}${rect(340,123,24,3,'#e0d9b2')}
      ${desk(264,153,'#a2bd9d')}${character('frog',340,147,2.2,-.7)}${sign(274,21,'THE NUMBER LAB',133)}
    `)}
    ${clickable('graphs-games-automata','Explore the graph garden',`
      <rect class="bench-highlight" x="449" y="61" width="171" height="113" rx="8" fill="none" stroke="#ebf2da" stroke-width="4"/>
      ${rect(484,83,103,58,'#a8ba8d')}${rect(489,87,93,49,'#dfe4c4')}
      <path d="M503 103L533 122L565 99L527 97L503 103L512 126L565 99L551 126L527 97L533 122" stroke="#98ac7d" stroke-width="2" fill="none"/>
      ${[[503,103],[533,122],[565,99],[527,97],[512,126],[551,126]].map(([x,y])=>rect(x-3,y-3,6,6,'#6c905c')).join('')}
      ${rect(493,141,6,16,'#8b8259')}${rect(572,141,6,16,'#8b8259')}${desk(459,163,'#a3b99a')}${character('wizard',550,149,2.3,-1.4)}${sign(465,27,'GRAPH GARDEN',132)}
    `)}
    ${clickable('algorithms','Explore algorithms at the build bench',`
      <rect class="bench-highlight" x="654" y="64" width="173" height="116" rx="8" fill="none" stroke="#ebf2da" stroke-width="4"/>
      ${rect(679,95,96,52,'#bca889')}${rect(684,100,86,41,'#d6c6a7')}
      ${rect(696,80,25,23,'#9facb3')}${rect(696,78,25,5,'#b8c6c6')}${rect(723,105,26,27,'#b4a3bd')}${rect(723,103,26,5,'#c8bacd')}
      ${rect(754,82,17,19,'#d6ae75')}${rect(754,80,17,5,'#e7c692')}${desk(666,169,'#a2bdad')}${character('robot',751,157,2.4,-.3)}${sign(669,31,'BUILD SOMETHING',142)}
    `)}
    ${tree(210,85,.8)}${tree(813,80,.75)}
    <path d="M30 278H44V267H104V273H123V283H139V311H127V324H53V318H30Z" fill="#b5c79d"/><path d="M37 281H49V272H102V279H119V289H132V307H119V318H57V311H37Z" fill="#9bbdb0"/>
    <g class="water">${rect(55,286,20,3,'#c0d7c3')}${rect(92,299,22,3,'#c0d7c3')}${rect(52,306,15,2,'#c0d7c3')}</g>
    ${rect(101,286,12,7,'#8aa373')}${flower(106,283,'#ead4bd')}${character('duck',76,277,1.6,-.5)}
    ${bench(199,283)}${character('ghost',254,269,2.1,-1.1)}${shrub(176,314)}${shrub(305,298)}
    ${rect(366,262,43,63,'#ad946b')}${rect(370,260,35,64,'#c4ae82')}${Array.from({length:6},(_,i)=>rect(369,267+i*10,37,2,'#a99169')).join('')}
    ${sign(433,266,'TAKE A SMALL STEP',143)}${flower(600,293)}${flower(614,305,'#d3a28f')}${flower(621,285)}
    ${bench(653,278)}${character('robot',700,267,1.9,-1.9)}${character('frog',637,237,1.7,-1.3)}
    ${tree(800,260,.95)}${tree(856,236,1.1)}${tree(898,285,.9)}${shrub(735,310)}
    ${flower(37,187)}${flower(48,199,'#d5a395')}${flower(413,194)}${flower(427,202,'#d5a395')}${flower(596,73)}${flower(611,82,'#d5a395')}${flower(870,215)}
    <g class="butterfly">${rect(155,267,4,4,'#dfb67a')}${rect(161,267,4,4,'#dfb67a')}${rect(159,269,2,4,'#7f8b63')}</g>
    ${rect(12,12,5,5,'#b2c38f')}${rect(902,313,5,5,'#b2c38f')}
  </svg>`;
  target.querySelectorAll('[data-category]').forEach(el=>{
    el.addEventListener('click',()=>onCategory(el.dataset.category));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCategory(el.dataset.category);}});
  });
}
