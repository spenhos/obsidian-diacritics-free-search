(function () {
  'use strict';
  var PANEL_ID = 'ops-panel', BTN_ID = 'ops-launch';
  var lastRows = [];      // cosecha completa (set A)
  var viewRows = [];      // tras filtros/orden
  var interRows = null;   // resultado de A∩B (si activo)
  var dorot = [];
  var currentTerm = '';

  /* ---------- acceso a la app ---------- */
  function getVM(){ var el=document.querySelector('#app'); return el && el.__vue__ ? el.__vue__ : null; }
  function getFSStore(){ var vm=getVM(); if(!vm||!vm.$pinia) return null; var st=null;
    try{ st=vm.$pinia._s.get('freeSearchBookList-main'); }catch(e){}
    if(!st){ try{ vm.$pinia._s.forEach(function(s){ if(!st && typeof s.getCurrentListIds!=='undefined') st=s; }); }catch(e){} }
    return st; }
  function getMeta(id){ var vm=getVM(); try{ return vm.$store.getters['books/getBookbyId'](id); }catch(e){ return null; } }
  function isSearching(){ var vm=getVM(); return !!(vm && vm.$store && (vm.$store.state.freeSearch||{}).searching); }
  function findSearchComp(){ var t=null, seen=[]; (function w(c,d){ if(!c||d>15||seen.indexOf(c)!==-1) return; seen.push(c);
    if(typeof c.doFreeSearch==='function' && !t) t=c; (c.$children||[]).forEach(function(ch){ w(ch,d+1); }); })(getVM(),0); return t; }
  function eraOf(p){ var i=(typeof p==='number')?p-1:-1; if(i>=0&&i<dorot.length) return dorot[i]; return dorot.length?dorot[dorot.length-1]:'אחרים'; }
  function bookLink(id){ return 'https://tablet.otzar.org/#/b/'+id+'/p/1/t/'+Date.now()+'/fs/0/start/0/end/0/c'; }

  /* ---------- año hebreo -> gregoriano (para la línea de tiempo) ---------- */
  var HEB = {'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'כ':20,'ך':20,'ל':30,'מ':40,'ם':40,'נ':50,'ן':50,'ס':60,'ע':70,'פ':80,'ף':80,'צ':90,'ץ':90,'ק':100,'ר':200,'ש':300,'ת':400};
  function parseHebrewYear(s){
    if(!s) return null;
    var sum=0, saw=false, i, ch;
    for(i=0;i<s.length;i++){ ch=s.charAt(i); if(HEB[ch]!=null){ sum+=HEB[ch]; saw=true; } }
    if(!saw) return null;
    // si trae ה' inicial (5xxx) el bucle ya sumó la ה (5); normalizamos al rango 5000-6000
    if(sum<1000) sum+=5000;            // forma corredor (פרט) sin alef-millar
    if(sum<5000||sum>6200) return null;
    return sum-3761;                   // gregoriano aproximado
  }
  function centuryLabel(g){ if(g==null) return null; var c=Math.floor(g/100)*100; return "s. "+ (c/100+1) + " (" + c + "s)"; }

  /* ---------- cosecha ---------- */
  function harvest(){
    var fs=getFSStore(); if(!fs){ return []; }
    dorot=(fs.dorot&&fs.dorot.length)?fs.dorot.slice():dorot;
    var list=fs.getCurrentListIds||[]; var rows=[];
    for(var i=0;i<list.length;i++){
      var r=list[i], m=getMeta(r.book), title='—',author='—',period=null,place='',from='',to='';
      if(m){ title=m.name||'—'; var names=[],n=m.authors_length||1;
        for(var a=0;a<n;a++){ var nm=m['authors_'+a+'_name']; if(nm) names.push(nm); }
        author=names.length?names.join(' / '):'—';
        period=(typeof m.authors_0_period==='number')?m.authors_0_period:null;
        place=m.places||''; from=m.fromyear||''; to=m.toyear||''; }
      var gy=parseHebrewYear(to)||parseHebrewYear(from);
      rows.push({ book:r.book, hits:r.results||0, title:title, author:author, era:eraOf(period),
                  period:period, place:place, year:(from&&to&&from!==to)?(from+'–'+to):(from||to||''), gYear:gy, link:bookLink(r.book) });
    }
    return rows;
  }

  /* ---------- agregación / descubrimiento ---------- */
  function aggregate(rows){
    var byEra={}, byAuthor={}, totalHits=0, i, r;
    for(i=0;i<rows.length;i++){ r=rows[i]; byEra[r.era]=(byEra[r.era]||0)+1; byAuthor[r.author]=(byAuthor[r.author]||0)+r.hits; totalHits+=r.hits; }
    var eras=(dorot.length?dorot:Object.keys(byEra)).map(function(e){return [e,byEra[e]||0];}).filter(function(x){return x[1]>0;});
    var topAuthors=Object.keys(byAuthor).map(function(k){return [k,byAuthor[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,12);
    return { eras:eras, topAuthors:topAuthors, totalHits:totalHits, totalBooks:rows.length };
  }
  function centuryBuckets(rows){
    var m={}, i, lbl;
    for(i=0;i<rows.length;i++){ lbl=centuryLabel(rows[i].gYear); if(!lbl) continue; m[lbl]=(m[lbl]||0)+1; }
    // ordenar por siglo (extraer el número entre paréntesis)
    return Object.keys(m).map(function(k){ var num=parseInt((k.match(/\((\-?\d+)s\)/)||[])[1]||0,10); return {label:k, n:m[k], num:num}; })
      .sort(function(a,b){return a.num-b.num;});
  }
  function outliers(rows){
    // fuentes de las épocas MÁS RARAS para este tema (serendipia)
    var agg=aggregate(rows); if(!agg.eras.length) return [];
    var byCount=agg.eras.slice().sort(function(a,b){return a[1]-b[1];});
    var rareEras={}; var taken=0;
    for(var i=0;i<byCount.length && taken<2;i++){ rareEras[byCount[i][0]]=true; taken++; }
    return rows.filter(function(r){return rareEras[r.era];}).sort(function(a,b){return b.hits-a.hits;}).slice(0,6);
  }
  var STOP = {'של':1,'על':1,'אל':1,'את':1,'עם':1,'או':1,'כי':1,'אם':1,'ספר':1,'ספרי':1,'חלק':1,'בית':1,'דברי':1,'תורת':1,'תורה':1,'חידושי':1,'ביאור':1,'באור':1,'פירוש':1,'פי':1,'שו"ת':1,'ועוד':1,'הלכות':1,'מסכת':1,'כל':1,'בן':1,'בר':1,'אבן':1,'מן':1,'יד':1};
  function relatedTerms(rows, queryWords){
    var freq={}, i, j, words, w;
    var qset={}; (queryWords||[]).forEach(function(q){ qset[q]=1; });
    for(i=0;i<rows.length;i++){
      words=String(rows[i].title||'').replace(/["'׳״()\[\].,:;]/g,' ').split(/\s+/);
      for(j=0;j<words.length;j++){ w=words[j].trim(); if(w.length<3) continue; if(STOP[w]||qset[w]) continue; if(!/[֐-׿]/.test(w)) continue; freq[w]=(freq[w]||0)+1; }
    }
    return Object.keys(freq).map(function(k){return [k,freq[k]];}).filter(function(x){return x[1]>=2;}).sort(function(a,b){return b[1]-a[1];}).slice(0,8).map(function(x){return x[0];});
  }

  /* ---------- filtros / orden / tabla ---------- */
  function activeRows(){ return interRows!==null ? interRows : lastRows; }
  function applyView(){
    var base=activeRows();
    var q=(document.getElementById('ops-fauthor').value||'').trim();
    var minHits=parseInt(document.getElementById('ops-fmin').value,10)||0;
    var eraSel=Array.prototype.slice.call(document.querySelectorAll('.ops-era-chk:checked')).map(function(c){return c.value;});
    var sortKey=document.getElementById('ops-sort').value;
    viewRows=base.filter(function(r){ return r.hits>=minHits && (eraSel.length===0||eraSel.indexOf(r.era)!==-1) &&
      (q===''||(r.author&&r.author.indexOf(q)!==-1)||(r.title&&r.title.indexOf(q)!==-1)); });
    viewRows.sort(function(a,b){ if(sortKey==='hits')return b.hits-a.hits; if(sortKey==='title')return a.title.localeCompare(b.title,'he');
      if(sortKey==='author')return a.author.localeCompare(b.author,'he'); if(sortKey==='era')return (a.period||99)-(b.period||99); return 0; });
    renderTable();
    document.getElementById('ops-count').textContent=viewRows.length.toLocaleString()+' / '+base.length.toLocaleString()+' libros';
  }
  function renderTable(){
    var cap=1000, body=viewRows.slice(0,cap).map(function(r,i){
      return '<tr><td>'+(i+1)+'</td><td class="ops-hits">'+r.hits+'</td><td><a href="'+r.link+'" target="_blank">'+esc(r.title)+'</a></td><td>'+esc(r.author)+'</td><td>'+esc(r.era)+'</td><td>'+esc(r.year)+'</td></tr>';
    }).join('');
    document.getElementById('ops-tbody').innerHTML=body+(viewRows.length>cap?'<tr><td colspan="6" class="ops-more">… '+(viewRows.length-cap).toLocaleString()+' más (exporta a CSV)</td></tr>':'');
  }

  /* ---------- CSV ---------- */
  function csvCell(v){ v=(v==null)?'':String(v); if(/[",\n]/.test(v)) v='"'+v.replace(/"/g,'""')+'"'; return v; }
  function exportCSV(){
    var rows=viewRows.length?viewRows:activeRows(); if(!rows.length){ alert('Nada para exportar.'); return; }
    var header=['#','ID Libro','Título','Autor(es)','Época','Año','Lugar','Hits','Link'];
    var lines=[header.map(csvCell).join(',')];
    rows.forEach(function(r,i){ lines.push([i+1,r.book,r.title,r.author,r.era,r.year,r.place,r.hits,r.link].map(csvCell).join(',')); });
    var blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob), a=document.createElement('a');
    var safe=(currentTerm||'otzar').replace(/[\\/:*?"<>|]/g,'_').slice(0,40);
    a.href=url; a.download='otzar_'+safe+'_'+rows.length+'.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},4000);
  }

  /* ---------- acciones ---------- */
  function setStatus(t){ var e=document.getElementById('ops-status'); if(e) e.textContent=t; }
  function runSearchAndHarvest(text){
    var c=findSearchComp(); if(!c){ alert('No encuentro el buscador de Otzar. Recarga la página.'); return; }
    interRows=null; currentTerm=text; setStatus('Buscando “'+text+'” en Otzar…');
    try{ c.doFreeSearch(text,[],0,false,null,0); }catch(e){ alert('Error al iniciar la búsqueda: '+e.message); return; }
    setTimeout(doHarvest,1500);
  }
  function doHarvest(){
    if(isSearching()){ setStatus('Esperando a que Otzar termine la búsqueda…'); setTimeout(doHarvest,800); return; }
    setStatus('Cosechando…');
    setTimeout(function(){
      lastRows=harvest(); interRows=null;
      if(!lastRows.length){ setStatus('Sin resultados. Haz una búsqueda de contenido y vuelve a pulsar Cosechar.'); return; }
      var fs=getFSStore(); currentTerm=fs?(fs.finalTextSearch||fs.textSearch||currentTerm):currentTerm;
      setStatus('“'+currentTerm+'” — '+lastRows.length.toLocaleString()+' libros');
      renderSummary(); buildEraFilter(); applyView();
    },50);
  }
  /* cruce A∩B */
  function doIntersect(termB){
    if(!lastRows.length){ alert('Primero haz una búsqueda (idea A) y cosecha.'); return; }
    var c=findSearchComp(); if(!c){ alert('No encuentro el buscador de Otzar.'); return; }
    var setA=lastRows.slice(), termA=currentTerm;
    setStatus('Cruzando “'+termA+'” ∩ “'+termB+'”… buscando B');
    try{ c.doFreeSearch(termB,[],0,false,null,0); }catch(e){ alert('Error: '+e.message); return; }
    setTimeout(function(){ waitIntersect(setA,termA,termB); },1500);
  }
  function waitIntersect(setA,termA,termB){
    if(isSearching()){ setStatus('Esperando a que termine “'+termB+'”…'); setTimeout(function(){waitIntersect(setA,termA,termB);},800); return; }
    var rowsB=harvest(); var bIds={}; rowsB.forEach(function(r){ bIds[r.book]=r.hits; });
    var inter=setA.filter(function(r){ return bIds[r.book]!=null; }).map(function(r){
      var c2={}; for(var k in r) c2[k]=r[k]; c2.hitsB=bIds[r.book]; c2.hits=r.hits+bIds[r.book]; return c2; });
    inter.sort(function(a,b){return b.hits-a.hits;});
    interRows=inter; currentTerm=termA+' ∩ '+termB;
    setStatus('“'+termA+'” ∩ “'+termB+'” — '+inter.length.toLocaleString()+' libros en AMBOS');
    renderSummary(true); buildEraFilter(); applyView();
  }

  /* ---------- render descubrimiento ---------- */
  function renderSummary(isInter){
    var rows=activeRows(); var agg=aggregate(rows);
    var maxEra=Math.max.apply(null,[1].concat(agg.eras.map(function(e){return e[1];})));
    var eraBars=agg.eras.map(function(p){ return bar(p[0],p[1],maxEra); }).join('');
    var cents=centuryBuckets(rows); var maxC=Math.max.apply(null,[1].concat(cents.map(function(c){return c.n;})));
    var centBars=cents.length?cents.map(function(c){ return bar(c.label,c.n,maxC); }).join(''):'<div class="ops-dim">—</div>';
    var outs=outliers(rows);
    var outHtml=outs.length?('<ol class="ops-authors">'+outs.map(function(r){ return '<li><a href="'+r.link+'" target="_blank">'+esc(r.title)+'</a><span class="ops-dim">'+esc(r.era)+'</span></li>'; }).join('')+'</ol>'):'<div class="ops-dim">—</div>';
    var authors=agg.topAuthors.map(function(p){ return '<li><span>'+esc(p[0])+'</span><span class="ops-au-hits">'+p[1].toLocaleString()+'</span></li>'; }).join('');
    var rel=relatedTerms(rows, (currentTerm||'').split(/\s+/));
    var relHtml=rel.length?rel.map(function(w){ return '<span class="ops-rel" data-w="'+esc(w)+'">'+esc(w)+'</span>'; }).join(''):'<span class="ops-dim">—</span>';
    var kpi='<div class="ops-kpis"><b>'+agg.totalBooks.toLocaleString()+'</b> libros · <b>'+agg.totalHits.toLocaleString()+'</b> menciones'+(isInter?' · <b>A∩B</b>':'')+'</div>';
    document.getElementById('ops-summary').innerHTML =
      kpi
      + sec('¿Dónde vive esta idea? (por época)') + eraBars
      + sec('Línea de tiempo (por siglo)') + centBars
      + sec('Fuentes inesperadas (outliers)') + outHtml
      + sec('Autores con más menciones') + '<ol class="ops-authors">'+authors+'</ol>'
      + sec('Búsquedas relacionadas') + '<div class="ops-rels">'+relHtml+'</div>';
    Array.prototype.slice.call(document.querySelectorAll('#ops-summary .ops-rel')).forEach(function(el){
      el.onclick=function(){ var w=el.getAttribute('data-w'); document.getElementById('ops-q').value=w; runSearchAndHarvest(w); };
    });
  }
  function sec(t){ return '<div class="ops-sec-t">'+esc(t)+'</div>'; }
  function bar(label,n,max){ return '<div class="ops-bar-row"><span class="ops-bar-lbl">'+esc(label)+'</span><span class="ops-bar"><span class="ops-bar-fill" style="width:'+(n/max*100).toFixed(1)+'%"></span></span><span class="ops-bar-num">'+n.toLocaleString()+'</span></div>'; }
  function buildEraFilter(){
    var rows=activeRows();
    var eras=(dorot.length?dorot:[]).filter(function(e){ return rows.some(function(r){return r.era===e;}); });
    document.getElementById('ops-erafilter').innerHTML=eras.map(function(e){ return '<label class="ops-chip"><input type="checkbox" class="ops-era-chk" value="'+esc(e)+'"> '+esc(e)+'</label>'; }).join('');
    Array.prototype.slice.call(document.querySelectorAll('.ops-era-chk')).forEach(function(c){ c.addEventListener('change',applyView); });
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function debounce(fn,ms){ var t; return function(){ clearTimeout(t); t=setTimeout(fn,ms); }; }

  /* ---------- UI ---------- */
  function mountUI(){
    if(document.getElementById(BTN_ID)) return;
    var btn=document.createElement('button'); btn.id=BTN_ID; btn.textContent='🔍 Power Search';
    btn.onclick=function(){ var p=document.getElementById(PANEL_ID); p.style.display=(p.style.display==='none'?'flex':'none'); };
    document.body.appendChild(btn);
    var panel=document.createElement('div'); panel.id=PANEL_ID; panel.style.display='none';
    panel.innerHTML=''
      + '<div class="ops-head"><span>Otzar · Power Search & Discovery</span><button id="ops-close">✕</button></div>'
      + '<div class="ops-search"><input id="ops-q" type="text" placeholder="Buscar una idea en el contenido…"><button id="ops-run">Buscar</button><button id="ops-grab" title="Toma la búsqueda que ya hiciste en Otzar">Cosechar</button></div>'
      + '<div class="ops-search ops-search2"><input id="ops-b" type="text" placeholder="Cruzar con otra idea (A∩B)…"><button id="ops-cross">Cruzar</button></div>'
      + '<div id="ops-status" class="ops-status">Escribe una idea y pulsa Buscar (o busca en Otzar y pulsa Cosechar).</div>'
      + '<div id="ops-summary" class="ops-summary"></div>'
      + '<div class="ops-controls"><div id="ops-erafilter" class="ops-erafilter"></div>'
      +   '<div class="ops-row2"><input id="ops-fauthor" type="text" placeholder="Filtrar autor/título…">'
      +   '<label>min hits <input id="ops-fmin" type="number" value="0" min="0" style="width:54px"></label>'
      +   '<select id="ops-sort"><option value="hits">Orden: más hits</option><option value="era">Orden: época</option><option value="author">Orden: autor</option><option value="title">Orden: título</option></select>'
      +   '<span id="ops-count" class="ops-count"></span><button id="ops-csv">⬇ CSV / Excel</button></div></div>'
      + '<div class="ops-tablewrap"><table class="ops-table"><thead><tr><th>#</th><th>Hits</th><th>Título</th><th>Autor</th><th>Época</th><th>Año</th></tr></thead><tbody id="ops-tbody"></tbody></table></div>';
    document.body.appendChild(panel);
    document.getElementById('ops-close').onclick=function(){ panel.style.display='none'; };
    document.getElementById('ops-grab').onclick=doHarvest;
    document.getElementById('ops-run').onclick=function(){ var t=document.getElementById('ops-q').value.trim(); if(t) runSearchAndHarvest(t); };
    document.getElementById('ops-q').addEventListener('keydown',function(e){ if(e.key==='Enter'){ var t=e.target.value.trim(); if(t) runSearchAndHarvest(t); } });
    document.getElementById('ops-cross').onclick=function(){ var t=document.getElementById('ops-b').value.trim(); if(t) doIntersect(t); };
    document.getElementById('ops-b').addEventListener('keydown',function(e){ if(e.key==='Enter'){ var t=e.target.value.trim(); if(t) doIntersect(t); } });
    document.getElementById('ops-csv').onclick=exportCSV;
    document.getElementById('ops-fauthor').addEventListener('input',debounce(applyView,250));
    document.getElementById('ops-fmin').addEventListener('input',debounce(applyView,250));
    document.getElementById('ops-sort').addEventListener('change',applyView);
    injectStyles();
  }
  function injectStyles(){
    var css='#'+BTN_ID+'{position:fixed;left:16px;bottom:16px;z-index:2147483647;background:#2b5cff;color:#fff;border:none;border-radius:22px;padding:10px 16px;font:600 13px system-ui;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}'
    +'#'+PANEL_ID+'{position:fixed;left:16px;bottom:64px;z-index:2147483647;width:440px;max-height:86vh;display:flex;flex-direction:column;background:#fff;color:#1a1a1a;border:1px solid #d6d9e0;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.28);font:13px system-ui;overflow:hidden}'
    +'#'+PANEL_ID+' .ops-head{display:flex;justify-content:space-between;align-items:center;background:#0f1830;color:#fff;padding:10px 12px;font-weight:600}'
    +'#'+PANEL_ID+' .ops-head button{background:none;border:none;color:#fff;font-size:16px;cursor:pointer}'
    +'#'+PANEL_ID+' .ops-search{display:flex;gap:6px;padding:10px 10px 0}'
    +'#'+PANEL_ID+' .ops-search2{padding-top:6px;padding-bottom:10px;border-bottom:1px solid #eee}'
    +'#'+PANEL_ID+' .ops-search input{flex:1;padding:7px 9px;border:1px solid #ccc;border-radius:7px;direction:rtl}'
    +'#'+PANEL_ID+' .ops-search button,#'+PANEL_ID+' .ops-row2 button{background:#2b5cff;color:#fff;border:none;border-radius:7px;padding:7px 11px;cursor:pointer;font-weight:600}'
    +'#'+PANEL_ID+' #ops-grab{background:#08a36b}#'+PANEL_ID+' #ops-cross{background:#7a4dff}'
    +'#'+PANEL_ID+' .ops-status{padding:7px 12px;color:#555;background:#f6f7fb;direction:rtl;text-align:right;font-size:12px}'
    +'#'+PANEL_ID+' .ops-summary{padding:8px 12px;overflow:auto;max-height:300px;border-bottom:1px solid #eee}'
    +'#'+PANEL_ID+' .ops-kpis{font-size:13px;margin-bottom:4px}'
    +'#'+PANEL_ID+' .ops-sec-t{font-weight:700;margin:9px 0 4px;color:#0f1830;direction:rtl;text-align:right;font-size:12px}'
    +'#'+PANEL_ID+' .ops-bar-row{display:flex;align-items:center;gap:6px;margin:2px 0;direction:rtl}'
    +'#'+PANEL_ID+' .ops-bar-lbl{width:140px;text-align:right;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    +'#'+PANEL_ID+' .ops-bar{flex:1;background:#eef0f6;border-radius:5px;height:12px;overflow:hidden}'
    +'#'+PANEL_ID+' .ops-bar-fill{display:block;height:100%;background:#2b5cff}'
    +'#'+PANEL_ID+' .ops-bar-num{width:54px;font-size:11px;color:#444}'
    +'#'+PANEL_ID+' .ops-authors{margin:2px 0;padding:0 18px 0 0;direction:rtl;max-height:150px;overflow:auto}'
    +'#'+PANEL_ID+' .ops-authors li{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:1px 0}'
    +'#'+PANEL_ID+' .ops-authors a{color:#1d49e0;text-decoration:none}'
    +'#'+PANEL_ID+' .ops-au-hits{color:#2b5cff;font-weight:600}'
    +'#'+PANEL_ID+' .ops-dim{color:#999;font-size:11px;direction:rtl;text-align:right}'
    +'#'+PANEL_ID+' .ops-rels{display:flex;flex-wrap:wrap;gap:5px;direction:rtl}'
    +'#'+PANEL_ID+' .ops-rel{background:#eef0f6;border-radius:12px;padding:3px 10px;font-size:12px;cursor:pointer;color:#1d49e0}'
    +'#'+PANEL_ID+' .ops-rel:hover{background:#dde3f7}'
    +'#'+PANEL_ID+' .ops-controls{padding:8px 12px;border-bottom:1px solid #eee}'
    +'#'+PANEL_ID+' .ops-erafilter{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;direction:rtl}'
    +'#'+PANEL_ID+' .ops-chip{font-size:11px;background:#eef0f6;border-radius:12px;padding:2px 8px;cursor:pointer}'
    +'#'+PANEL_ID+' .ops-row2{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'
    +'#'+PANEL_ID+' .ops-row2 input[type=text]{flex:1;min-width:110px;padding:5px 8px;border:1px solid #ccc;border-radius:6px;direction:rtl}'
    +'#'+PANEL_ID+' .ops-count{font-size:11px;color:#666;margin-inline:auto}'
    +'#'+PANEL_ID+' .ops-tablewrap{overflow:auto;flex:1}'
    +'#'+PANEL_ID+' table.ops-table{width:100%;border-collapse:collapse;font-size:12px;direction:rtl}'
    +'#'+PANEL_ID+' .ops-table th{position:sticky;top:0;background:#f0f2f7;padding:5px 6px;text-align:right;border-bottom:1px solid #dde}'
    +'#'+PANEL_ID+' .ops-table td{padding:4px 6px;border-bottom:1px solid #f0f0f0;text-align:right}'
    +'#'+PANEL_ID+' .ops-table td.ops-hits{color:#2b5cff;font-weight:600;text-align:center}'
    +'#'+PANEL_ID+' .ops-table a{color:#1d49e0;text-decoration:none}'
    +'#'+PANEL_ID+' .ops-more{color:#888;text-align:center;font-style:italic}';
    var s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
  }

  /* expone apertura para el bookmarklet */
  window.OtzarPS = { open:function(){ var p=document.getElementById(PANEL_ID); if(!p){ mountUI(); p=document.getElementById(PANEL_ID); } if(p) p.style.display='flex'; }, harvest:doHarvest };

  function waitReady(t){ t=t||0; var vm=getVM(); if(vm&&(vm.$store||vm.$pinia)){ mountUI(); return; } if(t<120) setTimeout(function(){ waitReady(t+1); },800); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ waitReady(0); }); else waitReady(0);
})();
;try{window.OtzarPS&&window.OtzarPS.open();}catch(e){}