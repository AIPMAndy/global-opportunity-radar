/* Global Opportunity Radar v2. No third-party JS or map CDN. */
(function(){
"use strict";
const $ = id => document.getElementById(id);
const C = [
["USA","美国","United States","NORTH AMERICA",39,-98,"AI 研发投入怎样转化为企业客户愿意持续购买的产品？"],
["VNM","越南","Vietnam","SOUTHEAST ASIA",16,108,"产业链迁移带来哪些可验证的软件、物流与本地服务需求？"],
["CHN","中国内地","Mainland China","EAST ASIA",35,104,"当获客成本上升，哪些 AI 服务能明确改善企业利润？"],
["HKG","中国香港","Hong Kong SAR","EAST ASIA",22.3,114.2,"国际交易与专业服务的哪部分需求正在增加？"],
["SGP","新加坡","Singapore","SOUTHEAST ASIA",1.35,103.8,"区域总部的技术预算如何流向可交付的服务？"],
["TWN","中国台湾","Taiwan","EAST ASIA",23.7,121,"半导体与 AI 计算供应链的增量机会在哪里？"],
["JPN","日本","Japan","EAST ASIA",36,138,"老龄化与企业自动化能催生哪些稳定付费场景？"],
["KOR","韩国","South Korea","EAST ASIA",36,128,"半导体、制造和内容产业的价值链正在如何改变？"],
["IND","印度","India","SOUTH ASIA",22,78,"软件、制造与消费市场中有哪些尚未被满足的需求？"],
["IDN","印度尼西亚","Indonesia","SOUTHEAST ASIA",-2,118,"年轻人口与数字服务能否支撑可持续客单价？"],
["MYS","马来西亚","Malaysia","SOUTHEAST ASIA",4,102,"数据中心与制造业投资怎样传导到本地中小企业？"],
["THA","泰国","Thailand","SOUTHEAST ASIA",15,101,"旅游、零售和制造的数字化投资集中在哪里？"],
["PHL","菲律宾","Philippines","SOUTHEAST ASIA",12,123,"服务外包与 AI 的结合创造哪些新岗位和业务？"],
["AUS","澳大利亚","Australia","OCEANIA",-25,134,"高人工成本的行业有哪些自动化采购机会？"],
["NZL","新西兰","New Zealand","OCEANIA",-41,174,"相对较小的国内市场适合哪类可跨境产品？"],
["DEU","德国","Germany","EUROPE",51,10,"工业企业采用 AI 时最迫切的成本和效率问题是什么？"],
["GBR","英国","United Kingdom","EUROPE",54,-2,"金融及专业服务愿为哪些 AI 产品付费？"],
["FRA","法国","France","EUROPE",46,2,"科研成果与本地商业采购之间有哪些鸿沟？"],
["NLD","荷兰","Netherlands","EUROPE",52,5,"港口、物流和芯片产业中的新需求来自哪里？"],
["CHE","瑞士","Switzerland","EUROPE",47,8,"高附加值专业服务如何结合 AI 做更深的交付？"],
["ARE","阿联酋","United Arab Emirates","MIDDLE EAST",24,54,"数字基础设施投入能否转为长期经营收入？"],
["SAU","沙特阿拉伯","Saudi Arabia","MIDDLE EAST",24,45,"大型项目怎样形成可持续的本地服务市场？"],
["BRA","巴西","Brazil","SOUTH AMERICA",-14,-52,"支付、零售和数字消费的真实增长在哪里？"],
["MEX","墨西哥","Mexico","NORTH AMERICA",23,-102,"近岸制造如何拉动本地供应链与企业软件需求？"],
["CAN","加拿大","Canada","NORTH AMERICA",56,-106,"研究与工程人才优势如何形成可持续的商业产品？"]
];
const LABELS={gdp:"NY.GDP.MKTP.KD.ZG",inflation:"FP.CPI.TOTL.ZG",unemployment:"SL.UEM.TOTL.ZS",fdi:"BX.KLT.DINV.WD.GD.ZS",income:"NY.GDP.PCAP.CD"};
const RANK=["USA","VNM","CHN","HKG","SGP","IND","JPN","DEU","GBR","MYS"];
const LAND_FALLBACK=[
[[-168,69],[-158,60],[-148,59],[-139,60],[-129,51],[-125,42],[-117,32],[-107,29],[-98,24],[-89,22],[-83,26],[-80,32],[-72,43],[-66,49],[-57,51],[-62,56],[-78,60],[-82,69],[-99,72],[-129,70],[-155,72],[-168,69]],
[[-81,12],[-73,11],[-64,11],[-51,5],[-46,-1],[-35,-7],[-38,-15],[-43,-23],[-51,-33],[-56,-38],[-67,-53],[-74,-48],[-72,-33],[-70,-18],[-77,-8],[-81,12]],
[[-10,35],[5,37],[21,33],[34,32],[43,12],[51,11],[47,0],[41,-11],[35,-22],[26,-34],[17,-34],[12,-20],[9,-5],[-5,5],[-17,18],[-10,35]],
[[-11,36],[-7,43],[8,51],[20,57],[30,70],[47,69],[67,73],[91,76],[110,72],[145,60],[166,61],[180,57],[160,48],[140,47],[130,33],[122,20],[110,11],[106,1],[99,5],[96,17],[82,9],[70,22],[57,26],[50,30],[40,40],[30,42],[20,37],[10,36],[-11,36]],
[[112,-12],[125,-14],[136,-13],[152,-24],[154,-29],[146,-39],[130,-35],[115,-34],[112,-22],[112,-12]],
[[-52,60],[-45,60],[-41,64],[-42,70],[-51,80],[-60,83],[-63,78],[-54,69],[-52,60]],
[[46,-13],[50,-13],[49,-25],[45,-26],[43,-20],[46,-13]],
[[129,31],[140,36],[144,43],[142,45],[136,36],[129,31]],
[[95,5],[106,-6],[117,-7],[117,0],[109,5],[95,5]],
[[130,-1],[142,-1],[151,-9],[141,-9],[130,-1]]
];
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const isLink=url=>typeof url==="string"&&/^https:\/\/[a-z0-9.-]+\//i.test(url);
const cleanLink=(value,fallback)=>isLink(value)?value:fallback;
const format=(v,unit)=>v===null||v===undefined||Number.isNaN(Number(v))?"—":Number(v).toLocaleString("zh-CN",{maximumFractionDigits:2})+(unit||"");
const shortNum=value=>!Number.isFinite(Number(value))?"—":new Intl.NumberFormat("zh-CN",{notation:"compact",maximumFractionDigits:1}).format(Number(value));
const countriesByCode=Object.fromEntries(C.map(c=>[c[0],c]));
let selected=C[0],snapshot=null,requestSerial=0;

class CanvasGlobe {
 constructor(canvas,onSelect) {
  this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:true});
  this.onSelect=onSelect;this.lon=101;this.lat=22;this.zoom=1;this.paths=LAND_FALLBACK;
  this.drag=null;this.lastInput=0;this.active=true;this.lastTick=0;this.lastFrame=0;this.visiblePoints=[];
  this.canvas.setAttribute("tabindex","0");
  this.canvas.setAttribute("aria-label","可交互地球。使用左右方向键旋转，拖拽或点击国家光点进行选择。");
  this.install();
  this.resize();
  if("ResizeObserver" in window)new ResizeObserver(()=>this.resize()).observe(this.canvas);
  else window.addEventListener("resize",()=>this.resize());
  requestAnimationFrame(t=>this.loop(t));
 }
 install(){
  this.canvas.addEventListener("pointerdown",e=>{this.drag={x:e.clientX,y:e.clientY,lon:this.lon,lat:this.lat,moved:false};this.canvas.setPointerCapture(e.pointerId);this.lastInput=performance.now()});
  this.canvas.addEventListener("pointermove",e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>5)this.drag.moved=true;this.lon=this.drag.lon-dx*.32;this.lat=Math.max(-70,Math.min(70,this.drag.lat+dy*.25));this.lastInput=performance.now();this.draw()});
  this.canvas.addEventListener("pointerup",e=>{if(!this.drag)return;const moved=this.drag.moved;this.drag=null;if(!moved){const box=this.canvas.getBoundingClientRect();const x=(e.clientX-box.left),y=(e.clientY-box.top);let hit=null,min=24;for(const p of this.visiblePoints){const d=Math.hypot(x-p.x,y-p.y);if(d<min){hit=p.country;min=d}}if(hit)this.onSelect(hit[0])}this.lastInput=performance.now()});
  this.canvas.addEventListener("pointercancel",()=>{this.drag=null});
  this.canvas.addEventListener("wheel",e=>{e.preventDefault();this.zoom=Math.max(.8,Math.min(1.23,this.zoom+(e.deltaY<0?.06:-.06)));this.lastInput=performance.now();this.draw()},{passive:false});
  this.canvas.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();this.lon+=e.key==="ArrowLeft"?-12:e.key==="ArrowRight"?12:0;this.lat=Math.max(-70,Math.min(70,this.lat+(e.key==="ArrowUp"?8:e.key==="ArrowDown"?-8:0)));this.lastInput=performance.now();this.draw()}});
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect();
  this.w=Math.max(220,rect.width||520);this.h=Math.max(220,rect.height||520);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);
  this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw()
 }
 lookAt(c){
  this.lon=c[5];this.lat=Math.max(-55,Math.min(65,c[4]));this.lastInput=performance.now();this.draw()
 }
 reset(){this.zoom=1;this.lon=101;this.lat=22;this.lastInput=performance.now();this.draw()}
 project(lon,lat){
  const a=lat*Math.PI/180,b=(lon-this.lon)*Math.PI/180,cl=this.lat*Math.PI/180;
  const z=Math.sin(a)*Math.sin(cl)+Math.cos(a)*Math.cos(cl)*Math.cos(b);
  const x=Math.cos(a)*Math.sin(b),y=Math.sin(a)*Math.cos(cl)-Math.cos(a)*Math.cos(b)*Math.sin(cl);
  return{x:this.cx+x*this.r,y:this.cy-y*this.r,z}
 }
 drawLand(){
  const ctx=this.ctx;
  ctx.fillStyle="rgba(167,217,237,.28)";ctx.strokeStyle="rgba(203,239,255,.43)";ctx.lineWidth=.9;
  for(const region of this.paths){
   if(!region||region.length<3)continue;
   const p=region.map(pt=>this.project(pt[0],pt[1]));
   let chain=[];const chains=[];
   const closeChain=()=>{if(chain.length>2)chains.push(chain);chain=[]};
   for(let i=0;i<p.length;i++){
    const a=p[i];const b=p[(i+1)%p.length],vis=a.z>0,visB=b.z>0;
    if(vis)chain.push(a);
    if(vis!==visB){
     const ratio=Math.abs(a.z)/(Math.abs(a.z)+Math.abs(b.z));
     const edge={x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio,z:0};
     chain.push(edge);closeChain();
     if(visB)chain=[edge]
    }
   }
   closeChain();
   if(p.every(pt=>pt.z>0))chains.push(p);
   for(const seg of chains){
    if(seg.length<3)continue;
    ctx.beginPath();ctx.moveTo(seg[0].x,seg[0].y);
    for(let j=1;j<seg.length;j++)ctx.lineTo(seg[j].x,seg[j].y);
    ctx.closePath();ctx.fill();ctx.stroke();
   }
  }
 }
 drawGrid(){
  const ctx=this.ctx;ctx.lineWidth=.65;ctx.strokeStyle="rgba(181,219,253,.14)";
  const trace=points=>{ctx.beginPath();let started=false;for(const [lon,lat] of points){const p=this.project(lon,lat);if(p.z>0){if(!started){ctx.moveTo(p.x,p.y);started=true}else ctx.lineTo(p.x,p.y)}else started=false}ctx.stroke()};
  for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lon=-180;lon<=180;lon+=3)pts.push([lon,lat]);trace(pts)}
  for(let lon=-180;lon<180;lon+=30){const pts=[];for(let lat=-87;lat<=87;lat+=3)pts.push([lon,lat]);trace(pts)}
 }
 draw(){
  if(!this.ctx||!this.w)return;
  const ctx=this.ctx,w=this.w,h=this.h;this.cx=w/2;this.cy=h/2;this.r=Math.min(w,h)*.39*this.zoom;
  ctx.clearRect(0,0,w,h);
  const glow=ctx.createRadialGradient(this.cx,this.cy,this.r*.68,this.cx,this.cy,this.r*1.28);
  glow.addColorStop(0,"rgba(29,136,244,0)");glow.addColorStop(.63,"rgba(42,161,255,.13)");glow.addColorStop(1,"rgba(71,176,255,0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(this.cx,this.cy,this.r*1.27,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(this.cx,this.cy,this.r,0,Math.PI*2);ctx.clip();
  const ocean=ctx.createRadialGradient(this.cx-this.r*.32,this.cy-this.r*.34,this.r*.04,this.cx+this.r*.13,this.cy+this.r*.10,this.r*1.45);
  ocean.addColorStop(0,"#a6dfff");ocean.addColorStop(.36,"#397fc8");ocean.addColorStop(.72,"#1c4e96");ocean.addColorStop(1,"#07152e");
  ctx.fillStyle=ocean;ctx.fillRect(this.cx-this.r,this.cy-this.r,this.r*2,this.r*2);
  this.drawGrid();this.drawLand();
  const shine=ctx.createRadialGradient(this.cx-this.r*.46,this.cy-this.r*.52,0,this.cx,this.cy,this.r*1.3);
  shine.addColorStop(0,"rgba(255,255,255,.19)");shine.addColorStop(.54,"rgba(255,255,255,.0)");shine.addColorStop(1,"rgba(0,8,34,.36)");
  ctx.fillStyle=shine;ctx.fillRect(this.cx-this.r,this.cy-this.r,this.r*2,this.r*2);
  ctx.restore();
  ctx.beginPath();ctx.arc(this.cx,this.cy,this.r,0,Math.PI*2);ctx.strokeStyle="rgba(166,218,255,.55)";ctx.lineWidth=1.6;ctx.stroke();
  this.visiblePoints=[];
  for(const c of C){
   const p=this.project(c[5],c[4]);if(p.z<=.03)continue;
   this.visiblePoints.push({x:p.x,y:p.y,country:c});
   const active=c[0]===selected[0],radius=active?5.3:2.6;
   ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=active?"#fff":"#b8edff";ctx.fill();
   if(active){ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.strokeStyle="rgba(228,252,255,.76)";ctx.lineWidth=1.4;ctx.stroke();
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font='600 12px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.fillText(c[1],p.x,p.y-19);}
  }
 }
 loop(t){
  if(!this.lastFrame||t-this.lastFrame>48){
   if(!this.lastTick)this.lastTick=t;
   if(!this.drag&&t-this.lastInput>5500&&!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches))this.lon+=(t-this.lastTick)*.00125;
   this.lastTick=t;this.lastFrame=t;this.draw()
  }
  requestAnimationFrame(now=>this.loop(now))
 }
}
let globe,heroGlobe;
function metricEntry(code,key){const value=snapshot?.metrics?.[code]?.[key];return value&&value.value!==null?value:null}
function showMetrics(code){
 let found=0;for(const key of Object.keys(LABELS)){const d=metricEntry(code,key);if(d)found++;$( "metric-"+key).textContent=d?format(d.value,key==="income"?"":"%"):"—";$( "year-"+key).textContent=d?String(d.year)+" 年":"暂无统计"}
 $("profile-status").textContent=found===5?"5 项指标已加载":found?"已获取 "+found+"/5 项":"等待数据源";
}
let selecting=false;
function selectCountry(code,scroll){
 const c=countriesByCode[code];if(!c)return;
 selected=c;$("place-region").textContent=c[3];$("place-title").textContent=c[1];$("place-english").textContent=c[2];$("place-question").textContent=c[6];$("country-search").value=c[1];
 $("worldbank-link").href="https://api.worldbank.org/v2/country/"+c[0]+"/indicator/NY.GDP.MKTP.KD.ZG?format=json";
 document.querySelectorAll("[data-country]").forEach(b=>b.classList.toggle("active",b.dataset.country===code));
 showMetrics(code);if(globe)globe.lookAt(c);if(heroGlobe)heroGlobe.lookAt(c);renderComparison();
 if(scroll)document.querySelector("#globe-section").scrollIntoView({behavior:"smooth",block:"start"});
 if(!snapshot||!Object.keys(snapshot.metrics?.[code]||{}).length)loadCountryOnDemand(code);
}
function renderComparison(){
 const body=$("compare-body");body.textContent="";
 for(const code of RANK){const c=countriesByCode[code];const tr=document.createElement("tr");tr.tabIndex=0;tr.title="查看"+c[1];const datum=k=>metricEntry(code,k);const d=datum("gdp");const inflation=datum("inflation"),unemp=datum("unemployment"),income=datum("income");
 for(const value of [c[1],d?format(d.value,"%"):"—",inflation?format(inflation.value,"%"):"—",unemp?format(unemp.value,"%"):"—",income?format(income.value):"—",d?String(d.year):"暂无"]){const td=document.createElement("td");td.textContent=value;tr.appendChild(td)}
 if(c[0]===selected[0])tr.style.background="#eff5ff";
 tr.addEventListener("click",()=>selectCountry(code,true));
 tr.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();selectCountry(code,true)}});
 body.appendChild(tr)
 }
}
async function getJSON(url,ms=8500){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),ms);
 try{const res=await fetch(url,{signal:controller.signal,cache:"no-store"});if(!res.ok)throw new Error("HTTP "+res.status);return await res.json()}finally{clearTimeout(timeout)}
}
async function loadCountryOnDemand(code){
 const serial=++requestSerial;const outputs=await Promise.allSettled(Object.entries(LABELS).map(async([key,ind])=>{
  const url="https://api.worldbank.org/v2/country/"+code+"/indicator/"+ind+"?format=json&per_page=12";
  const data=await getJSON(url,6500);const row=Array.isArray(data?.[1])?data[1].find(item=>item&&item.value!==null&&item.value!==undefined):null;
  return {key,value:row?{value:row.value,year:row.date,indicator:ind}:null}
 }));
 if(!snapshot)snapshot={metrics:{},sources:{}};if(!snapshot.metrics)snapshot.metrics={};
 if(!snapshot.metrics[code])snapshot.metrics[code]={};
 outputs.forEach(r=>{if(r.status==="fulfilled"&&r.value.value)snapshot.metrics[code][r.value.key]=r.value.value});
 if(serial===requestSerial&&selected[0]===code)showMetrics(code);
 renderComparison();
}
function buildSignalItems(el,items,type){
 el.textContent="";
 const limited=items.slice(0,6);
 if(!limited.length){el.innerHTML='<div class="feed-empty">暂无新数据。可以通过下方来源链接查看最新发布。</div>';return}
 for(const item of limited){
  const a=document.createElement("a");a.className="feed-item";a.target="_blank";a.rel="noopener noreferrer";
  a.href=cleanLink(item.url,type==="github"?"https://github.com/topics/ai-agents":"https://news.ycombinator.com/show");
  const left=document.createElement("span");const strong=document.createElement("strong");strong.textContent=(item.name||item.title||"未命名项目").slice(0,100);
  const small=document.createElement("small");small.textContent=type==="github"?"★ "+format(item.stars)+" · "+String(item.description||"公开开源项目").slice(0,93):String(item.date||"").slice(0,10)+(item.points!=null?" · "+item.points+" points":"");
  left.append(strong,small);const arrow=document.createElement("span");arrow.textContent="↗";a.append(left,arrow);el.appendChild(a)
 }
}
function renderSignals(){
 const github=snapshot?.github;const hn=snapshot?.hackernews;const openalex=snapshot?.openalex;
 if(github&&Array.isArray(github.items)){buildSignalItems($("github-feed"),github.items,"github");$("github-count").textContent=shortNum(github.matched)}
 if(hn&&Array.isArray(hn.items)){buildSignalItems($("hn-feed"),hn.items,"hn");$("hn-count").textContent=String(hn.items.length)}
 if(openalex?.matched_works!==undefined&&openalex.matched_works!==null){$("openalex-count").textContent=shortNum(openalex.matched_works);$("openalex-period").textContent="OpenAlex · "+String(openalex.period||"上一自然月").split("/").join(" — ")}
}
async function fallbackSignals(){
 const date=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
 const jobs=[
  (async()=>{if(snapshot?.github)return;try{const d=await getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent("topic:ai-agents created:>="+date)+"&sort=stars&order=desc&per_page=6",9000);snapshot.github={matched:d.total_count,items:(d.items||[]).map(item=>({name:item.full_name,url:item.html_url,stars:item.stargazers_count,description:item.description}))};}catch(e){$("github-feed").innerHTML='<div class="feed-empty">数据暂不可用。请点击下方 GitHub 来源查看。</div>'}})(),
  (async()=>{if(snapshot?.hackernews)return;try{const d=await getJSON("https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&query=AI&hitsPerPage=6",9000);snapshot.hackernews={items:(d.hits||[]).map(x=>({title:x.title,url:x.url||"https://news.ycombinator.com/item?id="+x.objectID,date:x.created_at,points:x.points}))};}catch(e){$("hn-feed").innerHTML='<div class="feed-empty">数据暂不可用。请点击下方 Hacker News 来源查看。</div>'}})()
 ];await Promise.allSettled(jobs);renderSignals();
}
async function start(){
 globe=new CanvasGlobe($("earth"),code=>selectCountry(code,false));
 heroGlobe=new CanvasGlobe($("hero-earth"),code=>selectCountry(code,true));
 $("earth-status").textContent="离线地球 · 本地渲染";
 // Real Natural Earth coastlines are bundled as a small file. The in-script shapes remain a fallback.
 getJSON("data/world.json",7000).then(data=>{if(Array.isArray(data)&&data.length){globe.paths=data;globe.draw();heroGlobe.paths=data;heroGlobe.draw()}}).catch(()=>{});
 $("country-list").innerHTML=C.map(c=>'<option value="'+escapeHTML(c[1])+'"></option><option value="'+escapeHTML(c[2])+'"></option>').join("");
 document.querySelectorAll("[data-country]").forEach(el=>el.addEventListener("click",()=>selectCountry(el.dataset.country,el.classList.contains("region-card"))));
 $("reset-earth").addEventListener("click",()=>globe.reset());
 const search=$("country-search");
 const fromSearch=()=>{const term=search.value.trim().toLowerCase();const c=C.find(v=>v[1].toLowerCase()===term||v[2].toLowerCase()===term||v[0].toLowerCase()===term)||C.find(v=>v[1].toLowerCase().includes(term)&&term.length>1);if(c)selectCountry(c[0],false)};
 search.addEventListener("change",fromSearch);search.addEventListener("keydown",e=>{if(e.key==="Enter")fromSearch()});
 try{
  const data=await getJSON("data/snapshot.json",8500);
  if(!data||typeof data!=="object")throw new Error("invalid snapshot");
  snapshot=data;snapshot.metrics=snapshot.metrics||{};
  const count=Object.values(snapshot.sources||{}).filter(x=>x&&x.ok).length;
  $("refresh-state").textContent=data.collected_at?"最近抓取 "+new Date(data.collected_at).toLocaleString("zh-CN")+" · "+count+" 类采集项成功 · 指标以各自统计年为准":"等待首次采集 · 指标可尝试直接从世界银行查询";
 }catch(e){snapshot={metrics:{},sources:{}};$("refresh-state").textContent="自动采集快照暂不可用，正在尝试直接查询公开接口。"}
 selectCountry("USA",false);renderSignals();fallbackSignals();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
