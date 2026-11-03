/* Global Opportunity Radar v2.1 — evidence-first market explorer. No charting libraries. */
(function () {
  "use strict";
  const byId = id => document.getElementById(id);
  const METRICS = {
    gdp: {name:"GDP 年增长率",suffix:"%",code:"NY.GDP.MKTP.KD.ZG"},
    inflation: {name:"消费价格通胀",suffix:"%",code:"FP.CPI.TOTL.ZG"},
    unemployment: {name:"失业率",suffix:"%",code:"SL.UEM.TOTL.ZS"},
    fdi: {name:"外商直接投资净流入 / GDP",suffix:"%",code:"BX.KLT.DINV.WD.GD.ZS"},
    income: {name:"人均 GDP",suffix:" 美元",code:"NY.GDP.PCAP.CD"}
  };
  const COLORS = ["#1677f0","#ff9356","#9d6df0","#0ea5a4","#d86ac5"];
  const DEFAULT = ["USA","VNM","CHN","HKG"];
  let snapshot = null;
  let countries = [];
  let selected = "USA";
  let activeMetric = "gdp";
  let region = "ALL";
  let order = "desc";
  let showAll = false;
  let chosen = new Set(DEFAULT);
  const escapeHTML = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const numeric = x => x!==null && x!==undefined && x!=="" && Number.isFinite(Number(x));
  const format = (n,key) => numeric(n) ? Number(n).toLocaleString("zh-CN",{maximumFractionDigits:key==="income"?0:2}) + (key==="income"?"":METRICS[key].suffix) : "—";
  const economy = code => countries.find(c=>c.code===code);
  const datum = (code,key) => snapshot?.metrics?.[code]?.[key] || null;
  const sparkPoints = code => {
    const arr = snapshot?.history?.[code];
    return Array.isArray(arr) ? arr.filter(p=>p && Number.isInteger(+p.year) && numeric(p.value)).map(p=>({year:+p.year,value:+p.value})).sort((a,b)=>a.year-b.year) : [];
  };
  function setText(id,s){const el=byId(id);if(el)el.textContent=s}
  function renderQuality() {
    const metrics = snapshot?.metrics || {};
    const all = countries.map(c=>c.code);
    const covered = all.filter(c=>numeric(metrics[c]?.gdp?.value)).length;
    const dates = all.map(c=>metrics[c]?.gdp?.year).filter(Boolean).map(Number);
    const years = [...new Set(dates)].sort((a,b)=>b-a);
    const collected = snapshot?.collected_at ? new Date(snapshot.collected_at) : null;
    const capture = collected && !Number.isNaN(collected.valueOf()) ? collected.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}) : "暂无";
    setText("ex-coverage",covered+"/"+all.length);
    setText("ex-latest-year",years.length?String(years[0]):"—");
    setText("ex-captured",capture);
    setText("ex-quality-note",covered ? "GDP 可用 "+covered+"/"+all.length+" · 统计年份依各经济体分别标注 · 数据抓取不等于经济指标实时发布" : "尚无可用经济数据。地球与研究卡片仍可浏览，后台采集成功后会自动显示数值。");
  }
  function renderRanking() {
    const host = byId("ex-ranking");
    if(!host)return;
    host.replaceChildren();
    let rows = countries.filter(c=>region==="ALL" || c.region===region).map(c=>({c,entry:datum(c.code,activeMetric)}));
    rows.sort((a,b)=>{
      const va=numeric(a.entry?.value)?Number(a.entry.value):null;
      const vb=numeric(b.entry?.value)?Number(b.entry.value):null;
      if(va===null && vb===null)return a.c.name.localeCompare(b.c.name,"zh");
      if(va===null)return 1;if(vb===null)return -1;
      return order==="asc"?va-vb:vb-va;
    });
    const allValid=rows.filter(x=>numeric(x.entry?.value));
    const max=Math.max(...allValid.map(x=>Math.abs(Number(x.entry.value))),1);
    const visible=showAll?rows:rows.slice(0,10);
    for(let i=0;i<visible.length;i++){
      const {c,entry}=visible[i];
      const val=numeric(entry?.value)?Number(entry.value):null;
      const button=document.createElement("button");
      button.type="button";
      button.className="ex-rank-row"+(c.code===selected?" is-selected":"");
      button.setAttribute("aria-label",c.name+", "+METRICS[activeMetric].name+" "+(val===null?"暂无数据":format(val,activeMetric))+", 点击查看经济体");
      const rank=document.createElement("span");rank.className="ex-rank-n";rank.textContent=String(i+1).padStart(2,"0");
      const name=document.createElement("span");name.className="ex-rank-name";name.textContent=c.name;
      const track=document.createElement("span");track.className="ex-rank-track";
      const fill=document.createElement("span");fill.className="ex-rank-fill"+(val!==null&&val<0?" negative":"");
      fill.style.width=val===null?"0%":Math.max(2,100*Math.abs(val)/max).toFixed(1)+"%";
      track.append(fill);
      const value=document.createElement("span");value.className="ex-rank-value";value.textContent=format(val,activeMetric);
      const year=document.createElement("span");year.className="ex-rank-year";year.textContent=entry?.year?String(entry.year):"暂无";
      button.append(rank,name,track,value,year);
      button.addEventListener("click",()=>{selected=c.code;renderRanking();renderMarket();if(window.RadarCore?.selectCountry)window.RadarCore.selectCountry(c.code,false)});
      host.append(button);
    }
    if(!rows.length){host.textContent="没有符合条件的经济体。";return}
    setText("ex-rank-sub",METRICS[activeMetric].name+" · "+(order==="desc"?"从高到低":"从低到高")+" · 每行标注各自统计年份");
    const more=byId("ex-more");if(more){more.hidden=rows.length<=10;more.textContent=showAll?"收起榜单":"查看全部 "+rows.length+" 个经济体"}
  }
  function renderMarket() {
    const c=economy(selected)||countries[0];if(!c)return;
    const g=datum(c.code,"gdp"),f=datum(c.code,"fdi"),income=datum(c.code,"income");
    setText("ex-market-name",c.name);
    setText("ex-market-english",c.english);
    setText("ex-market-gdp",format(g?.value,"gdp"));
    setText("ex-market-year",g?.year?String(g.year)+" 年数据":"缺少 GDP 统计");
    setText("ex-market-fdi",format(f?.value,"fdi"));
    setText("ex-market-income",format(income?.value,"income"));
    setText("ex-market-question",c.question||"哪些客户愿意为新的解决方案持续付费？");
    const link=byId("ex-market-source");
    if(link)link.href="https://api.worldbank.org/v2/country/"+encodeURIComponent(c.code)+"/indicator/NY.GDP.MKTP.KD.ZG?format=json";
  }
  function renderLegend(){
    const el=byId("ex-legend");if(!el)return;el.replaceChildren();
    for(const code of chosen){
      const c=economy(code);if(!c)continue;
      const pill=document.createElement("button");pill.className="ex-legend-pill";pill.type="button";
      pill.style.setProperty("--series-color",COLORS[Array.from(chosen).indexOf(code)%COLORS.length]);
      pill.textContent=c.name+" ×";pill.title="取消显示 "+c.name;
      pill.addEventListener("click",()=>{if(chosen.size<=1)return;chosen.delete(code);renderTrend()});
      el.append(pill);
    }
    const chooser=byId("ex-add-economy");
    if(chooser){chooser.replaceChildren(new Option("添加对比经济体",""));for(const c of countries){if(!chosen.has(c.code))chooser.add(new Option(c.name,c.code))}chooser.value=""}
  }
  function renderTrend(){
    renderLegend();
    const host=byId("ex-trend");if(!host)return;host.replaceChildren();
    const traces=[...chosen].map((code,index)=>({code,color:COLORS[index%COLORS.length],points:sparkPoints(code)}));
    const available=traces.filter(t=>t.points.length>=2);
    const all=available.flatMap(t=>t.points);
    if(!available.length){
      const empty=document.createElement("div");empty.className="ex-chart-empty";
      empty.textContent=snapshot?.collected_at?"当前快照缺少连续 GDP 历史数据，等待下一次数据更新。":"历史曲线将在首次数据采集成功后显示。";
      host.append(empty);setText("ex-trend-period","GDP 实际增速（年度）· 世界银行");return;
    }
    const years=[...new Set(all.map(p=>p.year))].sort((a,b)=>a-b);
    const loY=years[0],hiY=years[years.length-1];
    const values=all.map(p=>p.value);let yMin=Math.min(...values),yMax=Math.max(...values);
    const pad=Math.max((yMax-yMin)*.18,.8);yMin=Math.floor((yMin-pad)*10)/10;yMax=Math.ceil((yMax+pad)*10)/10;
    if(yMax<=yMin)yMax=yMin+1;
    const W=820,H=300,left=60,right=18,top=25,bottom=44;
    const px=year=>left+(year-loY)/Math.max(1,hiY-loY)*(W-left-right);
    const py=value=>top+(yMax-value)/(yMax-yMin)*(H-top-bottom);
    const ns="http://www.w3.org/2000/svg";const svg=document.createElementNS(ns,"svg");
    svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("role","img");
    svg.setAttribute("aria-label","各经济体 GDP 年增长率历史折线图，数据来自世界银行");
    const add=(tag,attributes,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attributes||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=text;svg.append(e);return e};
    for(let i=0;i<=4;i++){
      const val=yMin+(yMax-yMin)*i/4,y=py(val);
      add("line",{x1:left,y1:y,x2:W-right,y2:y,stroke:"#e9eef6","stroke-width":1});
      add("text",{x:left-11,y:y+4,"text-anchor":"end",fill:"#8090a5","font-size":12},val.toFixed(1)+"%");
    }
    const step=Math.max(1,Math.ceil(years.length/7));
    years.filter((y,i)=>i%step===0 || i===years.length-1).forEach(year=>{
      add("text",{x:px(year),y:H-14,"text-anchor":"middle",fill:"#8090a5","font-size":12},String(year));
    });
    for(const t of available){
      const fragments=[];let segment=[];
      for(const p of t.points){
        if(segment.length&&p.year-segment[segment.length-1].year>1){fragments.push(segment);segment=[]}
        segment.push(p);
      }
      if(segment.length)fragments.push(segment);
      for(const frag of fragments){if(frag.length>1)add("polyline",{points:frag.map(p=>px(p.year).toFixed(1)+","+py(p.value).toFixed(1)).join(" "),fill:"none",stroke:t.color,"stroke-width":3.4,"stroke-linecap":"round","stroke-linejoin":"round"})}
      for(const p of t.points){
        const dot=add("circle",{cx:px(p.year),cy:py(p.value),r:3.5,fill:"#fff",stroke:t.color,"stroke-width":2.6});
        const tooltip=document.createElementNS(ns,"title");tooltip.textContent=(economy(t.code)?.name||t.code)+" · "+p.year+" 年 · "+format(p.value,"gdp");dot.append(tooltip);
      }
    }
    host.append(svg);
    setText("ex-trend-period",loY+"—"+hiY+" 年 · GDP 年增长率 · 世界银行 WDI · 断点表示缺失年份");
  }
  function downloadCSV(){
    const headers=["经济体代码","经济体","区域","指标","值","单位","统计年份","来源"];
    const rows=[headers];
    for(const c of countries){for(const [key,def] of Object.entries(METRICS)){
      const d=datum(c.code,key);
      rows.push([c.code,c.name,c.region,def.name,numeric(d?.value)?d.value:"",key==="income"?"USD":"%",d?.year||"", "https://api.worldbank.org/v2/country/"+c.code+"/indicator/"+def.code+"?format=json"]);
    }}
    const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="global-opportunity-radar-metrics.csv";document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function update(data){snapshot=data||{metrics:{}};renderQuality();renderRanking();renderMarket();renderTrend()}
  function init(){
    const core=window.RadarCore||{};
    countries=Array.isArray(core.countries)?core.countries:[];
    if(!countries.length)return;
    const reg=byId("ex-region");
    const codes=[...new Set(countries.map(c=>c.region))].sort();
    for(const code of codes)reg.add(new Option(({ "EAST ASIA":"东亚","SOUTHEAST ASIA":"东南亚","SOUTH ASIA":"南亚","NORTH AMERICA":"北美","SOUTH AMERICA":"南美","EUROPE":"欧洲","MIDDLE EAST":"中东","OCEANIA":"大洋洲"})[code]||code,code));
    byId("ex-metric").addEventListener("change",e=>{activeMetric=e.target.value;renderRanking()});
    reg.addEventListener("change",e=>{region=e.target.value;showAll=false;renderRanking()});
    byId("ex-sort").addEventListener("click",()=>{order=order==="desc"?"asc":"desc";setText("ex-sort",order==="desc"?"从高到低 ↓":"从低到高 ↑");renderRanking()});
    byId("ex-more").addEventListener("click",()=>{showAll=!showAll;renderRanking()});
    byId("ex-add-economy").addEventListener("change",e=>{const c=e.target.value;if(c){if(chosen.size>=5)chosen.delete([...chosen][0]);chosen.add(c);renderTrend()}});
    byId("ex-download").addEventListener("click",downloadCSV);
    byId("ex-share").addEventListener("click",async()=>{
      const url=new URL(window.location.href);url.searchParams.set("economy",selected);
      try{if(!navigator.clipboard?.writeText)throw Error("clipboard unavailable");await navigator.clipboard.writeText(url.toString());setText("ex-share","已复制市场链接 ✓")}
      catch(_){window.prompt("复制当前市场链接：",url.toString())}
    });
    window.addEventListener("radar:data",e=>update(e.detail?.snapshot));
    window.addEventListener("radar:select",e=>{selected=e.detail?.code||selected;renderRanking();renderMarket()});
    update({metrics:{}});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();