/* =====================================================================
   Codzo Bridal Engine: renders a full scroll-story landing page from
   window.SITE (each client's config.js), then wires up every effect.
   ===================================================================== */
(function(){
'use strict';
var S = window.SITE;
if (!S){ document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">No config.js found for this client.</p>'; return; }
var docEl = document.documentElement;
docEl.classList.add('js');
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) docEl.classList.add('rm');

/* ---------- helpers ---------- */
var esc = function(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var md = function(t){ return esc(t).replace(/\*(.+?)\*/g, '<em>$1</em>'); };           // *word* -> <em>word</em>
var pos = function(o){ return o && o.pos ? ' style="object-position:'+esc(o.pos)+'"' : ''; };
var img = function(o, extra){ return '<img src="'+esc(o.src)+'" alt="'+esc(o.alt||'')+'"'+pos(o)+(extra||' loading="lazy"')+'>'; };
var CH = (S.words && S.words.chapters) || ['One','Two','Three','Four','Five','Six'];
var ci = 0;
var CHX = ['Seven','Eight','Nine','Ten'];   // only used when optional sections push past six chapters
var chap = function(label){ var i = ci++; return '<p class="chap" data-fade><span class="num">'+esc(CH[i]||CHX[i-6]||'')+'</span><span class="ln"></span><span>'+esc(label)+'</span></p>'; };
var btn = function(href, label, tag){ tag = tag || 'a'; return tag === 'a' ? '<a class="btn" href="'+href+'"><i class="dot"></i><span>'+esc(label)+'</span></a>' : '<button class="btn" type="submit"><i class="dot"></i><span>'+esc(label)+'</span></button>'; };

var PLAY = '<svg viewBox="0 0 18 18"><path d="M2 1 L16 9 L2 17Z" fill="currentColor"/></svg>';
var cta = (S.words && S.words.cta) || 'Check your date';

/* ---------- theme ---------- */
var T = S.theme || {}, C = T.colors || {};
var cssMap = {ivory:'--ivory', blush:'--blush', blush2:'--blush-2', accent:'--peach', accentDark:'--peach-d', ink:'--ink', muted:'--taupe', deep:'--olive', deep2:'--olive-2', line:'--sage', silk:'--silk', silkEdge:'--silk-edge'};
Object.keys(cssMap).forEach(function(k){ if (C[k]) docEl.style.setProperty(cssMap[k], C[k]); });
if (T.fonts){
  if (T.fonts.display) docEl.style.setProperty('--display', "'"+T.fonts.display+"', Didot, Georgia, serif");
  if (T.fonts.script) docEl.style.setProperty('--script', "'"+T.fonts.script+"', cursive");
  if (T.fonts.body) docEl.style.setProperty('--body', "'"+T.fonts.body+"', 'Helvetica Neue', Arial, sans-serif");
  if (T.fonts.href){ var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = T.fonts.href; document.head.appendChild(lk); }
}
document.title = S.meta && S.meta.title || document.title;
if (S.meta && S.meta.description){ var m = document.createElement('meta'); m.name = 'description'; m.content = S.meta.description; document.head.appendChild(m); }

/* ---------- sections ---------- */
var B = S.brand, P = S.person, H = S.hero, PL = S.pull, A = S.about, J = S.journey, R = S.reels, W = S.testimonials, K = S.work, G = S.guides, BK = S.booking, F = S.footer || {};
var CL = S.clients, FT = S.featured, V = S.videos, INFO = S.info;
var SVS = [].concat(S.servicesSec || []), SV = SVS[0], SP = S.spotlight, FQ = S.faq, GL2 = S.gallery2;   // optional: services cards, a highlighted spotlight section, FAQ   // optional: selected clients, press features, video testimonials
var IG = P.instagram && P.instagram.url ? P.instagram : null;
var igLink = function(cls, label){ return '<a class="'+cls+'" href="'+esc(IG.url)+'" target="_blank" rel="noopener">'+label+'</a>'; };
var U = S.ui || {};
var u = function(k, d){ return U[k] != null ? U[k] : d; };      // optional per-lead wording for the fixed interface text
var ctaHref = (S.words && S.words.ctaUrl) || '#book';
var isExt = function(h){ return /^https?:/.test(h); };
var aBtn = function(href, label, cls){ return '<a class="'+(cls||'btn')+'" href="'+esc(href)+'"'+(isExt(href)?' target="_blank" rel="noopener"':'')+'><i class="dot"></i><span>'+esc(label)+'</span></a>'; };
var aLink = function(o){ return '<a class="link" href="'+esc(o.url)+'"'+(isExt(o.url)?' target="_blank" rel="noopener"':'')+'>'+esc(o.label)+'</a>'; };
var phTxt = function(t){ return esc(t).replace(/\[(.+?)\]/g,'<b class="ph" title="'+esc(u('phTitle','Placeholder: replace before going live'))+'">$1</b>'); };
var contactBits = [P.phone ? esc(u('call','call'))+' '+esc(P.phone) : '', P.email ? esc(P.email) : ''].filter(Boolean).join(' &nbsp;·&nbsp; ');
var brand = '<span class="b1">'+esc(B.line1)+'</span><span class="b2">'+esc(B.line2)+'</span>';
if (B.logo) brand = '<img class="b-logo'+(B.logoRound===false?' sq':'')+'" src="'+esc(B.logo)+'" alt="'+esc(B.name)+' logo" width="48" height="48"><span class="b-txt">'+brand+'</span>';

var secHead = function(o){ return '<div class="sec-head z"><div>'+chap(o.label)+'<h2 data-blur>'+md(o.heading)+'</h2></div>'+(o.text ? '<p data-fade>'+esc(o.text)+'</p>' : '')+'</div>'; };
var linkTag = function(url, cls, inner, extra){ return url ? '<a class="'+cls+'" href="'+esc(url)+'" target="_blank" rel="noopener"'+(extra||'')+'>'+inner+'</a>' : '<div class="'+cls+'"'+(extra||'')+'>'+inner+'</div>'; };
var initials = function(n){ return String(n).replace(/[^A-Za-zÀ-ɏ ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(function(w){ return w.charAt(0).toUpperCase(); }).join(''); };

var nav = '<a class="skip" href="#main">'+esc(u('skip','Skip to content'))+'</a>'+
 '<header class="nav" id="nav"><a class="brand'+(B.logo?' has-logo':'')+'" href="#top" aria-label="'+esc(B.name)+', back to top">'+brand+'</a>'+
 '<nav aria-label="Primary"><a href="#about">'+esc(u('aboutNav',P.first))+'</a>'+SVS.map(function(x,i){ return '<a href="#services'+(i ? '-'+(i+1) : '')+'">'+esc(x.navLabel||x.label)+'</a>'; }).join('')+(SP ? '<a href="#spot">'+esc(SP.navLabel||SP.label)+'</a>' : '')+'<a href="#journey">'+esc(J.navLabel||'Your journey')+'</a>'+(R ? '<a href="#reels">'+esc(R.label)+'</a>' : '')+(CL ? '<a href="#clients">'+esc(CL.navLabel||CL.label)+'</a>' : '')+(FT ? '<a href="#featured">'+esc(FT.navLabel||FT.label)+'</a>' : '')+(V ? '<a href="#voices">'+esc(V.navLabel||V.label)+'</a>' : '')+'<a href="#words">'+esc(W.label)+'</a><a href="#work">'+esc(K.label)+'</a>'+(GL2 ? '<a href="#gallery2">'+esc(GL2.navLabel||GL2.label)+'</a>' : '')+(INFO ? '<a href="#info">'+esc(INFO.navLabel||INFO.label)+'</a>' : '')+(FQ ? '<a href="#faq">'+esc(FQ.navLabel||FQ.label)+'</a>' : '')+'</nav>'+
 '<a class="btn btn-sm" href="'+esc(ctaHref)+'"'+(isExt(ctaHref)?' target="_blank" rel="noopener"':'')+'><i class="dot"></i><span>'+esc(cta)+'</span></a></header>';

var hero = '<section class="hero" id="top"><div class="wrap hero-grid"><div class="hero-copy z">'+
 '<p class="eyebrow" data-fade>'+esc(H.eyebrow)+'</p>'+
 '<h1 data-blur>'+(H.greetingScript ? '<span class="script">'+esc(H.greetingScript)+'</span> ' : '')+md(H.greeting)+'</h1>'+
 '<p class="lead" data-fade style="--d:500ms">'+esc(H.lead)+'</p>'+
 '<div class="cta-row" data-fade style="--d:700ms">'+aBtn(ctaHref, cta)+(H.cta2 ? aLink(H.cta2) : (IG ? igLink('link', esc(IG.cta || ('DM @'+IG.handle+' on Instagram'))) : '<a class="link" href="#work">'+esc(H.secondary||'See the work')+'</a>'))+'</div>'+
 '<p class="meta" data-fade style="--d:900ms">'+(H.facts||[]).map(function(x){ return '<span>'+esc(x)+'</span>'; }).join('')+'</p></div>'+
 '<div class="hero-art z"><svg class="bot" data-bot="hero" aria-hidden="true"></svg>'+
 '<figure class="arch-wrap hero-arch" data-reveal><div class="arch">'+img(H.image,' fetchpriority="high"')+'</div></figure>'+
 '<figure class="arch-wrap hero-mini" data-reveal><div class="arch">'+img(H.detail)+'</div></figure>'+
 '<p class="hero-cap" data-fade style="--d:1200ms">'+esc(H.detailCaption)+'</p></div></div>'+
 '<i class="rp" data-rib=".05" data-rib-m=".04" style="top:58%"></i><i class="rp" data-rib=".1" data-rib-m=".06" style="top:93%"></i>'+
 '<div class="scroll-cue" aria-hidden="true">'+esc((S.words && S.words.scroll)||'Scroll')+'<i></i></div></section>';

var pull = '<section class="pull" id="pull"><i class="rp" data-rib=".04" style="top:18%"></i><div class="wrap pull-grid"><div class="pull-copy z">'+
 '<p class="label" data-fade>'+esc(PL.label)+'</p><p class="pull-text" data-blur>'+md(PL.text)+'</p>'+
 (PL.roots ? '<p class="roots" data-fade style="--d:300ms">'+(PL.rootsScript ? '<span class="script">'+esc(PL.rootsScript)+'</span> ' : '')+esc(PL.roots)+'</p>' : '')+
 '</div><div class="tree-wrap z" id="treeWrap"><svg class="tree" id="tree" viewBox="0 0 600 640" role="img" aria-label="Line drawing of a tree that grows as you scroll"></svg></div></div>'+
 '<i class="rp" data-rib=".05" style="top:82%"></i><i class="rp" data-rib=".5" data-rib-m=".05" style="top:95%"></i></section>';

var about = '<section class="uno blush" id="about"><i class="rp" data-rib=".93" data-rib-m=".95" style="top:6%"></i><div class="wrap uno-grid">'+
 '<div class="uno-photos z"><figure class="arch-wrap uno-arch" data-reveal><div class="arch">'+img(A.portrait)+'</div></figure>'+
 '<figure class="frame uno-small" data-reveal><div class="ph-img">'+img(A.atWork)+'</div></figure><svg class="bot" data-bot="sprig" aria-hidden="true"></svg></div>'+
 '<div class="uno-copy z">'+chap(A.label)+'<h2 data-blur>'+md(A.heading)+'</h2><p class="sub-it" data-fade>'+esc(A.sub)+'</p>'+
 '<div class="body" data-fade style="--d:200ms">'+A.paragraphs.map(function(p){ return '<p>'+md(p)+'</p>'; }).join('')+'</div>'+
 '<span class="signature" data-fade style="--d:400ms">'+esc(A.signature||P.first)+'</span><a class="link" href="#journey" data-fade style="--d:500ms">'+esc(A.link||'How your day unfolds')+'</a></div></div>'+
 '<i class="rp" data-rib=".95" data-rib-m=".95" style="top:72%"></i><i class="rp" data-rib=".9" data-rib-m=".94" style="top:96%"></i></section>';

var services = SVS.map(function(SV, si){ return !SV.items || !SV.items.length ? '' : '<section class="svcs" id="services'+(si ? '-'+(si+1) : '')+'"><div class="wrap">'+secHead(SV)+'<div class="sv-grid z'+(SV.items.length===4?' two':'')+'">'+
 SV.items.map(function(x,i){ return '<article class="sv-card" data-fade style="--d:'+(i%3*110)+'ms">'+(x.image ? '<div class="sv-img">'+img(x.image)+'</div>' : '')+'<div class="sv-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p>'+(x.status ? '<p class="sv-status">'+phTxt(x.status)+'</p>' : '')+'</div></article>'; }).join('')+'</div></div></section>'; }).join('');

var spot = !SP ? '' : '<section class="spot" id="spot"><div class="wrap spot-grid"><div class="spot-art z"><figure class="arch-wrap" data-reveal><div class="arch">'+img(SP.image)+'</div></figure></div>'+
 '<div class="spot-copy z">'+chap(SP.label)+'<h2 data-blur>'+md(SP.heading)+'</h2><p class="spot-lead" data-fade>'+esc(SP.text)+'</p>'+(SP.text2 ? '<p class="spot-text" data-fade>'+esc(SP.text2)+'</p>' : '')+
 '<div class="spot-cards">'+(SP.cards||[]).map(function(c,i){ return '<div class="spot-card" data-fade style="--d:'+(i*100)+'ms"><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p>'+(c.status ? '<p class="sv-status">'+phTxt(c.status)+'</p>' : '')+'</div>'; }).join('')+'</div>'+
 '<div class="cta-row" data-fade>'+(SP.ctas||[]).map(function(c,i){ return aBtn(c.url, c.label, i ? 'btn btn-ghost' : 'btn'); }).join('')+'</div></div></div></section>';

var n = J.steps.length;
var journey = '<section class="journey" id="journey" aria-label="'+esc(J.heading.replace(/\*/g,''))+'" style="--jh:'+(n*100+40)+'vh">'+
 '<i class="rp" data-rib=".975" data-rib-m=".96" style="top:3%"></i><i class="rp" data-rib=".985" data-rib-m=".965" style="top:30%"></i><i class="rp" data-rib=".97" data-rib-m=".96" style="top:62%"></i><i class="rp" data-rib=".9" data-rib-m=".94" style="top:97%"></i>'+
 '<div class="j-sticky"><div class="wrap j-grid"><div class="j-head z"><div>'+chap(J.label)+'<h2 data-blur>'+md(J.heading)+'</h2></div>'+
 '<p class="j-count" aria-live="polite"><span id="jNow">01</span> / '+(n<10?'0':'')+n+'</p></div>'+
 '<div class="j-art z" aria-hidden="true"><figure class="arch-wrap" data-reveal><div class="arch">'+
 J.steps.map(function(s,i){ return '<img class="j-img'+(i===0?' on cur':'')+'" src="'+esc(s.image.src)+'" alt=""'+pos(s.image)+'>'; }).join('')+
 '</div></figure><svg class="bot" data-bot="branch" aria-hidden="true"></svg></div><div class="j-text z">'+
 J.steps.map(function(s,i){ return '<article class="j-panel'+(i===0?' on':'')+'"><figure class="arch-wrap j-mimg"><div class="arch">'+img(s.image)+'</div></figure>'+
   '<p class="j-n">'+esc(s.kicker)+'</p><h3>'+esc(s.title)+'</h3><p class="d">'+esc(s.text)+'</p>'+
   (s.quote ? '<blockquote>'+esc(s.quote)+'<cite>'+esc(s.cite)+'</cite></blockquote>' : '')+'</article>'; }).join('')+
 '</div><ol class="j-steps z" aria-label="Journey steps"><span class="j-fill" aria-hidden="true"></span><span class="j-pointer" aria-hidden="true"><svg viewBox="0 0 11 11"><path d="M5.5 0 L11 5.5 L5.5 11 L0 5.5Z" fill="currentColor"/></svg></span>'+
 J.steps.map(function(s,i){ return '<li><button type="button"'+(i===0?' class="on"':'')+' data-step="'+i+'"><span>'+esc(s.short||s.title)+'</span></button></li>'; }).join('')+
 '</ol></div></div></section>';

var reels = !R || !R.items || !R.items.length ? '' : '<section class="reels" id="reels"><i class="rp" data-rib=".95" data-rib-m=".96" style="top:2%"></i><i class="rp" data-rib=".985" data-rib-m=".97" style="top:40%"></i><i class="rp" data-rib=".98" data-rib-m=".97" style="top:97%"></i>'+
 '<div class="r-sticky"><div class="wrap r-head z"><div>'+chap(R.label)+'<h2 data-blur>'+md(R.heading)+'</h2></div><p data-fade>'+esc(R.text)+'</p>'+(R.cta ? '<div class="r-cta" data-fade>'+aLink(R.cta)+'</div>' : '')+'</div>'+
 '<div class="r-track z" id="rTrack">'+R.items.map(function(r){ return '<figure class="reel"><div class="arch">'+img(r)+
   '<button class="play" type="button" aria-label="Play reel: '+esc(r.title)+'">'+PLAY+'</button><span class="soon" role="status"></span></div>'+
   '<figcaption><b>'+esc(r.title)+'</b><span>'+esc(r.duration||'')+'</span></figcaption></figure>'; }).join('')+'</div></div></section>';

/* optional sections: selected clients, featured in, video testimonials (each only renders when its lead has data) */
var clients = !CL || !CL.items || !CL.items.length ? '' : (function(){
  var hasImg = CL.items.some(function(c){ return c.image; });
  var body = hasImg
    ? '<div class="c-grid z">'+CL.items.map(function(c,i){
        return '<figure class="c-card" data-fade style="--d:'+(i%4*110)+'ms"><div class="c-img">'+(c.image ? img(c.image) : '<span class="c-ph" aria-hidden="true">'+esc(initials(c.name))+'</span>')+'</div>'+
          '<figcaption>'+linkTag(c.url,'c-name','<b>'+esc(c.name)+'</b>')+(c.role ? '<span>'+esc(c.role)+'</span>' : '')+'</figcaption></figure>'; }).join('')+'</div>'
    : '<ul class="c-list z">'+CL.items.map(function(c,i){
        return '<li class="c-row" data-fade style="--d:'+(i%2*90)+'ms">'+linkTag(c.url,'c-name','<b>'+esc(c.name)+'</b>')+(c.role ? '<span>'+esc(c.role)+'</span>' : '')+'</li>'; }).join('')+'</ul>';
  return '<section class="clients" id="clients"><div class="wrap">'+secHead(CL)+body+'</div></section>';
})();

var featured = !FT || !FT.items || !FT.items.length ? '' : '<section class="featured blush" id="featured"><div class="wrap">'+secHead(FT)+'<div class="f-grid z">'+
  FT.items.map(function(f,i){
    var inner = '<span class="f-outlet">'+esc(f.outlet)+'</span>'+(f.title ? '<span class="f-title">'+esc(f.title)+'</span>' : '')+
      '<span class="f-meta"><span>'+esc(f.year||'')+'</span>'+(f.url ? '<i>'+esc(FT.more||'Read')+' &rarr;</i>' : '')+'</span>';
    return linkTag(f.url,'f-item',inner,' data-fade style="--d:'+(i%4*90)+'ms"'); }).join('')+'</div></div></section>';

var voices = !V || !V.items || !V.items.length ? '' : '<section class="voices" id="voices"><div class="wrap">'+secHead(V)+'<div class="v-row z">'+
  V.items.map(function(v,i){
    return '<figure class="v-card" data-fade style="--d:'+(i%4*110)+'ms"><div class="v-media" data-src="'+esc(v.src||'')+'" data-embed="'+esc(v.embed||'')+'" data-poster="'+esc(v.poster.src)+'" data-name="'+esc(v.name)+'">'+img(v.poster)+
      '<button class="play" type="button" aria-label="Play video: '+esc(v.name)+'">'+PLAY+'</button><span class="soon" role="status"></span></div>'+
      '<figcaption><b>'+esc(v.name)+'</b>'+(v.role ? '<span>'+esc(v.role)+'</span>' : '')+(v.quote ? '<q>'+esc(v.quote)+'</q>' : '')+'</figcaption></figure>'; }).join('')+'</div></div></section>';

var words = '<section class="words blush" id="words"><i class="rp" data-rib=".7" data-rib-m=".9" style="top:4%"></i><i class="rp" data-rib=".05" data-rib-m=".04" style="top:12%"></i><i class="rp" data-rib=".04" data-rib-m=".04" style="top:70%"></i><i class="rp" data-rib=".5" data-rib-m=".05" style="top:93%"></i>'+
 '<div class="wrap w-grid"><div class="w-photos z"><figure class="arch-wrap w-arch" data-reveal><div class="arch">'+img(W.photo)+'</div></figure>'+
 '<figure class="frame w-small" data-reveal><div class="ph-img">'+img(W.photoSmall)+'</div></figure></div>'+
 '<div class="z">'+chap(W.label)+'<div class="w-stage" id="wStage" aria-live="polite">'+
 W.items.map(function(q,i){ return '<blockquote class="quote'+(i===0?' on':'')+'"><p>'+esc(q.text)+'</p><footer>'+esc(q.name)+'</footer></blockquote>'; }).join('')+
 '</div><div class="w-ctrl"><button class="arrow" type="button" id="wPrev" aria-label="Previous testimonial"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2 L4 8 L10 14" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>'+
 '<span class="w-count" id="wCount">1 / '+W.items.length+'</span><button class="arrow" type="button" id="wNext" aria-label="Next testimonial"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2 L12 8 L6 14" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button></div></div></div></section>';

var work = '<section class="work" id="work"><div class="wrap"><div class="work-head"><div class="z">'+chap(K.label)+'<h2 data-blur>'+md(K.heading)+'</h2></div><p class="z" data-fade>'+esc(K.text)+'</p></div>'+
 '<div class="work-grid">'+K.items.slice(0,7).map(function(w,i){ return '<figure class="wk wk'+(i+1)+' z"><div class="frame" data-reveal><div class="ph-img"'+(i===6?' style="aspect-ratio:4/3.2"':'')+'>'+img(w)+'</div></div>'+
   '<figcaption><span class="label">'+esc(w.tag)+'</span><b>'+esc(w.title)+'</b></figcaption></figure>'; }).join('')+'</div>'+
 '<div class="work-cta z">'+aBtn(ctaHref, cta)+(K.moreUrl && K.moreLabel ? '<a class="link" href="'+esc(K.moreUrl)+'">'+esc(K.moreLabel||'Full portfolio')+'</a>' : '')+'</div></div>'+
 '<i class="rp" data-rib=".02" data-rib-m=".04" style="top:6%"></i><i class="rp" data-rib=".5" data-rib-m=".04" style="top:27%"></i><i class="rp" data-rib=".55" data-rib-m=".96" style="top:46%"></i><i class="rp" data-rib=".9" data-rib-m=".96" style="top:62%"></i><i class="rp" data-rib=".97" data-rib-m=".96" style="top:96%"></i></section>';

var gal2 = !GL2 || !GL2.items || !GL2.items.length ? '' : '<section class="clients" id="gallery2"><div class="wrap">'+secHead(GL2)+'<div class="c-grid z">'+
 GL2.items.map(function(c,i){ return '<figure class="c-card" data-fade style="--d:'+(i%4*110)+'ms"><div class="c-img">'+img(c.image)+'</div><figcaption><b>'+esc(c.title)+'</b>'+(c.tag ? '<span>'+esc(c.tag)+'</span>' : '')+'</figcaption></figure>'; }).join('')+'</div></div></section>';
var info = !INFO || !INFO.cards || !INFO.cards.length ? '' : '<section class="info" id="info"><div class="wrap">'+secHead(INFO)+'<div class="i-grid z'+(INFO.cards.length===4?' two':'')+'">'+
 INFO.cards.map(function(c,i){ return '<div class="i-card" data-fade style="--d:'+(i*120)+'ms"><h3>'+esc(c.title)+'</h3><'+(c.kind==='steps'?'ol':'ul')+' class="i-list'+(c.kind==='steps'?' steps':'')+'">'+c.items.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</'+(c.kind==='steps'?'ol':'ul')+'>'+(c.note?'<p class="i-note">'+esc(c.note)+'</p>':'')+'</div>'; }).join('')+'</div></div></section>';
var faq = !FQ || !FQ.items || !FQ.items.length ? '' : '<section class="faq" id="faq"><div class="wrap">'+secHead(FQ)+'<div class="faq-list z">'+
 FQ.items.map(function(x,i){ return '<details class="faq-item" data-fade style="--d:'+(i%2*80)+'ms"><summary>'+esc(x.q)+'</summary><p>'+phTxt(x.a)+'</p></details>'; }).join('')+'</div></div></section>';
var guides = !G || !G.items || !G.items.length ? '' : '<section class="guides" id="guides"><i class="rp" data-rib=".975" data-rib-m=".96" style="top:40%"></i><i class="rp" data-rib=".95" data-rib-m=".95" style="top:99%"></i>'+
 '<div class="wrap"><div class="g-head z"><h2 data-blur>'+md(G.heading)+'</h2><p class="label" data-fade>'+esc(G.label)+'</p></div><div class="g-grid z">'+
 G.items.map(function(g,i){ return '<a class="g-card" href="'+esc(g.url||'#guides')+'" data-fade style="--d:'+(i*120)+'ms"><div class="g-img">'+img({src:g.src, alt:''})+'</div><div class="g-body"><span class="label">'+esc(G.kicker||'Guide')+'</span><h3>'+esc(g.title)+'</h3><p>'+esc(g.text)+'</p><span class="more">'+esc(G.more||'Read the guide')+'</span></div></a>'; }).join('')+
 '</div></div></section>';

var s0 = BK.services[0];
var opt = function(a){ return a.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join(''); };
var BL = BK.labels || {}, BH = BK.hide || [];
var fld = function(id, html){ return BH.indexOf(id) > -1 ? '' : html; };
var book = '<section class="book blush" id="book"><i class="rp" data-rib=".96" data-rib-m=".95" style="top:3%"></i><div class="wrap b-grid"><div class="z" id="bookMain">'+
 chap(BK.label)+'<h2 data-blur>'+md(BK.heading)+'</h2><p class="intro" data-fade>'+esc(BK.intro)+'</p>'+
 '<p class="price" data-fade>'+BK.facts.map(function(x){ return '<span>'+esc(x).replace(/\[(.+?)\]/g,'<b class="ph" title="Placeholder: replace before going live">$1</b>')+'</span>'; }).join('')+'</p>'+
 (BK.noForm ? '<div class="book-cta" data-fade>'+(BK.ctas||[]).map(function(c,i){ return aBtn(c.url, c.label, i ? 'btn btn-ghost' : 'btn'); }).join('')+'</div>' : '<form id="bookForm" novalidate><fieldset><legend class="label">'+esc(BK.question||'What are you planning?')+'</legend><div class="svc">'+
 BK.services.map(function(v,i){ return '<div><input type="radio" name="svc" id="s-'+esc(v.id)+'" value="'+esc(v.id)+'"'+(i===0?' checked':'')+'><label for="s-'+esc(v.id)+'"><b>'+esc(v.title)+'</b><small>'+esc(v.text)+'</small></label></div>'; }).join('')+
 '</div></fieldset><div class="fields">'+
 '<div class="field"><label for="f-name">'+esc(u('name','Your name'))+'</label><input id="f-name" name="name" autocomplete="name" required></div>'+
 '<div class="field"><label for="f-email">'+esc(u('email','Email'))+'</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>'+
 fld('date','<div class="field"><label for="f-date">'+esc(BL.date||'Wedding date')+'</label><input id="f-date" name="date" type="date"></div>')+
 fld('venue','<div class="field"><label for="f-venue">'+esc(BL.venue||'Venue')+'</label><input id="f-venue" name="venue" placeholder="'+esc(BL.venuePlaceholder||'Venue or town')+'"></div>')+
 fld('people','<div class="field"><label for="f-people">'+esc(BL.people||'Who needs styling?')+'</label><select id="f-people" name="people">'+opt(BK.people||['Just me','Me + 1 to 3','Me + 4 to 7','Me + 8 or more'])+'</select></div>')+
 fld('time','<div class="field"><label for="f-time">'+esc(BL.time||'Ready by')+'</label><select id="f-time" name="time">'+opt(BK.times||['Not sure yet','Before 11:00','11:00 to 13:00','After 13:00'])+'</select></div>')+
 '<div class="field full"><label for="f-msg">'+esc(BL.msg||'Anything else?')+'</label><textarea id="f-msg" name="msg" placeholder="'+esc(BL.msgPlaceholder||'Your dress, your inspiration, your accessories…')+'"></textarea></div></div>'+
 '<div class="form-foot">'+btn('', BK.submit||'Send my enquiry', 'button')+(IG ? igLink('btn btn-ghost', '<i class="dot"></i><span>'+esc(IG.button || 'DM on Instagram')+'</span>') : '')+(contactBits ? '<small>'+esc(u('or','Or'))+' '+contactBits+'</small>' : '')+'</div></form>'+
 '<div class="thanks" role="status" aria-live="polite"><h3>'+esc(BK.thanksWord||'Thank you')+'<span id="tName"></span>.</h3><p>'+esc(BK.thanksText||'Your enquiry is on its way.')+' <span id="tDate">'+esc(BK.thanksDateFallback||'your date')+'</span> '+esc(u('soon','very soon.'))+'</p></div>')+'</div>'+
 '<aside class="b-aside" aria-label="Your selection"><svg class="bow" id="bow" viewBox="0 0 120 120" aria-hidden="true">'+
 '<path class="bandp" pathLength="1" style="--i:0" d="M60 62 C 40 40, 10 38, 14 58 C 18 76, 44 70, 60 62"/><path class="bandp" pathLength="1" style="--i:1" d="M60 62 C 80 40, 110 38, 106 58 C 102 76, 76 70, 60 62"/><path class="bandp" pathLength="1" style="--i:2" d="M58 64 C 52 80, 44 96, 34 112"/><path class="bandp" pathLength="1" style="--i:2" d="M62 64 C 70 82, 78 98, 90 110"/>'+
 '<path pathLength="1" style="--i:0" d="M60 62 C 40 40, 10 38, 14 58 C 18 76, 44 70, 60 62"/><path pathLength="1" style="--i:1" d="M60 62 C 80 40, 110 38, 106 58 C 102 76, 76 70, 60 62"/><path pathLength="1" style="--i:2" d="M58 64 C 52 80, 44 96, 34 112"/><path pathLength="1" style="--i:2" d="M62 64 C 70 82, 78 98, 90 110"/><path pathLength="1" style="--i:3" d="M55 58 Q 60 54 65 58 Q 66 64 60 67 Q 54 64 55 58Z"/></svg>'+
 '<i class="rp" id="ribEnd" data-rib="-1" style="left:-14px;top:4px"></i><figure class="arch-wrap" data-reveal><div class="arch"><img id="sImg" src="'+esc(s0.src)+'" alt="'+esc(s0.alt)+'"'+pos(s0)+'></div></figure>'+
 '<p class="s-title" id="sTitle">'+esc(s0.title)+'</p><p class="s-quote" id="sQuote">'+esc(s0.quote)+'</p><svg class="bot" data-bot="bloom" aria-hidden="true"></svg></aside></div></section>';

var foot = '<footer class="foot"><svg class="bot in" data-bot="sprig" aria-hidden="true"></svg>'+
 '<a class="totop" href="#top" aria-label="'+esc(u('top','Back to top'))+'"><svg viewBox="0 0 30 150" aria-hidden="true"><path d="M15 0 C 6 30, 24 55, 14 85 C 6 108, 22 122, 15 146" stroke-width="6"/><path d="M15 0 C 6 30, 24 55, 14 85 C 6 108, 22 122, 15 146" stroke-width="1" style="stroke:var(--silk-edge)"/></svg><span>'+esc(u('top','Back to top'))+'</span></a>'+
 '<div class="wrap"><div class="f-grid"><div><a class="brand'+(B.logo?' has-logo':'')+'" href="#top" style="align-items:flex-start">'+brand+'</a><span class="ciao">'+esc((S.words && S.words.farewell)||'See you soon.')+'</span></div>'+
 '<div><h4>'+esc(u('studio','Studio'))+'</h4><p>'+(F.studio||[]).map(esc).join('<br>')+'</p></div>'+
 '<div><h4>'+esc(u('contact','Contact'))+'</h4><ul>'+(P.phone ? '<li><a href="tel:'+esc(String(P.phone).replace(/\s/g,''))+'">'+esc(P.phone)+'</a></li>' : '')+(P.email ? '<li><a href="mailto:'+esc(P.email)+'">'+esc(P.email)+'</a></li>' : '')+(IG ? '<li>'+igLink('', esc(u('dm','Instagram DM'))+' · @'+esc(IG.handle))+'</li>' : '')+'</ul></div>'+
 '<div><h4>'+esc(u('follow','Follow'))+'</h4><ul>'+(P.socials||[]).map(function(x){ return '<li>'+(x.url ? '<a href="'+esc(x.url)+'">'+esc(x.label)+'</a>' : esc(x.label))+'</li>'; }).join('')+'</ul></div></div>'+
 '<div class="f-bottom"><span>© '+new Date().getFullYear()+' '+esc(B.name)+'</span><span>'+esc(F.credit||'Website concept by Codzo')+'</span></div></div></footer>';

var sticky = !S.sticky || !S.sticky.length ? '' : '<div class="sticky-cta" role="group" aria-label="'+esc(u('stickyLabel','Contact'))+'">'+S.sticky.map(function(c,i){ return aBtn(c.url, c.label, i ? 'btn btn-ghost' : 'btn'); }).join('')+'</div>';
document.body.insertAdjacentHTML('afterbegin', nav+'<main id="main"><svg id="ribbon" aria-hidden="true" focusable="false"><path class="band" id="ribBand"/><path class="edge" id="ribEdge"/><path class="edge2" id="ribEdge2"/></svg>'+
  hero+pull+about+services+spot+journey+reels+clients+featured+voices+words+work+gal2+info+faq+guides+book+'</main>'+foot+sticky+'<canvas id="petals" aria-hidden="true"></canvas>');

/* ===================== effects ===================== */
var RM = document.documentElement.classList.contains('rm');
var $ = function(s, c){ return (c||document).querySelector(s); };
var $$ = function(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var clamp = function(v,a,b){ return Math.max(a, Math.min(b, v)); };
var isDesk = function(){ return window.innerWidth > 860; };

/* ---------- split words ---------- */
function split(el){
  var i = 0;
  (function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(n){
      if (n.nodeType === 3){
        var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
        parts.forEach(function(p){
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = p; frag.appendChild(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('w')) walk(n);
    });
  })(el);
}
$$('[data-blur]').forEach(split);
$$('.quote p').forEach(split);

/* ---------- botanicals ---------- */
function rng(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function bz(p0,p1,p2,p3,t){ var u=1-t; return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0], u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]; }
function bzd(p0,p1,p2,p3,t){ var u=1-t; return [3*u*u*(p1[0]-p0[0])+6*u*t*(p2[0]-p1[0])+3*t*t*(p3[0]-p2[0]), 3*u*u*(p1[1]-p0[1])+6*u*t*(p2[1]-p1[1])+3*t*t*(p3[1]-p2[1])]; }
var f = function(n){ return Math.round(n*10)/10; };
var MOT = {olive:[1,1], eucalyptus:[.62,2.1], laurel:[1.05,1.55], willow:[1.25,.75]}[(S.theme && S.theme.motif)||'olive'] || [1,1];
function leaf(b, a, L, W){
  L *= MOT[0]; W *= MOT[1];
  var d=[Math.cos(a),Math.sin(a)], n=[-d[1],d[0]], t=[b[0]+d[0]*L, b[1]+d[1]*L];
  var c1=[b[0]+d[0]*L*.42+n[0]*W, b[1]+d[1]*L*.42+n[1]*W], c2=[b[0]+d[0]*L*.42-n[0]*W, b[1]+d[1]*L*.42-n[1]*W];
  return { o:'M'+f(b[0])+' '+f(b[1])+' Q'+f(c1[0])+' '+f(c1[1])+' '+f(t[0])+' '+f(t[1])+' Q'+f(c2[0])+' '+f(c2[1])+' '+f(b[0])+' '+f(b[1]),
           r:'M'+f(b[0])+' '+f(b[1])+' L'+f(b[0]+d[0]*L*.82)+' '+f(b[1]+d[1]*L*.82) };
}
function olive(o, out){
  var R = rng(o.seed||7), p=[o.p0,o.p1,o.p2,o.p3];
  out.push({d:'M'+o.p0.join(' ')+' C'+o.p1.join(' ')+' '+o.p2.join(' ')+' '+o.p3.join(' '), c:''});
  var n = o.n||12, side = o.side||1, s = o.s||1;
  for (var k=0;k<n;k++){
    var t = .1 + .86*k/(n-1), b = bz(p[0],p[1],p[2],p[3],t), dv = bzd(p[0],p[1],p[2],p[3],t), ang = Math.atan2(dv[1],dv[0]);
    side = -side;
    var a = ang + side*(0.55 + R()*.35), L = (34 + R()*20)*s*(1 - t*.35), W = (7 + R()*3)*s*(1-t*.3);
    var lf = leaf(b, a, L, W); out.push({d:lf.o,c:''}); out.push({d:lf.r,c:'rib'});
    if (o.fruit && (k===3 || k===7)){
      var fa = ang - side*1.2, fs=[b[0]+Math.cos(fa)*14*s, b[1]+Math.sin(fa)*14*s];
      out.push({d:'M'+f(b[0])+' '+f(b[1])+' L'+f(fs[0])+' '+f(fs[1]),c:''});
      out.push({e:[fs[0]+Math.cos(fa)*6*s, fs[1]+Math.sin(fa)*6*s, 5*s, 7.5*s, fa*57.3+90], c:'fruit'});
    }
  }
  var end = leaf(o.p3, Math.atan2(o.p3[1]-o.p2[1], o.p3[0]-o.p2[0]), 30*s, 6*s); out.push({d:end.o,c:''});
}
function blossom(cx, cy, r, rot, out, fill){
  for (var k=0;k<5;k++){
    var a = rot + k*Math.PI*2/5, d=[Math.cos(a),Math.sin(a)], n=[-d[1],d[0]];
    var b=[cx+d[0]*r*.16, cy+d[1]*r*.16], t=[cx+d[0]*r, cy+d[1]*r], w=r*.5;
    var c1=[cx+d[0]*r*.75+n[0]*w, cy+d[1]*r*.75+n[1]*w], c2=[cx+d[0]*r*.75-n[0]*w, cy+d[1]*r*.75-n[1]*w];
    out.push({d:'M'+f(b[0])+' '+f(b[1])+' C'+f(c1[0])+' '+f(c1[1])+' '+f(t[0]+n[0]*w*.6)+' '+f(t[1]+n[1]*w*.6)+' '+f(t[0])+' '+f(t[1])+' C'+f(t[0]-n[0]*w*.6)+' '+f(t[1]-n[1]*w*.6)+' '+f(c2[0])+' '+f(c2[1])+' '+f(b[0])+' '+f(b[1]), c: fill?'petal-fill':''});
  }
  for (var j=0;j<6;j++){
    var a2 = rot + .3 + j*Math.PI*2/6, e=[cx+Math.cos(a2)*r*.42, cy+Math.sin(a2)*r*.42];
    out.push({d:'M'+f(cx)+' '+f(cy)+' L'+f(e[0])+' '+f(e[1]), c:'rib'});
    out.push({ci:[e[0],e[1],1.6], c:''});
  }
  out.push({ci:[cx,cy,r*.12], c:''});
}
var PRESETS = {
  hero: function(o){ olive({p0:[60,690],p1:[70,430],p2:[300,250],p3:[560,70],n:15,s:1.15,seed:11,fruit:1},o);
                     olive({p0:[130,560],p1:[60,470],p2:[30,380],p3:[20,250],n:7,s:.9,seed:5,side:-1},o);
                     blossom(500,150,36,.2,o); blossom(548,262,24,1.1,o); blossom(66,320,20,.5,o); return '0 0 600 720'; },
  sprig: function(o){ olive({p0:[20,230],p1:[120,190],p2:[240,90],p3:[390,50],n:10,s:.95,seed:3,fruit:1},o); blossom(318,118,26,.4,o); blossom(360,170,16,1,o); return '0 0 400 260'; },
  branch: function(o){ olive({p0:[220,600],p1:[180,420],p2:[30,260],p3:[60,20],n:13,s:1,seed:9,fruit:1},o); blossom(120,330,22,.7,o); return '0 0 260 620'; },
  bloom: function(o){ olive({p0:[20,290],p1:[90,250],p2:[170,170],p3:[300,120],n:9,s:.9,seed:21},o); blossom(210,150,40,.3,o,1); blossom(286,226,28,1,o,1); blossom(130,232,18,.6,o,1); return '0 0 340 320'; }
};
$$('svg.bot').forEach(function(svg){
  var o=[], vb = PRESETS[svg.getAttribute('data-bot')](o), h='';
  o.forEach(function(it, i){
    var st = ' style="--i:'+i+'" pathLength="1"', cl = it.c ? ' class="'+it.c+'"' : '';
    if (it.d) h += '<path'+cl+st+' d="'+it.d+'"/>';
    else if (it.ci) h += '<circle'+cl+st+' cx="'+f(it.ci[0])+'" cy="'+f(it.ci[1])+'" r="'+f(it.ci[2])+'"/>';
    else if (it.e) h += '<ellipse'+cl+st+' cx="'+f(it.e[0])+'" cy="'+f(it.e[1])+'" rx="'+f(it.e[2])+'" ry="'+f(it.e[3])+'" transform="rotate('+f(it.e[4])+' '+f(it.e[0])+' '+f(it.e[1])+')"/>';
  });
  svg.setAttribute('viewBox', vb); svg.setAttribute('preserveAspectRatio','xMidYMid meet'); svg.innerHTML = h;
});

/* ---------- olive tree, scrubbed by scroll ---------- */
var treeSvg = $('#tree'), treeEls = [], treeP = -1, gust = 0, gustV = 0, gustG = null;
(function buildTree(){
  var R = rng(2026), items = [];
  var add = function(tag, attrs, cls, a, b, grp){ items.push({tag:tag, at:attrs, c:cls, a:a, b:b, g:grp}); };
  var q = function(P,C,E,t){ var u=1-t; return [u*u*P[0]+2*u*t*C[0]+t*t*E[0], u*u*P[1]+2*u*t*C[1]+t*t*E[1]]; };
  var qd = function(P,C,E,t){ return [2*(1-t)*(C[0]-P[0])+2*t*(E[0]-C[0]), 2*(1-t)*(C[1]-P[1])+2*t*(E[1]-C[1])]; };
  // ground + roots
  add('path', {d:'M60 602 C 160 594, 220 606, 300 600 S 470 596, 545 603'}, 'gr', 0, .12, 'base');
  add('path', {d:'M120 612 C 170 608, 200 614, 250 611'}, 'gr bark', .02, .12, 'base');
  add('path', {d:'M360 612 C 400 609, 440 614, 490 610'}, 'gr bark', .03, .13, 'base');
  [['M288 598 C 270 604, 252 606, 236 612',.06],['M312 598 C 330 605, 350 606, 368 613',.07],['M296 600 C 292 608, 286 614, 276 620',.08]].forEach(function(r){ add('path',{d:r[0]},'t1',r[1],r[1]+.08,'base'); });
  // gnarled trunk: two outlines + bark lines
  add('path', {d:'M276 600 C 268 560, 296 530, 282 494 C 272 468, 292 452, 284 438'}, 't0', .08, .3, 'base');
  add('path', {d:'M326 600 C 336 564, 306 534, 320 498 C 328 472, 310 454, 318 438'}, 't0', .09, .31, 'base');
  add('path', {d:'M296 586 C 290 556, 312 530, 300 500'}, 'bark', .16, .3, 'base');
  add('path', {d:'M306 520 C 312 500, 300 484, 308 466'}, 'bark', .2, .32, 'base');
  // recursive limbs
  function limb(P, a, L, depth, t0){
    var bend = (R()-.5)*.6, E=[P[0]+Math.cos(a)*L, P[1]+Math.sin(a)*L], C=[P[0]+Math.cos(a+bend)*L*.55, P[1]+Math.sin(a+bend)*L*.55];
    var dur = .11 - depth*.012;
    add('path', {d:'M'+f(P[0])+' '+f(P[1])+' Q'+f(C[0])+' '+f(C[1])+' '+f(E[0])+' '+f(E[1])}, depth<2 ? 't'+depth : '', t0, t0+dur, 'canopy');
    // leaves along the limb
    if (depth >= 2){
      var n = depth >= 3 ? 3 : 2;
      for (var j=0;j<n;j++){
        var s = .28 + j*(.7/n) + R()*.05, pt = q(P,C,E,s), tg = qd(P,C,E,s), ang = Math.atan2(tg[1],tg[0]) + (j%2 ? .75 : -.75) + (R()-.5)*.3;
        var lf = leaf(pt, ang, 22 + R()*8, 4.6 + R()*1.4), la = t0 + dur*s + .02;
        add('path', {d:lf.o}, 'lf', la, la + .07, 'canopy');
        add('path', {d:lf.r}, 'bark', la + .03, la + .09, 'canopy');
      }
    }
    if (depth < 3){
      var k = depth === 0 ? 2 : (R() < .25 ? 3 : 2), spread = depth === 0 ? .72 : .58;
      for (var i=0;i<k;i++){
        var na = a + (i-(k-1)/2)*spread + (R()-.5)*.25, st = .62 + R()*.3, sp = q(P,C,E,st);
        limb(sp, na, L*(.6 + R()*.14), depth+1, t0 + dur*st*.9);
      }
    } else {
      // tip cluster: leaves, then olives or a blossom
      var ta = Math.atan2(E[1]-C[1], E[0]-C[0]);
      [-.5,.45].forEach(function(o, m){ var lf2 = leaf(E, ta+o, 22 + R()*6, 4.8); add('path',{d:lf2.o},'lf', t0+dur+.02+m*.015, t0+dur+.09+m*.015, 'canopy'); });
      var rr = R();
      if (rr < .38){
        var oa = ta + Math.PI/2*(R()<.5?1:-1), op=[E[0]+Math.cos(oa)*9, E[1]+Math.sin(oa)*9];
        add('path', {d:'M'+f(E[0])+' '+f(E[1])+' L'+f(op[0])+' '+f(op[1])}, 'fr', .8, .86, 'canopy');
        add('ellipse', {cx:f(op[0]+Math.cos(oa)*4), cy:f(op[1]+Math.sin(oa)*4), rx:3.6, ry:5.2, transform:'rotate('+f(oa*57.3+90)+' '+f(op[0]+Math.cos(oa)*4)+' '+f(op[1]+Math.sin(oa)*4)+')'}, 'fr', .84, .92, 'canopy');
      } else if (rr < .62){
        var bc=[E[0]+Math.cos(ta)*6, E[1]+Math.sin(ta)*6], ro=R()*6;
        for (var pk=0;pk<5;pk++){
          var pa = ro + pk*1.2566, d=[Math.cos(pa),Math.sin(pa)], nn=[-d[1],d[0]], tp=[bc[0]+d[0]*8, bc[1]+d[1]*8];
          add('path', {d:'M'+f(bc[0])+' '+f(bc[1])+' Q'+f(bc[0]+d[0]*6+nn[0]*4)+' '+f(bc[1]+d[1]*6+nn[1]*4)+' '+f(tp[0])+' '+f(tp[1])+' Q'+f(bc[0]+d[0]*6-nn[0]*4)+' '+f(bc[1]+d[1]*6-nn[1]*4)+' '+f(bc[0])+' '+f(bc[1])}, 'pf', .88+pk*.01, .96+pk*.008, 'canopy');
        }
      }
    }
  }
  var top=[300,440], base=-Math.PI/2;
  limb([292,446], base-1.0, 150, 0, .28);
  limb([298,440], base-.38, 168, 0, .3);
  limb([304,440], base+.3, 160, 0, .29);
  limb([310,446], base+.95, 146, 0, .31);
  // normalise timings into 0..1
  var mx = 0; items.forEach(function(it){ mx = Math.max(mx, it.b); });
  var h = '<g class="base">', hc = '';
  items.forEach(function(it, i){
    it.a /= mx; it.b /= mx;
    var at = ' pathLength="1" data-i="'+i+'"' + (it.c ? ' class="'+it.c+'"' : '');
    for (var k in it.at) at += ' '+k+'="'+it.at[k]+'"';
    var el = '<'+it.tag+at+'/>';
    if (it.g === 'base') h += el; else hc += el;
  });
  treeSvg.innerHTML = h + '</g><g class="sway"><g class="gust">' + hc + '</g></g>';
  $$('[data-i]', treeSvg).forEach(function(el){ var it = items[+el.getAttribute('data-i')]; treeEls.push({el:el, a:it.a, b:it.b, fill: /\b(lf|pf)\b/.test(it.c||'')}); });
  gustG = $('.gust', treeSvg);
})();
var treeWrap = $('#treeWrap');
function updTree(){
  var p;
  if (RM) p = 1;
  else {
    var r = treeWrap.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;
    p = clamp((vh*.92 - r.top) / (vh*.92 - vh*.12 + r.height*.15), 0, 1);
  }
  if (Math.abs(p - treeP) < .0015) return; treeP = p;
  for (var i=0;i<treeEls.length;i++){
    var t = treeEls[i], v = clamp((p - t.a)/(t.b - t.a), 0, 1);
    t.el.style.strokeDashoffset = 1 - v;
    if (t.fill) t.el.style.fillOpacity = t.el.classList.contains('pf') ? v*.9 : v*.05;
  }
}
// a cursor passing through the canopy bends it like a breeze
if (!RM){
  var gLast = null, gRun = false;
  treeWrap.addEventListener('pointermove', function(e){
    if (gLast !== null) gustV += (e.clientX - gLast)*.05;
    gLast = e.clientX;
    if (!gRun){ gRun = true; requestAnimationFrame(gTick); }
  });
  treeWrap.addEventListener('pointerleave', function(){ gLast = null; });
  function gTick(){
    gustV += -gust*.06; gustV *= .86; gust += gustV; gust = clamp(gust, -4, 4);
    gustG.style.transform = 'rotate('+gust.toFixed(3)+'deg)';
    if (Math.abs(gust) > .005 || Math.abs(gustV) > .005) requestAnimationFrame(gTick); else { gRun = false; gustG.style.transform = ''; }
  }
}

/* ---------- reveal on view ---------- */
var io = new IntersectionObserver(function(es){
  es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.18, rootMargin:'0px 0px -6% 0px'});
$$('[data-reveal],[data-blur],[data-fade],svg.bot,#bow').forEach(function(el){ io.observe(el); });

/* ---------- ribbon ---------- */
var main = $('#main'), rsvg = $('#ribbon'), band = $('#ribBand'), edge = $('#ribEdge'), edge2 = $('#ribEdge2');
var rib = {L:0, s:[], top:0};
function buildRibbon(){
  var mr = main.getBoundingClientRect(), mTop = mr.top + window.scrollY, W = main.clientWidth, H = main.scrollHeight, mob = W < 760;
  rsvg.setAttribute('viewBox','0 0 '+W+' '+H); rsvg.style.height = H+'px'; rib.top = mTop;
  var pts = $$('.rp').map(function(el){
    var r = el.getBoundingClientRect(), fx = parseFloat(mob ? (el.getAttribute('data-rib-m')||el.getAttribute('data-rib')) : el.getAttribute('data-rib'));
    var x = fx < 0 ? (r.left + r.width/2 - mr.left) : fx*W;
    return {x:x, y:r.top + window.scrollY - mTop + r.height/2};
  }).sort(function(a,b){ return a.y-b.y; });
  // add gentle sway between distant points
  var P=[pts[0]], amp = mob ? 8 : 46, sgn = 1;
  for (var i=1;i<pts.length;i++){
    var a=P[P.length-1], b=pts[i], dy=b.y-a.y;
    if (dy > 420){ var steps = Math.min(4, Math.floor(dy/420)); for (var k=1;k<=steps;k++){ var t=k/(steps+1); sgn=-sgn; P.push({x:clamp(a.x+(b.x-a.x)*t + sgn*amp, 6, W-6), y:a.y+dy*t}); } }
    P.push(b);
  }
  var d = 'M'+f(P[0].x)+' '+f(P[0].y);
  for (var j=0;j<P.length-1;j++){
    var p0=P[j-1]||P[j], p1=P[j], p2=P[j+1], p3=P[j+2]||p2;
    d += ' C'+f(p1.x+(p2.x-p0.x)/6)+' '+f(p1.y+(p2.y-p0.y)/6)+' '+f(p2.x-(p3.x-p1.x)/6)+' '+f(p2.y-(p3.y-p1.y)/6)+' '+f(p2.x)+' '+f(p2.y);
  }
  [band,edge,edge2].forEach(function(p){ p.setAttribute('d', d); });
  edge.setAttribute('transform','translate(0,-3)'); edge2.setAttribute('transform','translate(0,3)');
  rib.L = band.getTotalLength();
  var N = Math.ceil(rib.L/14), my = -1e9; rib.s = [];
  for (var q=0;q<=N;q++){ var l=q*rib.L/N, pt=band.getPointAtLength(l); my=Math.max(my,pt.y); rib.s.push([l,my]); }
  [band,edge,edge2].forEach(function(p){ p.style.strokeDasharray = rib.L+' '+(rib.L+10); });
  drawRibbon(true);
}
var bowEl = $('#bow');
function drawRibbon(){
  if (!rib.L) return;
  var len;
  if (RM) len = rib.L;
  else {
    var target = window.scrollY + window.innerHeight*.62 - rib.top, lo=0, hi=rib.s.length-1;
    if (target <= rib.s[0][1]) len = 0;
    else { while (lo<hi){ var m=(lo+hi+1)>>1; if (rib.s[m][1] <= target) lo=m; else hi=m-1; } len = rib.s[lo][0]; }
  }
  var off = rib.L - len;
  band.style.strokeDashoffset = off; edge.style.strokeDashoffset = off; edge2.style.strokeDashoffset = off;
  if (len >= rib.L - 30) bowEl.classList.add('in');
}

/* ---------- journey (pinned) ---------- */
var jSec = $('#journey'), jImgs = $$('.j-img'), jPanels = $$('.j-panel'), jBtns = $$('.j-steps button'), jPtr = $('.j-pointer'), jFill = $('.j-fill'), jNow = $('#jNow'), jStep = -1;
function setStep(s){
  if (s === jStep) return; jStep = s;
  jImgs.forEach(function(im,i){ im.classList.toggle('on', i<=s); im.classList.toggle('cur', i===s); });
  jPanels.forEach(function(p,i){ p.classList.toggle('on', i===s); });
  jBtns.forEach(function(b,i){ b.classList.toggle('on', i===s); if (i===s){ jPtr.style.transform='translateY('+(b.parentNode.offsetTop + b.offsetHeight/2 - 5.5)+'px)'; } });
  jNow.textContent = (s<9?'0':'')+(s+1);
}
function updJourney(){
  if (!isDesk()) return;
  var r = jSec.getBoundingClientRect(), span = r.height - window.innerHeight, p = clamp(-r.top/span, 0, 1);
  setStep(Math.min(jPanels.length-1, Math.floor(p*jPanels.length)));
  var last = jBtns[jBtns.length-1].parentNode; jFill.style.height = (p*(last.offsetTop + last.offsetHeight))+'px';
}
jBtns.forEach(function(b,i){ b.addEventListener('click', function(){
  var top = jSec.getBoundingClientRect().top + window.scrollY, span = jSec.offsetHeight - window.innerHeight;
  window.scrollTo({top: top + span*(i+.5)/jBtns.length, behavior: RM ? 'auto' : 'smooth'});
}); });
setStep(0);

/* ---------- reels (horizontal on scroll) ---------- */
var rSec = $('#reels'), rTrack = $('#rTrack'), rDist = 0;
function layoutReels(){
  if (!rSec) return;
  if (!isDesk()){ rSec.style.height = ''; rTrack.style.transform=''; return; }
  rDist = Math.max(0, rTrack.scrollWidth - window.innerWidth);
  rSec.style.height = (window.innerHeight + rDist + window.innerHeight*.35) + 'px';
}
function updReels(){
  if (!rSec || !isDesk()) return;
  var r = rSec.getBoundingClientRect(), span = r.height - window.innerHeight, p = clamp(-r.top/span, 0, 1);
  rTrack.style.transform = 'translate3d('+(-p*rDist)+'px,0,0)';
}
$$('.reel .play').forEach(function(b){ b.addEventListener('click', function(){
  var fig = b.closest('.reel'), s = $('.soon', fig); s.textContent = R.note || 'Video plays here on the live site.'; fig.classList.add('show');
  setTimeout(function(){ fig.classList.remove('show'); }, 2600);
}); });

/* ---------- video testimonials (click to play: local file or YouTube/Vimeo embed) ---------- */
function stopVoice(box){
  $$('video', box).forEach(function(v){ v.pause(); v.remove(); });
  $$('iframe', box).forEach(function(f){ f.remove(); });
  box.classList.remove('playing');
}
$$('.v-media .play').forEach(function(b){ b.addEventListener('click', function(){
  var box = b.closest('.v-media'), src = box.getAttribute('data-src'), emb = box.getAttribute('data-embed'), name = box.getAttribute('data-name');
  $$('.v-media.playing').forEach(function(o){ if (o !== box) stopVoice(o); });
  if (!src && !emb){
    var s = $('.soon', box); s.textContent = (V && V.note) || 'The video plays here on the live site.'; box.classList.add('show');
    setTimeout(function(){ box.classList.remove('show'); }, 2600); return;
  }
  box.classList.add('playing');
  if (emb){
    box.insertAdjacentHTML('beforeend', '<iframe src="'+esc(emb)+(emb.indexOf('?') < 0 ? '?' : '&')+'autoplay=1&rel=0" title="Video: '+esc(name)+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>');
  } else {
    var v = document.createElement('video');
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('aria-label', 'Video: '+name);
    v.poster = box.getAttribute('data-poster');
    box.appendChild(v);
    var pr = v.play(); if (pr && pr.catch) pr.catch(function(){});
  }
}); });

/* ---------- nav ---------- */
var nav = $('#nav');
/* ---------- master scroll loop ---------- */
var ticking = false;
function frame(){ ticking=false; drawRibbon(); updTree(); updJourney(); updReels(); nav.classList.toggle('scrolled', window.scrollY > 40); }
function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }
window.addEventListener('scroll', onScroll, {passive:true});
var rT; function layout(){ layoutReels(); buildRibbon(); frame(); }
window.addEventListener('resize', function(){ clearTimeout(rT); rT = setTimeout(layout, 150); });
window.addEventListener('load', layout);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
layout();

/* ---------- kind words ---------- */
var qs = $$('.quote'), qi = 0, qTimer;
function showQ(n){ qs[qi].classList.remove('on'); qi = (n + qs.length) % qs.length; qs[qi].classList.add('on'); $('#wCount').textContent = (qi+1)+' / '+qs.length; }
function auto(){ clearInterval(qTimer); if (!RM) qTimer = setInterval(function(){ showQ(qi+1); }, 7000); }
$('#wPrev').addEventListener('click', function(){ showQ(qi-1); auto(); });
$('#wNext').addEventListener('click', function(){ showQ(qi+1); auto(); });
$('#wStage').addEventListener('mouseenter', function(){ clearInterval(qTimer); });
$('#wStage').addEventListener('mouseleave', auto);
auto();

/* ---------- booking ---------- */
var SVC = {}; BK.services.forEach(function(v){ SVC[v.id] = {t:v.title, img:v.src, alt:v.alt, q:v.quote, pos:v.pos||''}; });
var sImg = $('#sImg');
$$('input[name="svc"]').forEach(function(r){ r.addEventListener('change', function(){
  var d = SVC[r.value]; sImg.classList.add('fade');
  setTimeout(function(){ sImg.src = d.img; sImg.alt = d.alt; sImg.style.objectPosition = d.pos; sImg.classList.remove('fade'); }, RM ? 0 : 380);
  $('#sTitle').textContent = d.t; $('#sQuote').textContent = d.q;
}); });
var bf = $('#bookForm'); if (bf) bf.addEventListener('submit', function(e){
  e.preventDefault();
  var nm = $('#f-name').value.trim(), dt = $('#f-date') ? $('#f-date').value : '';
  $('#tName').textContent = nm ? ', ' + nm.split(' ')[0] : '';
  if (dt){ var p = dt.split('-'); var M=['January','February','March','April','May','June','July','August','September','October','November','December']; $('#tDate').textContent = (+p[2])+' '+M[+p[1]-1]+' '+p[0]; }
  $('#bookMain').classList.add('sent');
});

/* ---------- petal trail ---------- */
var cv = $('#petals');
if (!RM && window.matchMedia('(pointer:fine)').matches && cv.getContext){
  var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio||1), ps = [], lx=null, ly=null, running=false;
  var size = function(){ cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; cx.setTransform(dpr,0,0,dpr,0,0); };
  size(); window.addEventListener('resize', size);
  var COLS = ['rgba(232,180,166,','rgba(214,150,128,','rgba(240,205,192,'];
  window.addEventListener('pointermove', function(e){
    if (lx===null){ lx=e.clientX; ly=e.clientY; return; }
    var dx=e.clientX-lx, dy=e.clientY-ly; if (dx*dx+dy*dy < 22*22) return;
    lx=e.clientX; ly=e.clientY; if (ps.length > 26) return;
    var leafy = Math.random() < .3;
    ps.push({x:e.clientX, y:e.clientY, vx:(Math.random()-.5)*.6 + dx*.012, vy:.25+Math.random()*.4, r:Math.random()*6.28, vr:(Math.random()-.5)*.05, s:leafy? 3+Math.random()*2 : 3.5+Math.random()*3, life:0, max:110+Math.random()*60, ph:Math.random()*6.28, leaf:leafy, c:COLS[(Math.random()*3)|0]});
    if (!running){ running = true; requestAnimationFrame(tick); }
  }, {passive:true});
  function tick(){
    cx.clearRect(0,0,innerWidth,innerHeight);
    for (var i=ps.length-1;i>=0;i--){
      var p = ps[i]; p.life++; p.vy = Math.min(p.vy + .012, 1.3);
      p.x += p.vx + Math.sin(p.life*.045 + p.ph)*.55; p.y += p.vy; p.r += p.vr; p.vx *= .985;
      var a = 1 - p.life/p.max; if (a <= 0){ ps.splice(i,1); continue; }
      cx.save(); cx.translate(p.x,p.y); cx.rotate(p.r);
      cx.beginPath();
      if (p.leaf){ cx.fillStyle = 'rgba(140,151,122,'+(a*.8)+')'; cx.ellipse(0,0,p.s*.45,p.s*1.9,0,0,6.283); }
      else { cx.fillStyle = p.c+(a*.85)+')'; cx.ellipse(0,0,p.s,p.s*.62,0,0,6.283); }
      cx.fill(); cx.restore();
    }
    if (ps.length) requestAnimationFrame(tick); else { running = false; cx.clearRect(0,0,innerWidth,innerHeight); }
  }
}
})();
