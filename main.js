/* =====================================================
   GEOVEN  main.js  v9.5 - Menú con imágenes y colores corregidos
===================================================== */
'use strict';

(async function(){

/* ─── CONSTANTES ───────────────────────────────────── */
const PRIZES=[100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
const SAFE_AT=[4,9];

const SVG_ID={
    falcon:'Falcón',amazonas:'Amazonas',anzoategui:'Anzoátegui',apure:'Apure',
    aragua:'Aragua',barinas:'Barinas',bolivar:'Bolívar',carabobo:'Carabobo',
    cojedes:'Cojedes',delta_amacuro:'Delta Amacuro',distritocapital:'Distrito Capital',
    guarico:'Guárico',la_guaira:'La Guaira',lara:'Lara',merida:'Mérida',
    miranda:'Miranda',monagas:'Monagas',nueva_esparta:'Nueva Esparta',
    portuguesa:'Portuguesa',sucre:'Sucre',tachira:'Táchira',trujillo:'Trujillo',
    yaracuy:'Yaracuy',zulia:'Zulia',dependencias_federales:'Dependencias Federales',
};

const FLAG_SLUG={
    'Amazonas':'amazonas','Anzoátegui':'anzoategui','Apure':'apure','Aragua':'aragua',
    'Barinas':'barinas','Bolívar':'bolivar','Carabobo':'carabobo','Cojedes':'cojedes',
    'Delta Amacuro':'delta_amacuro','Dependencias Federales':'dependencias_federales',
    'Distrito Capital':'distrito_capital','Falcón':'falcon','Guárico':'guarico',
    'La Guaira':'la_guaira','Lara':'lara','Mérida':'merida','Miranda':'miranda',
    'Monagas':'monagas','Nueva Esparta':'nueva_esparta','Portuguesa':'portuguesa',
    'Sucre':'sucre','Táchira':'tachira','Trujillo':'trujillo','Yaracuy':'yaracuy','Zulia':'zulia',
};

const REG_COLOR={
    'Los Andes':'#55BC84','Capital':'#C48E69','Central':'#43E8F5',
    'Centro-Occidental':'#F7A34C','Nororiental':'#92E126','Guayana':'#E87171',
    'Guayana (Deltaica)':'#E87171','Insular':'#EA93F5','Los Llanos':'#F5EF14',
    'Occidental':'#F7A34C','Occidental (Zuliana)':'#D51A1A',
};

const MENU_BG=['#FFE902','#003DA5','#CF0A0A']; // Amarillo, Azul, Rojo

/* ─── UTILS ───────────────────────────────────────── */
function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
}
function fmt(n){
    try {
        return Number(n).toLocaleString('es-VE');
    } catch {
        return Number(n).toLocaleString();
    }
}

function flagSrc(nombre){
    const slug=FLAG_SLUG[nombre];
    if(!slug)return '';
    return `./assets/banderas/${slug}.svg`;
}

function setFlag(imgEl, nombre){
    if(!imgEl)return;
    const slug=FLAG_SLUG[nombre];
    if(!slug){
        imgEl.alt='🏴';
        imgEl.removeAttribute('src');
        return;
    }
    imgEl.alt=nombre;
    imgEl.src=`./assets/banderas/${slug}.svg`;
    imgEl.onerror=()=>{
        imgEl.onerror=null;
        imgEl.alt='🏴 '+nombre;
        imgEl.removeAttribute('src');
    };
}

function getDistractors(pool,current,tipo,n=3){
    const others=shuffle(pool.filter(e=>e.id!==current.id));
    let candidates;
    switch(tipo){
        case'capital':
            candidates=others.map(e=>e.capital);
            break;
        case'ciudad_mas_poblada':
            candidates=others.map(e=>e.ciudad_mas_poblada.split('/')[0].trim());
            break;
        case'region_geografica':{
            const all=[...new Set(pool.map(e=>e.region_geografica))].filter(r=>r!==current.region_geografica);
            candidates=shuffle(all);
            break;
        }
        case'gentilicio':
            candidates=others.map(e=>e.gentilicio.split('(')[0].trim());
            break;
        case'platos_tipicos':
            candidates=others.map(e=>e.platos_tipicos[0]);
            break;
        case'bellezas_naturales':
            candidates=others.map(e=>e.bellezas_naturales[0]);
            break;
        case'sitios_emblematicos':
            candidates=others.map(e=>e.sitios_emblematicos[0]);
            break;
        case'punto_mas_alto':
            candidates=others.map(e=>e.punto_mas_alto);
            break;
        case'actividad_economica':
            candidates=others.map(e=>e.actividad_economica.split(',')[0].trim());
            break;
        default:
            candidates=others.map(e=>e.nombre);
    }
    while(candidates.length < n) candidates.push('???');
    return candidates.slice(0,n);
}

/* ─── AUDIO ───────────────────────────────────────── */
class Aud{
    constructor(){
        this._m=sessionStorage.getItem('gv_m')==='1';
        this._s=sessionStorage.getItem('gv_s')==='1';
        this._sfx={};this._dt=null;
        this._bg=new Audio('./assets/sounds/music-fondo.ogg');
        this._bg.loop=true;this._bg.volume=.28;this._bg.muted=this._m;this._bg.preload='auto';
        const t=parseFloat(sessionStorage.getItem('gv_t')||'0');
        if(t>0)this._bg.currentTime=t;
        setInterval(()=>{if(!this._bg.paused&&this._bg.currentTime>0)sessionStorage.setItem('gv_t',this._bg.currentTime);},250);
        ['pagehide','beforeunload'].forEach(e=>window.addEventListener(e,()=>this._sv()));
        window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')this._sv();});
        if(this._s)this._pl();
    }
    _sv(){if(!this._bg.paused)sessionStorage.setItem('gv_t',this._bg.currentTime);}
    _pl(){if(this._m)return;this._bg.play().catch(()=>{this._s=false;sessionStorage.removeItem('gv_s');});}
    unlock(){if(this._s)return;this._s=true;sessionStorage.setItem('gv_s','1');this._pl();}
    toggleMute(){this._m=!this._m;this._bg.muted=this._m;sessionStorage.setItem('gv_m',this._m?'1':'0');document.querySelectorAll('.snd').forEach(b=>b.textContent=this._m?'🔇':'🔊');if(!this._m)this._pl();}
    sfx(n){
        if(this._m)return;
        if(!this._sfx[n]){this._sfx[n]=new Audio(`./assets/sounds/${n}.ogg`);this._sfx[n].volume=.62;}
        const a=this._sfx[n];a.currentTime=0;
        if(n==='win'||n==='lose')this._duck();
        a.play().catch(()=>{});
    }
    _duck(){if(this._m)return;clearTimeout(this._dt);const o=.28,l=.08;this._bg.volume=l;this._dt=setTimeout(()=>{let i=0;const iv=setInterval(()=>{i++;this._bg.volume=l+(o-l)*(i/20);if(i>=20)clearInterval(iv);},40);},850);}
    get muted(){return this._m;}
}

/* ─── DATA ────────────────────────────────────────── */
let estados=[];
const ldEl=document.getElementById('loading');
try{
    const res=await fetch('./estados.json');
    const data=await res.json();
    estados=data.estados_venezuela||[];
}catch(e){
    ldEl.innerHTML='<p style="color:#CF0A0A;font-family:Nunito,sans-serif;padding:32px;text-align:center">⚠️ Error cargando estados.json</p>';
    return;
}

const audio=new Aud();
let eng=null;

function show(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
}

/* ─── SPLASH ─────────────────────────────────────── */
function initSplash(){
    show('splash');
    document.getElementById('sp-btn').addEventListener('click',()=>{
        audio.unlock();audio.sfx('click');
        const sp=document.getElementById('splash');
        sp.style.transition='opacity .38s ease';sp.style.opacity='0';
        setTimeout(()=>{sp.classList.add('hidden');buildMenu();show('menu');},380);
    },{once:true});
}

/* ─── MENU (CON IMÁGENES Y COLORES CORREGIDOS) ───── */
function buildMenu(){
    const mn=document.getElementById('menu');
    const games=[
        {key:'game1',ac:'y',img:'medano.webp',badge:'🏴 BANDERAS',title:'Quiz de Banderas',desc:'Identifica las 25 banderas de Venezuela.'},
        {key:'game2',ac:'b',img:'roques.webp',badge:'📍 MAPA',title:'Ruta en el Mapa',desc:'Un estado está resaltado en el mapa. ¡Identifícalo!'},
        {key:'game3',ac:'r',img:'caracas.webp',badge:'💰 MILLONARIO',title:'Odisea Venezolana',desc:'15 niveles épicos con comodines.'},
    ];
    mn.innerHTML='';
    mn.style.background=MENU_BG[0];
    mn.classList.add('on-y');
    const wrap=document.createElement('div');wrap.className='mn-wrap';
    wrap.innerHTML=`
        <header class="mn-hdr">
            <div class="mn-tl"><button class="mn-icn" id="mn-enc">📖</button></div>
            <div class="mn-logo"><span class="mla">GEO</span><span class="mlb">VEN</span></div>
            <p class="mn-tag">Domina la geografía de Venezuela</p>
            <div class="mn-ddot">★ &nbsp;✦&nbsp; ★</div>
            <div class="mn-tr"><button class="mn-icn snd" id="mn-snd">${audio.muted?'🔇':'🔊'}</button></div>
        </header>
        <div class="mn-slider" id="mn-sl">
            ${games.map((g,i)=>`
            <div class="mn-slide"><div class="mn-card ${i===0?'active':''}" data-ac="${g.ac}" data-game="${g.key}">
                <div class="mn-badge">${g.badge}</div>
                <div class="mn-gfx">
                    <img src="./assets/${g.img}" alt="${g.title}" class="mn-card-img">
                </div>
                <div class="mn-body"><h2 class="mn-title">${g.title}</h2><p class="mn-desc">${g.desc}</p></div>
                <button class="mn-play" data-game="${g.key}">JUGAR <span>›</span></button>
            </div></div>`).join('')}
        </div>
        <div class="mn-dots" id="mn-dots">
            <span class="mn-dot on" data-i="0"></span>
            <span class="mn-dot" data-i="1"></span>
            <span class="mn-dot" data-i="2"></span>
        </div>
        <p class="mn-hint" id="mn-hint">‹ &nbsp; Desliza para explorar &nbsp; ›</p>`;
    mn.appendChild(wrap);
    wrap.querySelector('#mn-snd').addEventListener('click',e=>{e.stopPropagation();audio.toggleMute();});
    wrap.querySelector('#mn-enc').addEventListener('click',()=>{audio.sfx('click');openEnc();});
    const sl=wrap.querySelector('#mn-sl'),dots=wrap.querySelectorAll('#mn-dots .mn-dot'),hint=wrap.querySelector('#mn-hint');
    let active=0;
    function updateBg(i){
        mn.style.background=MENU_BG[i];
        mn.classList.remove('on-y','on-b','on-r');
        if(i===0) mn.classList.add('on-y');
        else if(i===1) mn.classList.add('on-b');
        else if(i===2) mn.classList.add('on-r');
    }
    sl.addEventListener('scroll',()=>{
        const cx=sl.scrollLeft+sl.offsetWidth/2;
        let cl=0,md=Infinity;
        sl.querySelectorAll('.mn-slide').forEach((s,i)=>{
            const d=Math.abs(s.offsetLeft+s.offsetWidth/2-cx);
            if(d<md){md=d;cl=i;}
        });
        if(cl!==active){
            active=cl;
            dots.forEach((d,i)=>d.classList.toggle('on',i===cl));
            wrap.querySelectorAll('.mn-card').forEach((c,i)=>c.classList.toggle('active',i===cl));
            updateBg(cl);
        }
        if(sl.scrollLeft>12)hint.classList.add('gone');
    },{passive:true});
    dots.forEach(d=>{
        d.addEventListener('click',()=>{
            const i=parseInt(d.dataset.i);
            sl.querySelectorAll('.mn-slide')[i]?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
        });
    });
    wrap.querySelectorAll('[data-game]').forEach(el=>{
        el.addEventListener('click',()=>{
            audio.sfx('click');
            launchGame(el.dataset.game);
        });
    });
    updateBg(0);
}

function goMenu() {
    if (eng) {
        eng.destroy();
        eng = null;
    }
    document.querySelectorAll('.modal-ov').forEach(m => m.remove());
    document.getElementById('game-screen').innerHTML = '';
    closeEnc();
    show('menu');
}

async function launchGame(key) {
    if(eng){
        eng.destroy();
        eng=null;
    }
    document.querySelectorAll('.modal-ov').forEach(m=>m.remove());
    const sc=document.getElementById('game-screen');
    sc.innerHTML='';
    show('game-screen');
    if (key === 'game1') eng = G1.init(sc);
    else if (key === 'game2') eng = await G2.init(sc);
    else if (key === 'game3') eng = G3.init(sc);
}

/* ─── ENCYCLOPEDIA ────────────────────────────────── */
function openEnc(){
    if(eng && typeof eng.pause === 'function') eng.pause();
    const panel=document.getElementById('enc-panel'),list=document.getElementById('enc-list');
    buildEncList([...estados].sort((a,b)=>a.nombre.localeCompare(b.nombre)),list);
    panel.classList.remove('hidden');panel.style.pointerEvents='auto';
    document.getElementById('enc-close').onclick=closeEnc;
    const si=document.getElementById('enc-search');si.value='';
    const fresh=si.cloneNode(true);si.parentNode.replaceChild(fresh,si);
    fresh.addEventListener('input',e=>{
        const q=e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        buildEncList(estados.filter(es=>{const t=(es.nombre+es.capital).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return t.includes(q);}),list);
    });
}
function closeEnc(){
    ['enc-panel','state-detail'].forEach(id=>{const el=document.getElementById(id);if(el){el.classList.add('hidden');el.style.pointerEvents='none';}});
    if(eng && typeof eng.resume === 'function' && eng.isPaused()) eng.resume();
}
function buildEncList(list,container){
    container.innerHTML='';
    list.forEach(est=>{
        const item=document.createElement('div');item.className='enc-item';
        const fw=document.createElement('div');fw.className='enc-flag';
        const img=document.createElement('img');setFlag(img,est.nombre);fw.appendChild(img);
        item.appendChild(fw);
        item.insertAdjacentHTML('beforeend',`<div style="flex:1;min-width:0"><div class="enc-name">${est.nombre}</div><div class="enc-meta">${est.capital} · ${est.region_geografica}</div></div><span class="enc-arr">›</span>`);
        item.addEventListener('click',()=>openStateDetail(est));
        container.appendChild(item);
    });
}
function openStateDetail(est){
    if(eng && typeof eng.pause === 'function') eng.pause();
    const detail=document.getElementById('state-detail'),inner=document.getElementById('state-detail-inner');
    const rc=REG_COLOR[est.region_geografica]||'#003DA5';
    inner.innerHTML=`
        <div class="st-inner">
            <div class="st-hero">
                <img id="st-hi" alt="${est.nombre}">
                <div class="st-hero-ov">
                    <h1 class="st-nombre">${est.nombre}</h1>
                    <span class="st-region" style="background:${rc}90">${est.region_geografica}</span>
                </div>
                <button class="st-back">← Volver</button>
            </div>
            <div class="st-body">
                <div class="st-grid">
                    <div class="st-stat"><span class="st-stat-l">Capital</span><span class="st-stat-v">${est.capital}</span></div>
                    <div class="st-stat"><span class="st-stat-l">Ciudad más poblada</span><span class="st-stat-v">${est.ciudad_mas_poblada}</span></div>
                    <div class="st-stat"><span class="st-stat-l">Superficie</span><span class="st-stat-v">${est.superficie}</span></div>
                    <div class="st-stat"><span class="st-stat-l">Población</span><span class="st-stat-v">${est.poblacion}</span></div>
                    <div class="st-stat"><span class="st-stat-l">Gentilicio</span><span class="st-stat-v">${est.gentilicio}</span></div>
                    <div class="st-stat"><span class="st-stat-l">Punto más alto</span><span class="st-stat-v">${est.punto_mas_alto}</span></div>
                </div>
                <p class="st-prose">${genProse(est)}</p>
                <div><p class="st-sec">🍽️ Platos típicos</p><div class="st-tags">${est.platos_tipicos.map(p=>`<span class="st-tag">${p}</span>`).join('')}</div></div>
                <div><p class="st-sec">🏞️ Bellezas naturales</p><div class="st-tags">${est.bellezas_naturales.map(b=>`<span class="st-tag">${b}</span>`).join('')}</div></div>
                <div><p class="st-sec">🏛️ Sitios emblemáticos</p><div class="st-tags">${est.sitios_emblematicos.map(s=>`<span class="st-tag">${s}</span>`).join('')}</div></div>
                <div><p class="st-sec">⚙️ Economía</p><p class="st-prose" style="margin:0">${est.actividad_economica}</p></div>
                <div><p class="st-sec">🧭 Límites</p><p class="st-prose" style="margin:0;font-size:.83rem">${est.limites}</p></div>
            </div>
        </div>`;
    setFlag(inner.querySelector('#st-hi'),est.nombre);
    inner.querySelector('.st-back').onclick=()=>{
        detail.classList.add('hidden');detail.style.pointerEvents='none';
        if(eng && typeof eng.resume === 'function' && eng.isPaused() && !document.getElementById('enc-panel').classList.contains('hidden')){
            // La enciclopedia sigue abierta, no reanudamos
        } else if(eng && typeof eng.resume === 'function') {
            eng.resume();
        }
    };
    detail.classList.remove('hidden');detail.style.pointerEvents='auto';detail.scrollTop=0;
}
function genProse(e){return `<strong>${e.nombre}</strong> se ubica en la región <strong>${e.region_geografica}</strong> de Venezuela, con capital en <strong>${e.capital}</strong>. Con ${e.superficie} y ${e.poblacion} de habitantes, sus pobladores son conocidos como <strong>${e.gentilicio.split('/')[0].trim()}</strong>. La gastronomía incluye platos como <strong>${e.platos_tipicos.slice(0,2).join(' y ')}</strong>. Entre sus bellezas destaca <strong>${e.bellezas_naturales[0]}</strong>. Su economía se apoya en ${e.actividad_economica.toLowerCase()}.`;}

/* =====================================================
   CLASE GE (MOTOR DE JUEGO) - CON TIME OUTS CONTROLADOS
===================================================== */
class GE{
    constructor(c){
        this.c = c.container;
        this.qs = c.questions || [];
        this.ts = c.timerSpeed ?? 0.75;
        this.lv = c.lives ?? 3;
        this.hasLL = c.hasLifelines ?? false;
        this.dark = c.dark ?? false;
        this.onRender = c.onRender ?? null;
        this.onGO = c.onGameOver ?? null;
        this.onV = c.onVictory ?? null;

        this.state = 'idle';
        this.s = null;
        this._modalActive = false;
        this._pauseRequested = false;
        this._timeouts = [];
    }

    start(){
        this.destroy();
        this.state = 'playing';
        this.s = {
            idx: 0,
            vidas: this.lv,
            pts: 0,
            combo: 1,
            streak: 0,
            time: 100,
            timer: null,
            ll: { fifty: true, truth: true }
        };
        this._loadQ();
    }

destroy() {
    if (this.s?.timer) clearInterval(this.s.timer);
    if (this._timeouts) {
        this._timeouts.forEach(id => clearTimeout(id));
        this._timeouts = [];
    }
    this.state = 'idle';
    this.s = null;
    this._modalActive = false;
    this._pauseRequested = false;
    document.querySelectorAll('.modal-ov').forEach(m => m.remove());
    this._disableOpts(true);
}

    pause(){
        if(this.state === 'playing'){
            this._pauseRequested = true;
            this._setPaused(true);
        }
    }

    resume(){
        if(this._pauseRequested){
            this._pauseRequested = false;
            this._setPaused(false);
        }
    }

    isPaused(){
        return this.state === 'paused';
    }

    _setPaused(paused){
        if(paused){
            if(this.state === 'playing'){
                this.state = 'paused';
                if(this.s?.timer) clearInterval(this.s.timer);
                this._disableOpts(true);
            }
        } else {
            if(this.state === 'paused' && !this._pauseRequested){
                this.state = 'playing';
                this._disableOpts(false);
                this._startTimer();
            }
        }
    }

    _disableOpts(disabled=true){
        const opts = this.c.querySelectorAll('.opt');
        opts.forEach(btn => {
            if(disabled) btn.setAttribute('disabled', 'disabled');
            else btn.removeAttribute('disabled');
        });
    }

    _loadQ(){
        if(!this.s) return;
        if(this.s.idx >= this.qs.length){
            this._vic();
            return;
        }
        const q = this.qs[this.s.idx];
        if(this.onRender) this.onRender(q, this);
        this._buildOpts(q);
        if(this.hasLL) this._buildLL();
        if(this.state === 'playing'){
            this._disableOpts(false);
            this._startTimer();
        } else {
            this._disableOpts(true);
        }
    }

    _buildOpts(q){
        const grid = this.c.querySelector('.opts');
        if(!grid) return;
        grid.innerHTML = '';
        const lb = ['A','B','C','D'];
        q.ops.forEach((txt,i)=>{
            const btn = document.createElement('button');
            btn.className = `opt ${this.dark?'dk':'lt'}`;
            btn.innerHTML = `<span class="opt-lbl">${lb[i]}</span><span>${txt}</span>`;
            btn.addEventListener('click', (e)=>{
                e.preventDefault();
                e.stopImmediatePropagation();
                // Disable ALL buttons immediately to prevent any double-fire
                if(this.state !== 'playing' || this._modalActive) return;
                this._disableOpts(true);
                audio.sfx('click');
                i===q.correct ? this._correct(btn) : this._wrong(btn, q);
            }, { once: true });
            grid.appendChild(btn);
        });
    }

    _buildLL(){
        const ll = this.c.querySelector('.lifelines');
        if(!ll) return;
        const s = this.s;
        ll.innerHTML = `<button class="ll" id="ll50" ${!s.ll.fifty?'disabled':''}>50:50</button><button class="ll" id="lltr" ${!s.ll.truth?'disabled':''}>🔍 Pista</button>`;
        this.c.querySelector('#ll50')?.addEventListener('click', ()=> this._fifty());
        this.c.querySelector('#lltr')?.addEventListener('click', ()=> this._truth());
    }

    _startTimer() {
    if (this.state !== 'playing' || !this.s) return;
    clearInterval(this.s.timer);
    this.s.time = 100;
    const bar = this.c.querySelector('.g-bar');
    if (!bar) return;
    bar.style.width = '100%';
    bar.className = 'g-bar';
    this.s.timer = setInterval(() => {
        if (this.state !== 'playing') return;
        if (!this.s) { clearInterval(this.s.timer); return; }
        this.s.time -= this.ts;
        bar.style.width = Math.max(0, this.s.time) + '%';
        if (this.s.time <= 15) bar.className = 'g-bar crit';
        else if (this.s.time <= 40) bar.className = 'g-bar warn';
        if (this.s.time <= 0) {
            clearInterval(this.s.timer);
            if(this.state === 'playing' && !this._modalActive)
                this._wrong(null, this.qs[this.s.idx]);
        }
    }, 100);
}

    _correct(btn){
        if(this.state !== 'playing' || this._modalActive) return;
        this.state = 'paused';
        this._modalActive = true; // Set immediately to block any concurrent timer callback
        this._disableOpts(true);
        clearInterval(this.s.timer);
        btn.classList.add('correct');
        audio.sfx('win');
        this.s.streak++;
        if(this.s.streak >= 3) this.s.combo = 2;
        if(this.s.streak >= 6) this.s.combo = 3;
        const g = 100 * this.s.combo;
        this.s.pts += g;
        this._float(btn, `+${g}`, '#007830');
        const tid = setTimeout(()=> this._fb(true), 650);
        this._timeouts.push(tid);
    }

    _wrong(btn, q){
        if(this.state !== 'playing' || this._modalActive) return;
        this.state = 'paused';
        this._modalActive = true; // Set immediately to block any concurrent timer/click callback
        this._disableOpts(true);
        clearInterval(this.s.timer);
        this.s.vidas--;
        this.s.streak = 0;
        this.s.combo = 1;
        if(btn) btn.classList.add('wrong');
        this.c.querySelectorAll('.opt')[q.correct]?.classList.add('correct');
        const wrap = this.c.querySelector('.gw,.g2,.g3');
        wrap?.classList.add('shake');
        setTimeout(()=> wrap?.classList.remove('shake'), 350);
        if('vibrate' in navigator) navigator.vibrate([80,40,80]);
        audio.sfx('lose');
        this._updLives();
        const tid = setTimeout(()=> this._fb(false), 500);
        this._timeouts.push(tid);
    }

    _fb(ok) {
    // Clear any remaining pending timeouts
    this._timeouts.forEach(id => clearTimeout(id));
    this._timeouts = [];
    // Guard: if engine was destroyed between the timeout and now
    if(!this.s) return;
    document.querySelectorAll('.modal-ov').forEach(m => m.remove());
    const q = this.qs[this.s.idx];
    if (!q) return;
    // Snapshot mutable values before async gap
    const vidasLeft = this.s.vidas;
    const ov = document.createElement('div');
    ov.className = 'modal-ov';
    let flagHtml = '';
    if (q.estadoNombre) {
        const src = flagSrc(q.estadoNombre);
        flagHtml = `<div class="modal-flag"><img alt="${q.estadoNombre}" src="${src}" onerror="this.onerror=null;this.alt='🏴 ${q.estadoNombre}';this.removeAttribute('src');"></div>`;
    }
    ov.innerHTML = `<div class="modal-card ${ok?'ok':'err'}">${flagHtml}<span class="modal-icon">${ok?'✅':'💡'}</span><h3 class="modal-title">${ok?'¡Correcto!':'¡Casi!'}</h3><p class="modal-ans"><strong>Respuesta:</strong><br>${q.ops[q.correct]}</p><p class="modal-expl">${q.expl||''}</p><button class="modal-btn">CONTINUAR</button></div>`;
    document.body.appendChild(ov);
    ov.querySelector('.modal-btn').addEventListener('click', ()=>{
        if(!this.s) { ov.remove(); return; } // Guard: engine destroyed while modal was open
        this._modalActive = false;
        ov.remove();
        if (!ok && vidasLeft <= 0) {
            this._go();
            return;
        }
        this.s.idx++;
        if (this.s.idx >= this.qs.length) {
            this._vic();
        } else {
            if (this._pauseRequested) {
                this.state = 'paused';
                this._disableOpts(true);
            } else {
                this.state = 'playing';
                this._loadQ();
            }
        }
    }, { once: true });
}
    _go(){
        this.state = 'gameover';
        clearInterval(this.s.timer);
        this._disableOpts(true);
        const pts = this.s.pts;
        const idx = this.s.idx;
        if(this.onGO){
            this.onGO(idx, pts);
            return;
        }
        document.querySelectorAll('.modal-ov').forEach(m => m.remove());
        const ov = document.createElement('div');
        ov.className = 'modal-ov';
        ov.innerHTML = `<div class="modal-card modal-end go"><span class="modal-icon" style="font-size:2.8rem">💥</span><h2 class="end-title go">GAME OVER</h2><p class="end-pts">${fmt(pts)} puntos</p><button class="modal-btn btn-retry">REINTENTAR</button><button class="modal-btn btn-outline">MENÚ</button></div>`;
        document.body.appendChild(ov);
        const [retry, menu] = ov.querySelectorAll('.modal-btn');
        retry.addEventListener('click', ()=>{
            ov.remove();
            this.start();
        }, {once:true});
        menu.addEventListener('click', ()=>{
            ov.remove();
            goMenu();
        }, {once:true});
    }

    _vic(){
        this.state = 'victory';
        clearInterval(this.s.timer);
        this._disableOpts(true);
        const pts = this.s.pts;
        if(this.onV){
            this.onV(pts);
            return;
        }
        document.querySelectorAll('.modal-ov').forEach(m => m.remove());
        const ov = document.createElement('div');
        ov.className = 'modal-ov';
        ov.innerHTML = `<div class="modal-card modal-end vic"><span class="modal-icon" style="font-size:3rem">🏆</span><h2 class="end-title vic">¡VICTORIA!</h2><p class="end-pts">${fmt(pts)} puntos</p><button class="modal-btn btn-replay">JUGAR DE NUEVO</button><button class="modal-btn btn-outline">MENÚ</button></div>`;
        document.body.appendChild(ov);
        const [replay, menu] = ov.querySelectorAll('.modal-btn');
        replay.addEventListener('click', ()=>{
            ov.remove();
            this.start();
        }, {once:true});
        menu.addEventListener('click', ()=>{
            ov.remove();
            goMenu();
        }, {once:true});
    }

    _fifty(){
        if(this.state !== 'playing' || !this.s.ll.fifty || this._modalActive) return;
        this.s.ll.fifty = false;
        this.c.querySelector('#ll50').disabled = true;
        const c = this.qs[this.s.idx].correct;
        const bs = [...this.c.querySelectorAll('.opt')];
        let rm = 0;
        clearInterval(this.s.timer);
        for(let i=0; i<bs.length && rm<2; i++){
            if(i !== c){
                bs[i].classList.add('dim');
                bs[i].setAttribute('disabled','disabled');
                rm++;
            }
        }
        const tid = setTimeout(()=> {
            if(this.state === 'playing') this._startTimer();
        }, 300);
        this._timeouts.push(tid);
    }

    _truth(){
        if(this.state !== 'playing' || !this.s.ll.truth || this._modalActive) return;
        this.s.ll.truth = false;
        this.c.querySelector('#lltr').disabled = true;
        const btn = this.c.querySelectorAll('.opt')[this.qs[this.s.idx].correct];
        btn?.classList.add('glow');
        clearInterval(this.s.timer);
        const tid = setTimeout(()=> {
            btn?.classList.remove('glow');
            if(this.state === 'playing') this._startTimer();
        }, 3000);
        this._timeouts.push(tid);
    }

    _updLives(){
        const ds = this.c.querySelectorAll('.life');
        ds.forEach((d,i)=> d.classList.toggle('lost', i < (this.lv - this.s.vidas)));
    }

    _float(ref, txt, color){
        const el = document.createElement('div');
        el.className = 'fpts';
        el.textContent = txt;
        el.style.color = color;
        const r = ref.getBoundingClientRect();
        el.style.left = `${r.left + r.width/2}px`;
        el.style.top = `${r.top - 10}px`;
        document.body.appendChild(el);
        setTimeout(()=> el.remove(), 820);
    }
}

/* ═══════════════════════════════════════════════
   GAME 1 — QUIZ DE BANDERAS
═══════════════════════════════════════════════ */
const G1=(()=>{
    function buildQ(){
        // Fisher-Yates on questions order, then independent shuffle for each set of options
        return shuffle([...estados]).map(est=>{
            const c=est.nombre;
            // Fresh independent shuffle for distractors each time
            const d=shuffle(estados.filter(e=>e.id!==est.id)).slice(0,3).map(e=>e.nombre);
            const ops=shuffle([c,...d]); // Fisher-Yates on the 4 options
            return{ops,correct:ops.indexOf(c),estadoNombre:est.nombre,expl:`Bandera de <strong>${est.nombre}</strong>. Capital: ${est.capital}. Gentilicio: ${est.gentilicio.split('(')[0].trim()}.`};
        });
    }
    function init(sc){
        const qs=buildQ();
        sc.innerHTML=`
        <div class="gw g1">
            <header class="g-hdr">
                <button class="g-pill dk" id="g1b">← MENÚ</button>
                <div class="g-ctr"><span class="g-badge dk">🏴 QUIZ DE BANDERAS</span></div>
                <div class="g-hdr-grp">
                    <button class="g-pill dk" id="g1e">📖</button>
                    <button class="g-pill dk snd" id="g1s">${audio.muted?'🔇':'🔊'}</button>
                </div>
            </header>
            <div class="g-timer dk"><div class="g-bar"></div></div>
            <div class="g1-main">
                <div class="flag-box">
                    <img id="g1fi" class="flag-img" alt="">
                </div>
                <p class="g1-q">¿A qué estado pertenece esta bandera?</p>
                <div class="prog-row" style="width:100%;max-width:480px">
                    <span class="prog-txt lt" id="g1p">1 / ${qs.length}</span>
                    <div class="lives"><span class="life lt"></span><span class="life lt"></span><span class="life lt"></span></div>
                </div>
            </div>
            <div class="opts"></div>
        </div>`;
        sc.querySelector('#g1b').addEventListener('click', goMenu);
        sc.querySelector('#g1s').addEventListener('click', e=>{ e.stopPropagation(); audio.toggleMute(); });
        sc.querySelector('#g1e').addEventListener('click', ()=>{ audio.sfx('click'); openEnc(); });
        const e = new GE({container:sc, questions:qs, timerSpeed:.65, lives:3, dark:false,
            onRender(q,eng){
                const img = sc.querySelector('#g1fi');
                if(img) setFlag(img, q.estadoNombre);
                const p = sc.querySelector('#g1p');
                if(p) p.textContent = `${eng.s.idx+1} / ${qs.length}`;
            },
        });
        e.start();
        return e;
    }
    return{init};
})();

/* ═══════════════════════════════════════════════
   GAME 2 — RUTA EN EL MAPA
═══════════════════════════════════════════════ */
const G2 = (() => {
    let mapSVGString = null;
    const FALLBACK_SVG = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" fill="white">Error: mapa no disponible</text></svg>`;

    async function loadMapSVG() {
        if (mapSVGString) return mapSVGString;
        try {
            const res = await fetch('./assets/estados/mapa.svg');
            if (!res.ok) throw new Error('No se pudo cargar el SVG');
            let text = await res.text();
            text = text.replace(/<\?xml.*?\?>/gi, '')
                       .replace(/<!--.*?-->/gs, '')
                       .trim();
            mapSVGString = text;
        } catch (e) {
            console.warn('Usando SVG de respaldo', e);
            mapSVGString = FALLBACK_SVG;
        }
        return mapSVGString;
    }

    function buildQ() {
        const pool = shuffle(Object.keys(SVG_ID));
        return pool.map(svgId => {
            const nombre = SVG_ID[svgId];
            const estado = estados.find(e => e.nombre === nombre);
            const correcta = nombre;
            const dist = shuffle(Object.values(SVG_ID).filter(n => n !== nombre)).slice(0, 3);
            const ops = shuffle([correcta, ...dist]);
            return {
                svgId,
                nombre,
                ops,
                correct: ops.indexOf(correcta),
                expl: estado ? `${nombre} está en la región ${estado.region_geografica}. Capital: ${estado.capital}.` : '',
                estadoNombre: nombre,
            };
        });
    }

    function highlightState(svgEl, svgId, clase = 'estado-objetivo') {
        if (!svgEl) return;
        svgEl.querySelectorAll('*').forEach(el => {
            el.classList.remove('estado-objetivo', 'map-correct', 'map-wrong');
        });
        const target = svgEl.querySelector('#' + CSS.escape(svgId));
        if (target) {
            target.classList.add(clase);
            target.querySelectorAll('path, polygon, rect, circle, ellipse').forEach(el => {
                el.classList.add(clase);
            });
        } else {
            console.warn('No se encontró el elemento con id:', svgId);
        }
    }

    async function init(sc) {
        const qs = buildQ();
        const svgStr = await loadMapSVG();

        sc.innerHTML = `
        <div class="gw g2">
            <header class="g-hdr">
                <button class="g-pill" id="g2b">← MENÚ</button>
                <div class="g-ctr"><span class="g-badge">🗺️ RUTA EN EL MAPA</span></div>
                <div class="g-hdr-grp">
                    <button class="g-pill" id="g2e">📖</button>
                    <button class="g-pill snd" id="g2s">${audio.muted ? '🔇' : '🔊'}</button>
                </div>
            </header>
            <div class="g-timer"><div class="g-bar"></div></div>
            <div class="g2-main">
                <p class="g2-question">¿Cuál es el estado resaltado?</p>
                <div class="map-svg-wrap" id="g2-map"></div>
                <div class="g2-score-row">
                    <span class="prog-txt dk" id="g2p">1 / ${qs.length}</span>
                    <div class="lives"><span class="life dk"></span><span class="life dk"></span><span class="life dk"></span></div>
                    <div class="g2-chip" id="g2pts">✅ 0 pts</div>
                </div>
            </div>
            <div class="opts" style="margin-top:6px"></div>
        </div>`;

        sc.querySelector('#g2b').addEventListener('click', goMenu);
        sc.querySelector('#g2s').addEventListener('click', e => { e.stopPropagation(); audio.toggleMute(); });
        sc.querySelector('#g2e').addEventListener('click', () => { audio.sfx('click'); openEnc(); });

        const mapWrap = sc.querySelector('#g2-map');
        mapWrap.innerHTML = svgStr;
        const svgEl = mapWrap.querySelector('svg');

        const engine = new GE({
            container: sc,
            questions: qs,
            timerSpeed: .7,
            lives: 3,
            dark: true,
            onRender(q, eng) {
                if (!eng || !eng.s) return;
                if (svgEl) {
                    highlightState(svgEl, q.svgId, 'estado-objetivo');
                }
                const pp = sc.querySelector('#g2p');
                if (pp) pp.textContent = `${eng.s.idx + 1} / ${qs.length}`;
                const chip = sc.querySelector('#g2pts');
                if (chip) chip.textContent = `✅ ${fmt(eng.s.pts)} pts`;
            },
        });

        const origCorrect = engine._correct.bind(engine);
        const origWrong = engine._wrong.bind(engine);

        engine._correct = function(btn) {
            if (this.state !== 'playing' || this._modalActive) return;
            const q = this.qs[this.s.idx];
            if (svgEl && q) highlightState(svgEl, q.svgId, 'map-correct');
            origCorrect(btn);
            const chip = sc.querySelector('#g2pts');
            if (chip) chip.textContent = `✅ ${fmt(this.s.pts)} pts`;
        };

        engine._wrong = function(btn, q) {
            if (this.state !== 'playing' || this._modalActive) return;
            if (svgEl && q) highlightState(svgEl, q.svgId, 'map-wrong');
            origWrong(btn, q);
        };

        engine.start();
        return engine;
    }

    return { init };
})();

/* ═══════════════════════════════════════════════
   GAME 3 — ODISEA VENEZOLANA
═══════════════════════════════════════════════ */
const G3=(()=>{
    function buildQ(){
        const pool=shuffle([...estados]);
        const T1=['capital','region_geografica'],T2=['gentilicio','platos_tipicos','capital'],T3=['bellezas_naturales','sitios_emblematicos','punto_mas_alto','actividad_economica'];
        return Array.from({length:15},(_,i)=>{
            const est=pool[i%pool.length];const tier=i<5?T1:i<10?T2:T3;const tipo=tier[Math.floor(Math.random()*tier.length)];const inv=i>=5&&Math.random()<0.4;
            let c,p,x;
            if(inv){
                c=est.nombre;
                if(tipo==='platos_tipicos'){p=`"${est.platos_tipicos[0]}" es un plato típico de…`;x=`${est.platos_tipicos[0]} es de ${est.nombre}.`;}
                else if(tipo==='bellezas_naturales'){p=`"${est.bellezas_naturales[0]}" se encuentra en…`;x=`${est.bellezas_naturales[0]} es de ${est.nombre}.`;}
                else if(tipo==='sitios_emblematicos'){p=`"${est.sitios_emblematicos[0]}" está en…`;x=`${est.sitios_emblematicos[0]} es de ${est.nombre}.`;}
                else{p=`El gentilicio "${est.gentilicio.split('(')[0].trim()}" corresponde a…`;x=`El gentilicio de ${est.nombre} es ${est.gentilicio}.`;}
                const d=shuffle(estados.filter(e=>e.id!==est.id)).slice(0,3).map(e=>e.nombre);
                const ops=shuffle([c,...d]);return{q:p,ops,correct:ops.indexOf(c),expl:x,prize:PRIZES[i]};
            }else{
                if(tipo==='capital'){c=est.capital;p=`¿Capital de ${est.nombre}?`;x=`La capital es ${est.capital}.`;}
                else if(tipo==='region_geografica'){c=est.region_geografica;p=`¿Región de ${est.nombre}?`;x=`Región: ${est.region_geografica}.`;}
                else if(tipo==='gentilicio'){c=est.gentilicio.split('(')[0].trim();p=`¿Gentilicio de ${est.nombre}?`;x=`Gentilicio: ${est.gentilicio}.`;}
                else if(tipo==='platos_tipicos'){c=est.platos_tipicos[0];p=`¿Plato típico de ${est.nombre}?`;x=`Platos: ${est.platos_tipicos.join(', ')}.`;}
                else if(tipo==='bellezas_naturales'){c=est.bellezas_naturales[0];p=`¿Belleza natural de ${est.nombre}?`;x=`Bellezas: ${est.bellezas_naturales.join(', ')}.`;}
                else if(tipo==='sitios_emblematicos'){c=est.sitios_emblematicos[0];p=`¿Sitio emblemático de ${est.nombre}?`;x=`Sitios: ${est.sitios_emblematicos.join(', ')}.`;}
                else if(tipo==='punto_mas_alto'){c=est.punto_mas_alto;p=`¿Punto más alto de ${est.nombre}?`;x=`El más alto: ${est.punto_mas_alto}.`;}
                else{c=est.actividad_economica.split(',')[0].trim();p=`¿Actividad económica de ${est.nombre}?`;x=`Economía: ${est.actividad_economica}.`;}
                const d=getDistractors(estados,est,tipo,3);const ops=shuffle([c,...d]);
                return{q:p,ops,correct:ops.indexOf(c),expl:x,prize:PRIZES[i],estadoNombre:est.nombre};
            }
        });
    }
    function strip(idx){return PRIZES.map((p,i)=>{const s=SAFE_AT.includes(i),c=i===idx,d=i<idx;return `<div class="prow ${s?'safe':''} ${c?'cur':''} ${d?'past':''}"><span class="p-lv">${i+1}</span><span class="p-amt">${s?'⭐ ':''}${fmt(p)}</span></div>`;}).reverse().join('');}
    function init(sc){
        const qs=buildQ();
        sc.innerHTML=`
        <div class="gw g3">
            <header class="g-hdr">
                <button class="g-pill" id="g3b">← MENÚ</button>
                <div class="g-ctr"><span class="g-badge">🔥 ODISEA VENEZOLANA</span></div>
                <div class="g-hdr-grp">
                    <button class="g-pill" id="g3e">📖</button>
                    <button class="g-pill snd" id="g3s">${audio.muted?'🔇':'🔊'}</button>
                </div>
            </header>
            <div class="g-timer"><div class="g-bar"></div></div>
            <div class="g3-banner"><span class="g3-lvl" id="g3l">Nivel 1 / 15</span><span class="g3-prize" id="g3p">🔥 ${fmt(PRIZES[0])} pts</span></div>
            <div class="g3-main"><div class="g3-qbox"><p class="g3-q" id="g3q">Cargando…</p></div></div>
            <div class="opts col1"></div>
            <div class="lifelines"></div>
            <div class="pstrip-wrap"><div class="pstrip" id="g3st">${strip(0)}</div></div>
        </div>`;
        sc.querySelector('#g3b').addEventListener('click', goMenu);
        sc.querySelector('#g3s').addEventListener('click', e=>{ e.stopPropagation(); audio.toggleMute(); });
        sc.querySelector('#g3e').addEventListener('click', ()=>{ audio.sfx('click'); openEnc(); });
        const e = new GE({container:sc, questions:qs, timerSpeed:1.0, lives:1, hasLifelines:true, dark:true,
            onRender(q,eng){
                const idx = eng.s.idx, qEl = sc.querySelector('#g3q');
                if(qEl){ qEl.style.animation='none'; qEl.offsetHeight; qEl.style.animation=''; qEl.textContent = q.q; }
                sc.querySelector('#g3l').textContent = `Nivel ${idx+1} / 15`;
                sc.querySelector('#g3p').textContent = `🔥 ${fmt(PRIZES[idx])} pts`;
                const sp = sc.querySelector('#g3st');
                if(sp){ sp.innerHTML = strip(idx); sp.querySelector('.cur')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}); }
            },
            onGameOver: (idx, pts) => {
                let sf = 0;
                for(const sh of SAFE_AT) if(idx > sh) sf = PRIZES[sh];
                document.querySelectorAll('.modal-ov').forEach(m => m.remove());
                const ov = document.createElement('div'); ov.className = 'modal-ov';
                ov.innerHTML = `<div class="modal-card modal-end go"><span class="modal-icon" style="font-size:2.8rem">💥</span><h2 class="end-title go">¡FALLASTE!</h2><p class="end-pts">Nivel ${idx+1}</p>${sf>0?`<p class="end-safe">✅ Asegurado: ${fmt(sf)} pts</p>`:'<p class="end-sub">Sin niveles asegurados</p>'}<button class="modal-btn btn-retry">REINTENTAR</button><button class="modal-btn btn-outline">MENÚ</button></div>`;
                document.body.appendChild(ov);
                const [retry, menu] = ov.querySelectorAll('.modal-btn');
                retry.addEventListener('click', ()=>{ ov.remove(); e.start(); }, {once:true});
                menu.addEventListener('click', ()=>{ ov.remove(); goMenu(); }, {once:true});
            },
            onVictory: () => {
                document.querySelectorAll('.modal-ov').forEach(m => m.remove());
                const ov = document.createElement('div'); ov.className = 'modal-ov';
                ov.innerHTML = `<div class="modal-card modal-end vic"><span class="modal-icon" style="font-size:3rem">🏆</span><h2 class="end-title vic">¡UN MILLÓN!</h2><p class="end-pts">${fmt(PRIZES[14])} pts</p><p class="end-sub">¡Eres un maestro de la geografía venezolana!</p><button class="modal-btn btn-replay">JUGAR DE NUEVO</button><button class="modal-btn btn-outline">MENÚ</button></div>`;
                document.body.appendChild(ov);
                const [replay, menu] = ov.querySelectorAll('.modal-btn');
                replay.addEventListener('click', ()=>{ ov.remove(); e.start(); }, {once:true});
                menu.addEventListener('click', ()=>{ ov.remove(); goMenu(); }, {once:true});
            },
        });
        e.start();
        return e;
    }
    return{init};
})();

/* ─── BOOT ───────────────────────────────────────── */
if('serviceWorker' in navigator) window.addEventListener('load', ()=> navigator.serviceWorker.register('./sw.js').catch(()=>{}));
ldEl.style.transition = 'opacity .5s ease';
ldEl.style.opacity = '0';
setTimeout(()=>{
    ldEl.classList.add('hidden');
    initSplash();
}, 500);

})();