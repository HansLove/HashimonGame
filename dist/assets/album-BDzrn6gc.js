import"./hashimonAlbumBridge-D1pDqIA7.js";(function(){var x;const i=window.HashimonAlbumBridge;let l=null;const r=new Map;let p=null,m="";const c=t=>document.querySelector(t);function o(t){const e=c("#album-toast");e.textContent=t,e.classList.add("visible"),clearTimeout(o._t),o._t=setTimeout(()=>e.classList.remove("visible"),2400)}function h(t){i==null||i.revokeArtUrl(t),r.delete(t)}async function T(t){if(!await i.getArt(t))return r.has(t)&&h(t),null;if(r.has(t))return r.get(t);const a=await i.getArtUrl(t);return a&&r.set(t,a),a||null}async function $(){if(!l||!i)return;const t=new Set;for(const e of l.creatures)for(const a of e.slots)t.add(a.artFile),await T(a.artFile);for(const e of[...r.keys()])t.has(e)||h(e)}function _(t){var e;return(e=t==null?void 0:t.creatures)!=null&&e.length?t.creatures.map(a=>{var s,n,v,M,I,j;return[a.id,a.name,a.currentStars,(s=a.stats)==null?void 0:s.hp,(n=a.stats)==null?void 0:n.maxHp,(v=a.stats)==null?void 0:v.power,(M=a.stats)==null?void 0:M.defense,(I=a.stats)==null?void 0:I.bestShareBits,(j=a.stats)==null?void 0:j.evolutionProgress].join(":")}).join("|"):""}function U(){if(!l)return{filled:0,total:0};let t=0,e=0;return l.creatures.forEach(a=>{a.slots.forEach(s=>{t++,r.has(s.artFile)&&e++})}),{filled:e,total:t}}function S(){const{filled:t,total:e}=U();c("#album-progress").textContent=`${t} / ${e} filled`}function w(){if(!l)return;c("#album-title").textContent=l.title||"Hashimon Album";const t=l.exportedAt?new Date(l.exportedAt).toLocaleString():"";c("#album-meta").textContent=`${l.creatures.length} creatures · exported ${t}`,S()}function q(t){const e=c("#album-intro");e.innerHTML=`
        <p class="AlbumIntro_linked">Linked to game save — stats sync automatically.</p>
        <p>Open the album from the game (Esc → My Collection → Open Album) so images and names stay on the same origin.</p>
        <ol>
          <li>Copy each tier prompt and generate art in your AI.</li>
          <li>Upload PNGs here — they appear in My Collection thumbnails.</li>
          <li>Rename or mine in the game — this album updates live.</li>
        </ol>`}async function B(t){const e=K(t);if(!(e!=null&&e.prompt)){o("Prompt not found.");return}try{await navigator.clipboard.writeText(e.prompt),o("Prompt copied!")}catch{o("Copy failed — use prompts/ folder.")}}function D(t){var e;return((e=l==null?void 0:l.creatures)==null?void 0:e.find(a=>a.id===t))||null}function E(t){let e=0;return t.slots.forEach(a=>{r.has(a.artFile)&&e++}),{filled:e,total:t.slots.length}}function F(t){const e=[...t.slots].sort((a,s)=>s.tier-a.tier);for(const a of e){const s=r.get(a.artFile);if(s)return{url:s,tier:a.tier}}return null}function d(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function L(t){const e=D(t);if(!e)return;p=t;const a=c("#album-detail"),s=c("#album-detail-content");s.innerHTML=C(e),a.hidden=!1,a.setAttribute("aria-hidden","false"),P(s),document.body.style.overflow="hidden"}function b(){p=null;const t=c("#album-detail");t.hidden=!0,t.setAttribute("aria-hidden","true"),c("#album-detail-content").innerHTML="",document.body.style.overflow=""}function G(){document.querySelectorAll("[data-creature-id]").forEach(t=>{t.addEventListener("click",()=>L(t.dataset.creatureId)),t.addEventListener("keydown",e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),L(t.dataset.creatureId))})})}function N(){document.querySelectorAll("[data-close-detail]").forEach(t=>{t.addEventListener("click",b)}),document.addEventListener("keydown",O)}function O(t){t.key==="Escape"&&p&&b()}function R(t){const e=t.stats||{},a=t.speciesLabel||t.species||"",s=(t.dna||"").slice(0,16),n=e.evolutionProgress!=null?`${e.evolutionProgress} bits toward next star`:"—";return`
      <div class="AlbumDetail_stats">
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Species</span>
          <span class="AlbumDetail_stat-value">${d(a)}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Type</span>
          <span class="AlbumDetail_stat-value">${d(y(t))}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Stars</span>
          <span class="AlbumDetail_stat-value">${t.currentStars}★ now</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">HP</span>
          <span class="AlbumDetail_stat-value">${e.hp??"—"} / ${e.maxHp??"—"}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Power / Def</span>
          <span class="AlbumDetail_stat-value">${e.power??"—"} / ${e.defense??"—"}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Best share</span>
          <span class="AlbumDetail_stat-value">${e.bestShareBits??0} bits</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Evolution</span>
          <span class="AlbumDetail_stat-value">${d(n)}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">DNA</span>
          <span class="AlbumDetail_stat-value">${d(s)}…</span>
        </div>
      </div>`}function C(t){const{filled:e,total:a}=E(t),s=t.speciesLabel||t.species||"",n=t.slots.map(W).join("");return`
      <h2 class="AlbumDetail_title" id="album-detail-title">${d(t.name)}</h2>
      <p class="AlbumDetail_subtitle">${d(s)} · ${d(k(t))} · ${e}/${a} evolutions filled</p>
      ${R(t)}
      <section class="AlbumDetail_section">
        <h3>Evolutions</h3>
        <div class="AlbumDetail_slots">${n}</div>
      </section>`}function J(t){const e=F(t),{filled:a,total:s}=E(t),n=t.speciesLabel||t.species||"",v=e?`<img src="${e.url}" alt="${d(t.name)}" />`:'<div class="AlbumCard_preview-empty">No art yet</div>';return`
      <article class="AlbumCard" data-creature-id="${d(t.id)}" tabindex="0" role="button" aria-label="View ${d(t.name)} details">
        <div class="AlbumCard_preview">
          ${v}
          <span class="AlbumCard_stars">${t.currentStars}★</span>
        </div>
        <div class="AlbumCard_head">
          <h2 class="AlbumCard_name">${d(t.name)}</h2>
          <p class="AlbumCard_meta">${d(n)} · ${d(k(t))}</p>
          <p class="AlbumCard_fill">${a} / ${s} evolutions</p>
          <p class="AlbumCard_hint">Click to view details</p>
        </div>
      </article>`}function K(t){if(!l)return null;for(const e of l.creatures){const a=e.slots.find(s=>s.artFile===t);if(a)return a}return null}async function A(t,e){if(!i){o("Album bridge not loaded.");return}if(!e||!e.type.startsWith("image/")){o("Please choose a PNG or JPG image.");return}await i.putArt(t,e);const a=await i.refreshArtUrl(t);a?r.set(t,a):r.delete(t),m="",u(),o("Image saved locally!")}async function V(t){i&&(await i.deleteArt(t),h(t),m="",u(),o("Image removed."))}function P(t=document){t.querySelectorAll("[data-pick]").forEach(e=>{e.addEventListener("change",a=>{var n;const s=(n=a.target.files)==null?void 0:n[0];s&&A(e.dataset.pick,s),e.value=""})}),t.querySelectorAll("[data-copy]").forEach(e=>{e.addEventListener("click",a=>{a.stopPropagation(),B(e.dataset.copy)})}),t.querySelectorAll("[data-remove]").forEach(e=>{e.addEventListener("click",a=>{a.stopPropagation(),V(e.dataset.remove)})}),t.querySelectorAll("[data-replace]").forEach(e=>{e.addEventListener("change",a=>{var n;a.stopPropagation();const s=(n=a.target.files)==null?void 0:n[0];s&&A(e.dataset.replace,s),e.value=""})}),t.querySelectorAll(".AlbumSlot_frame[data-drop]").forEach(e=>{e.addEventListener("dragover",a=>{a.preventDefault(),a.stopPropagation(),e.classList.add("dragover")}),e.addEventListener("dragleave",()=>e.classList.remove("dragover")),e.addEventListener("drop",a=>{var n;a.preventDefault(),a.stopPropagation(),e.classList.remove("dragover");const s=(n=a.dataTransfer.files)==null?void 0:n[0];s&&A(e.dataset.drop,s)})})}function y(t){var a;const e=t.types;return e?e.fusion?e.fusion:e.secondary?`${e.primary.name} / ${e.secondary.name}`:((a=e.primary)==null?void 0:a.name)||t.species||"":t.species||""}function k(t){const e=t.stats;if(!e)return`${t.currentStars}★ · ${y(t)}`;const a=e.maxHp!=null?`HP ${e.hp}/${e.maxHp}`:"",s=`${t.currentStars}★`,n=y(t);return[a,s,n].filter(Boolean).join(" · ")}function W(t){const e=r.has(t.artFile),a=r.get(t.artFile);return e?`
        <div class="AlbumSlot">
          <div class="AlbumSlot_label">${t.tier}★</div>
          <div class="AlbumSlot_frame filled" data-drop="${t.artFile}">
            <img src="${a}" alt="${t.tier} star form" />
            <div class="AlbumSlot_filled-actions">
              <label>
                Replace
                <input type="file" accept="image/*" data-replace="${t.artFile}" hidden>
              </label>
              <button type="button" data-remove="${t.artFile}">Remove</button>
            </div>
          </div>
        </div>`:`
      <div class="AlbumSlot">
        <div class="AlbumSlot_label">${t.tier}★</div>
        <div class="AlbumSlot_frame" data-drop="${t.artFile}">
          <span class="AlbumSlot_empty">Empty slot</span>
          <div class="AlbumSlot_actions">
            <button type="button" data-copy="${t.artFile}">Copy prompt</button>
            <label>
              Add image
              <input type="file" accept="image/*" data-pick="${t.artFile}" hidden>
            </label>
          </div>
        </div>
      </div>`}function u(){var e;const t=c("#album-grid");if(!l||!((e=l.creatures)!=null&&e.length)){t.innerHTML='<p class="AlbumEmpty">No album loaded. Play the game on localhost, export a pack, or load album.json.</p>',b();return}if(t.innerHTML=l.creatures.map(J).join(""),G(),S(),p){const a=D(p);if(a){const s=c("#album-detail-content");s.innerHTML=C(a),P(s)}else b()}}async function f(){var s;if(!i)return!1;const t=await i.getManifest();if(!((s=t==null?void 0:t.creatures)!=null&&s.length))return!1;const e=_(t),a=l&&e===m;return l=t,a||(await $(),m=e),w(),u(),!0}async function H(t){l=t,await $(),m=_(t),w(),u()}async function z(t){const e=await fetch(t);if(!e.ok)throw new Error(`Could not load ${t}`);return H(await e.json())}function g(){try{return!!localStorage.getItem("Hashimon_PlayerState")}catch{return!1}}function Q(){window.addEventListener("storage",t=>{t.key==="Hashimon_PlayerState"&&f()}),document.addEventListener("PlayerStateUpdated",()=>{f()}),setInterval(()=>{document.visibilityState==="visible"&&f()},5e3)}c("#load-json").addEventListener("change",async t=>{var a;const e=(a=t.target.files)==null?void 0:a[0];if(e){try{const s=await e.text();await H(JSON.parse(s)),o("Album loaded!")}catch{o("Invalid album.json")}t.target.value=""}}),(x=c("#import-pack"))==null||x.addEventListener("change",async t=>{const e=t.target.files;if(!(!(e!=null&&e.length)||!i)){try{const a=await i.importPack(e);await f(),o(`Imported ${a.artCount} image(s)${a.hasManifest?" + manifest":""}.`)}catch{o("Import failed.")}t.target.value=""}});async function X(){if(N(),!i){u(),o("Bridge not loaded — open via localhost:8081/album/");return}if(g()&&await i.syncFromGame().catch(()=>{}),await f()){g()&&q(),Q();return}const e=["../album.json","./album.json","/album.json"];for(const a of e)try{await z(a);return}catch{}g()&&o("Save found but album could not load. Click Sync Album in the game."),u()}X()})();
