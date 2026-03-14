(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();const De="vendor/vs",N=14,ge=8,fe=32,he=2;let E=null,b=parseInt(localStorage.getItem("editor-font-size")??N,10);(isNaN(b)||b<ge||b>fe)&&(b=N);function qe(t){return new Promise(e=>{window.require.config({paths:{vs:De}}),window.require(["vs/editor/editor.main"],()=>{Ue();const n=localStorage.getItem("theme")??"light";E=monaco.editor.create(t,{value:"",language:"typst",theme:n==="light"?"vs":"vs-dark",fontSize:b,fontFamily:"'Fira Code', 'Cascadia Code', 'Courier New', monospace",fontLigatures:!0,minimap:{enabled:!1},scrollBeyondLastLine:!1,wordWrap:"on",automaticLayout:!0,lineNumbersMinChars:4,contextmenu:!0}),e(E)})})}function Re(t){const e=t.clipboardData?.items;if(e){for(const n of e)if(n.type.startsWith("image/")){t.preventDefault();const i=n.getAsFile();if(!i)return;const o=new FileReader;o.onload=s=>{const l=s.target.result;Fe(l)},o.readAsDataURL(i)}}}function Fe(t){if(!E)return;const e=E.getSelection(),n=e?e.getStartPosition():E.getModel()?.getFullModelRange().getEndPosition();if(!n)return;const i=`#image("${t}", width: 100%)`;E.executeEdits("paste-image",[{range:new monaco.Range(n.lineNumber,n.column,n.lineNumber,n.column),text:i}])}function He(t){E&&monaco.editor.setTheme(t==="light"?"vs":"vs-dark")}function C(){return E}function f(){return E?.getOption(monaco.editor.EditorOption.fontFamily)??""}function Oe(t){E&&(E.updateOptions({fontFamily:t}),localStorage.setItem("editor-font-family",t))}function se(){b>=fe||(b+=he,W())}function re(){b<=ge||(b-=he,W())}function le(){b=N,W()}function Ze(){return Math.round(b/N*100)}function W(){E?.updateOptions({fontSize:b}),localStorage.setItem("editor-font-size",String(b));const t=document.getElementById("status-zoom");t&&(t.textContent=`${Ze()}%`)}function Ue(){monaco.languages.getLanguages().some(t=>t.id==="typst")||(monaco.languages.register({id:"typst"}),monaco.languages.setLanguageConfiguration("typst",{comments:{lineComment:"//"},brackets:[["(",")"],["[","]"],["{","}"]],autoClosingPairs:[{open:"(",close:")"},{open:"[",close:"]"},{open:"{",close:"}"},{open:'"',close:'"',notIn:["string"]},{open:"$",close:"$",notIn:["string"]}]}),monaco.languages.setMonarchTokensProvider("typst",{tokenizer:{root:[[/^=+\s.*$/,"keyword"],[/\*[^*\n]+\*/,"strong"],[/_[^_\n]+_/,"emphasis"],[/\$[^$\n]*\$/,"number"],[/`[^`\n]*`/,"string"],[/\/\/.*$/,"comment"],[/#[a-zA-Z_]\w*/,"type.identifier"],[/@[a-zA-Z_]\w*/,"variable"]]}}))}let q=null;function Ke(){return q||(q=document.getElementById("toast-container")),q}function h(t,e,n=3500){const i=Ke();if(!i)return;const o=document.createElement("div");o.className=`toast ${t}`,o.textContent=e,i.appendChild(o);const s=()=>{o.classList.add("removing"),o.addEventListener("animationend",()=>o.remove(),{once:!0})},l=setTimeout(s,n);o.addEventListener("click",()=>{clearTimeout(l),s()})}function v({title:t,body:e,buttons:n=[],width:i="480px",height:o="auto",onClose:s,closable:l=!0}){const r=document.createElement("div");r.className="ide-modal-overlay";const c=document.createElement("div");c.className="ide-modal",c.style.width=i,c.style.height=o,c.setAttribute("role","dialog"),c.setAttribute("aria-modal","true");const a=document.createElement("div");if(a.className="ide-modal-header",a.innerHTML=`<h2>${t}</h2>`,l){const u=document.createElement("button");u.className="ide-modal-close-btn",u.innerHTML="&times;",u.addEventListener("click",()=>d()),a.appendChild(u)}c.appendChild(a);const p=document.createElement("div");if(p.className="ide-modal-body",typeof e=="string"?p.innerHTML=e:p.appendChild(e),c.appendChild(p),n.length>0){const u=document.createElement("div");u.className="ide-modal-actions",n.forEach(({label:m,primary:g=!1,onClick:k})=>{const A=document.createElement("button");A.className="btn",A.textContent=m,A.addEventListener("click",()=>k?.(d)),u.appendChild(A)}),c.appendChild(u)}r.appendChild(c),document.body.appendChild(r),requestAnimationFrame(()=>requestAnimationFrame(()=>r.classList.add("ide-modal-overlay--visible")));function d(){r.classList.remove("ide-modal-overlay--visible"),r.addEventListener("transitionend",()=>r.remove(),{once:!0}),s?.(),document.removeEventListener("keydown",w)}l&&(r.addEventListener("click",u=>{u.target===r&&d()}),document.addEventListener("keydown",w));function w(u){u.key==="Escape"&&d()}return{close:d,overlay:r}}function ve({title:t,message:e,confirmLabel:n="Confirmer",cancelLabel:i="Annuler"}){return new Promise(o=>{v({title:t,body:`<p class="ide-modal-message">${e}</p>`,buttons:[{label:i,primary:!1,onClick:s=>{o(!1),s()}},{label:n,primary:!0,onClick:s=>{o(!0),s()}}],onClose:()=>o(!1)})})}function be({title:t,label:e,placeholder:n,validate:i}){return new Promise(o=>{const s="modal-prompt-input-"+Date.now(),l="modal-prompt-error-"+Date.now(),r=`
            <label class="ide-modal-label">
                ${e}
                <input type="text" id="${s}" class="ide-modal-input" placeholder="${n}" maxlength="80" autocomplete="off" />
            </label>
            <div class="ide-modal-error" id="${l}"></div>
        `;let c=!1;function a(g){c||(c=!0,p(),o(g))}const{close:p,overlay:d}=v({title:t,body:r,buttons:[{label:"Annuler",primary:!1,onClick:()=>a(null)},{label:"Confirmer",primary:!0,onClick:()=>m()}],onClose:()=>a(null)}),w=d.querySelector(`#${s}`),u=d.querySelector(`#${l}`);w?.focus();async function m(){const g=w?.value.trim()??"";if(!g){u.textContent="Ce champ est requis.";return}if(i){const k=await i(g);if(k!==!0){u.textContent=k;return}}a(g)}w?.addEventListener("keydown",g=>{g.key==="Enter"&&m(),g.key==="Escape"&&a(null)})})}const{invoke:B}=window.__TAURI__.core;let I=null;JSON.parse(localStorage.getItem("project-history")??"[]");const We=[];function Ve(){We.forEach(t=>t(I))}function $(){return I}let ce=null,Z=!1;function Ge(t){I&&(Z=!0,clearTimeout(ce),ce=setTimeout(()=>Xe(t),800))}async function Xe(t){if(!I||!Z)return;const e=`${I.path}/${I.typFile}`;try{await B("save_file",{path:e,content:t}),Z=!1,V(!1)}catch(n){h("error",`Erreur de sauvegarde : ${n}`)}}function we(){$()===null?document.getElementById("unsaved-btn")?.classList.remove("_unsaved-btn-none"):document.getElementById("unsaved-btn")?.classList.add("_unsaved-btn-none")}function Ee(){$()===null?(document.getElementById("open-project-btn").classList.add("_open-project-blinking"),document.getElementById("open-project-btn").classList.add("_open-project-blinking:hover")):(document.getElementById("open-project-btn").classList.remove("_open-project-blinking"),document.getElementById("open-project-btn").classList.remove("_open-project-blinking:hover"))}let R=null;function Je(){return R||(R=document.getElementById("save-indicator")),R}function V(t){const e=Je();e&&(t?(e.textContent="●",e.classList.add("unsaved"),e.title="Non sauvegardé"):(e.textContent="✓",e.classList.remove("unsaved"),e.title="Sauvegardé"))}function G(t,e){I={name:t.name,path:t.path,typFile:t.typ_file};const n=document.getElementById("project-name");n&&(n.textContent=t.name);const i=document.getElementById("status-project-path");i&&(i.textContent=`${t.path}/${t.typ_file}`),V(!1),e(t.content),Ve(),we(),Ee()}const Ye=/[<>:"/\\|?*]/;function Qe(t){return Ye.test(t)?'Le nom ne peut pas contenir : < > : " / \\ | ? *':!0}async function F(t,e=""){const n=await be({title:"Nouveau projet",label:"Nom du projet",placeholder:"Mon projet",validate:Qe});if(!n)return;const i=await B("open_folder_dialog");if(i)try{const o=await B("create_project",{name:n,basePath:i,content:e});await G({name:n,path:o,typ_file:"main.typ",content:e},t),h("success",`Projet "${n}" créé.`)}catch(o){h("error",`Impossible de créer le projet : ${o}`)}}async function ae(t){const e=await B("open_folder_dialog");if(e)try{const n=await B("open_project",{dirPath:e});G(n,t),h("success",`Projet "${n.name}" ouvert.`)}catch(n){h("error",String(n))}}async function et(t,e){try{const n=await B("open_project",{dirPath:t});G(n,e),h("success",`Projet "${n.name}" ouvert.`)}catch(n){h("error",String(n))}}const{invoke:tt}=window.__TAURI__.core;function nt({getSource:t,onChange:e,preview:n,frame:i,debounceMs:o=100,onDiagnostics:s,getCursor:l,autoFit:r=!0,onZoomChange:c}){let a=!0;const p=async()=>{await st(t(),n,i,s,l),a&&r&&(a=!1,$e(n,i),c?.())};e(()=>{const d=document.getElementById("auto-compile");d&&!d.checked||(clearTimeout(de),de=setTimeout(p,o))}),p()}let H=0,de;function ot(t,e,n){e.style.display="none",t.querySelector(".error")?.remove();const i=document.createElement("div");i.className="error",i.textContent=n,t.appendChild(i)}function _e(t,e){t.querySelector(".error")?.remove(),e.style.display=""}let x=100,M="",U=null;function it(t,e){return e===1?t:t.replace(/<svg([^>]*)>/g,(n,i)=>`<svg${i.replace(/\bwidth="([\d.]+)(pt|px)?"/g,(s,l,r="")=>`width="${parseFloat(l)*e}${r}"`).replace(/\bheight="([\d.]+)(pt|px)?"/g,(s,l,r="")=>`height="${parseFloat(l)*e}${r}"`)}>`)}function xe(t,e){t.style.width="100%",t.style.height="100%",t.contentDocument.open(),t.contentDocument.write(it(e,x/100)),t.contentDocument.close();const n=t.contentDocument;t.style.width=n.documentElement.scrollWidth+"px",t.style.height=n.documentElement.scrollHeight+"px";const i=document.getElementById("zoom-input");i&&(i.value=x)}function X(t,e,n){if(!n||!t.contentDocument)return;const{page:i,y:o}=n,s=t.contentDocument.querySelectorAll(".page");if(!s||i<1||i>s.length)return;const l=s[i-1],r=96/72,c=x/100,a=o*r*c,p=l.offsetTop+a-e.clientHeight*.3;e.scrollTop=Math.max(0,p)}async function st(t,e,n,i,o){const s=++H,l=o?.()??null;try{const r=await tt("render_preview",{source:t,root:$()?.path??null,cursor:l});if(s!==H)return;const{html:c,jump_pos:a}=r;M=c,U=a??null;const p=e.scrollTop;_e(e,n),xe(n,c),e.scrollTop=p,a&&X(n,e,a),i?.([])}catch(r){if(s!==H)return;const c=Array.isArray(r)?r:[];i?.(c);const a=c.length>0?c.map(p=>`${p.message}${loc}`).join(`
`):String(r);ot(e,n,a)}}function rt(){J(x+10)}function lt(){J(x-10)}function ct(){return x}function $e(t,e){const n=t??document.getElementById("preview"),i=e??document.getElementById("preview-frame");if(!i||!n||!M)return;const o=i.offsetWidth;if(o===0)return;const s=o/(x/100),l=n.clientWidth-16;l<=0||J(Math.floor(l/s*100))}function J(t){x=Math.min(400,Math.max(20,t));const e=document.getElementById("preview-frame"),n=document.getElementById("preview");if(e&&n&&M){const i=n.scrollTop;_e(n,e),xe(e,M),n.scrollTop=i,U&&X(e,n,U)}}const Ce=.1,Ie=.5,Le=3,Y=1,Se="webview-zoom";let _=parseFloat(localStorage.getItem(Se)??Y);(isNaN(_)||_<Ie||_>Le)&&(_=Y);async function z(){const{invoke:t}=window.__TAURI__.core;await t("set_webview_zoom",{factor:_}),localStorage.setItem(Se,String(_))}async function at(){await z()}async function ke(){_=Math.min(parseFloat((_+Ce).toFixed(2)),Le),await z()}async function Ae(){_=Math.max(parseFloat((_-Ce).toFixed(2)),Ie),await z()}async function Be(){_=Y,await z()}const dt=[{id:"table",content:"#table",classes:"",title:"Tableau",openModal:()=>{const t=document.createElement("div");t.innerHTML=`
        <div id="structures-table-modal">
          <p class="structures-input-label">Dimensions</p>
          <div class="flex items-center w-full" style="margin-bottom: 8px">
            <div class="flex items-center flex-none gap-2">
              <input
                id="structures-table-input-cols"
                type="number"
                placeholder="cols"
                min="1"
                value="2"
                class="w-18 h-8 p-2 text-base"
              />
              <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
              <input
                id="structures-table-input-rows"
                type="number"
                placeholder="rows"
                min="1"
                value="2"
                class="w-18 h-8 text-base mb-2"
              />
            </div>
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">2 2</pre>
            </div>
          </div>

          <p class="structures-input-label">Marge intérieure</p>
          <div class="flex items-center w-full" style="margin-bottom: 8px">
            <div class="flex items-center gap-2 flex-none">
              <input
                id="structures-table-input-inset"
                type="number"
                placeholder="inset"
                min="0"
                class="w-18 h-8 text-base mb-2"
              />
              <select
                id="structures-table-select-inset"
                class="w-18 h-8 text-base mb-2"
              >
                <option value="pt" selected>pt</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inches">inches</option>
                <option value="%">%</option>
              </select>
            </div>
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">0pt</pre>
            </div>
          </div>

          <p class="structures-input-label">Alignement horizontal</p>
          <div class="flex items-center w-full" style="margin-bottom: 8px">
            <select
              id="structures-table-input-horizontal-align"
              class="w-20 h-8 text-base mb-2"
            >
              <option value="left" selected>left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">left</pre>
            </div>
          </div>

          <p class="structures-input-label">Alignement vertical</p>
          <div class="flex items-center w-full" style="margin-bottom: 8px">
            <select
              id="structures-table-input-vertical-align"
              class="w-20 h-8 text-base mb-2"
            >
              <option value="top" selected>top</option>
              <option value="horizon">horizon</option>
              <option value="bottom">bottom</option>
            </select>
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">top</pre>
            </div>
          </div>
          <p
            onclick="window.__TAURI__.opener.openUrl('https://typst.app/docs/reference/model/table/')"
            style="cursor:pointer;color:var(--color-link);text-decoration: underline;display:flex;width:fit-content;"
          >More information...</p>
        </div>
      `,v({title:"Insérer un tableau",body:t,buttons:[{label:"Insérer",primary:!0,onClick:()=>{const e=parseInt(document.getElementById("structures-table-input-cols").value),n=parseInt(document.getElementById("structures-table-input-rows").value),i=document.getElementById("structures-table-input-inset").value,o=document.getElementById("structures-table-select-inset").value,s=document.getElementById("structures-table-input-horizontal-align").value,l=document.getElementById("structures-table-input-vertical-align").value,r=e?`	columns: ${e},
`:"",c=n?`	rows: ${n},
`:"",a=i?`	inset: ${i}${o},
`:"",p=s||l?`	align: ${s}+${l},
`:"";let d="";for(let m=0;m<e;m++){for(let g=0;g<n;g++)g===0&&m===0&&(d+=`
	`),d+="[],";d+=`
`,m!==e-1&&(d+="	")}const w=`#table(
${r}${c}${a}${p}${d})
`,u=C();if(u){const m=u.getSelection();m&&u.executeEdits(null,[{range:m,text:w}])}}}]})}},{id:"grid",content:"#grid",classes:"",title:"Grille pour placer les éléments",openModal:()=>{const t=document.createElement("div");t.innerHTML=`
      <div id="structures-grid-modal">
        <p class="structures-input-label">Dimensions</p>
        <div class="flex items-center w-full" style="margin-bottom: 8px">
          <div class="flex items-center flex-none gap-2">
            <input
              id="structures-grid-input-cols"
              type="number"
              placeholder="cols"
              min="1"
              value="1"
              class="w-18 h-8 p-2 text-base"
            />
            <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
            <input
              id="structures-grid-input-rows"
              type="number"
              placeholder="rows"
              min="1"
              value="1"
              class="w-18 h-8 text-base mb-2"
            />
          </div>
          <div class="flex-1 text-right min-w-0">
            <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">1 1</pre>
          </div>
        </div>

        <p class="structures-input-label">Marge intérieure</p>
        <div class="flex items-center w-full" style="margin-bottom: 8px">
          <div class="flex items-center gap-2 flex-none">
            <input
              id="structures-grid-input-inset"
              type="number"
              placeholder="inset"
              min="0"
              class="w-18 h-8 text-base mb-2"
            />
            <select
              id="structures-grid-select-inset"
              class="w-18 h-8 text-base mb-2"
            >
              <option value="pt" selected>pt</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inches">inches</option>
              <option value="%">%</option>
            </select>
          </div>
          <div class="flex-1 text-right min-w-0">
            <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">none</pre>
          </div>
        </div>

        <p class="structures-input-label">Alignement horizontal</p>
        <div class="flex items-center w-full" style="margin-bottom: 8px">
          <select
            id="structures-grid-input-horizontal-align"
            class="w-20 h-8 text-base mb-2"
          >
            <option value="left" selected>left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
          <div class="flex-1 text-right min-w-0">
            <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">left</pre>
          </div>
        </div>

        <p class="structures-input-label">Alignement vertical</p>
        <div class="flex items-center w-full" style="margin-bottom: 8px">
          <select
            id="structures-grid-input-vertical-align"
            class="w-20 h-8 text-base mb-2"
          >
            <option value="top" selected>top</option>
            <option value="horizon">horizon</option>
            <option value="bottom">bottom</option>
          </select>
          <div class="flex-1 text-right min-w-0">
            <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">top</pre>
          </div>
        </div>

        <p
          onclick="window.__TAURI__.opener.openUrl('https://typst.app/docs/reference/layout/grid/')"
          style="cursor:pointer;color:var(--color-link);text-decoration: underline;display:flex;width:fit-content;"
        >More information...</p>
      </div>
            `,v({title:"Insérer une grille",body:t,buttons:[{label:"Insérer",primary:!0,onClick:()=>{const e=parseInt(document.getElementById("structures-grid-input-cols").value),n=parseInt(document.getElementById("structures-grid-input-rows").value),i=document.getElementById("structures-grid-input-inset").value,o=document.getElementById("structures-grid-select-inset").value,s=document.getElementById("structures-grid-input-horizontal-align").value,l=document.getElementById("structures-grid-input-vertical-align").value,r=e?`	columns: ${e},
`:"",c=n?`	rows: ${n},
`:"",a=i?`	inset: ${i}${o},
`:"",p=s||l?`	align: ${s}+${l},
`:"";let d="";for(let m=0;m<e;m++){for(let g=0;g<n;g++)g===0&&m===0&&(d+=`
	`),d+="[],";d+=`
`,m!==e-1&&(d+="	")}const w=`#grid(
${r}${c}${a}${p}${d})
`,u=C();if(u){const m=u.getSelection();m&&u.executeEdits(null,[{range:m,text:w}])}}}]})}},{id:"rect",content:"#rect",classes:"",title:"Rectangle",openModal:()=>{const t=document.createElement("div");t.innerHTML=`
        <div id="structures-rect-modal">
          <p class="structures-input-label">Dimensions</p>
          <div class="flex items-center w-full" style="margin-bottom: 8px">
            <div class="flex items-center flex-none gap-2">
              <input
                id="structures-rect-input-width"
                type="number"
                placeholder="width"
                min="1"
                class="w-18 h-8 p-2 text-base"
              />
              <select
                id="structures-rect-select-width"
                class="w-18 h-8 text-base mb-2"
              >
                <option value="pt" selected>pt</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inches">inches</option>
                <option value="%">%</option>
              </select>
              <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
              <input
                id="structures-rect-input-height"
                type="number"
                placeholder="height"
                min="1"
                class="w-18 h-8 text-base mb-2"
              />
              <select
                id="structures-rect-select-height"
                class="w-18 h-8 text-base mb-2"
              >
                <option value="pt" selected>pt</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inches">inches</option>
                <option value="%">%</option>
              </select>
            </div>
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">auto auto</pre>
            </div>
          </div>

          <p class="structures-input-label">Marge intérieure</p>
          <div class="flex items-center w-full" style="margin-bottom: 8px">
            <div class="flex items-center gap-2 flex-none">
              <input
                id="structures-rect-input-inset"
                type="number"
                placeholder="inset"
                min="0"
                class="w-18 h-8 text-base mb-2"
              />
              <select
                id="structures-rect-select-inset"
                class="w-18 h-8 text-base mb-2"
              >
                <option value="pt" selected>pt</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inches">inches</option>
                <option value="%">%</option>
              </select>
            </div>
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">0pt</pre>
            </div>
          </div>

          <p class="structures-input-label">Bordure</p>
          <div class="flex items-center w-full gap-2" style="margin-bottom: 8px">
            <input
              id="structures-rect-input-border"
              type="number"
              placeholder="border"
              min="2"
              value="2"
              class="w-18 h-8 text-base mb-2"
            />
            <select
              id="structures-rect-select-border"
              class="w-18 h-8 text-base mb-2"
            >
              <option value="pt" selected>pt</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inches">inches</option>
              <option value="%">%</option>
            </select>
            <input
              id="structures-rect-input-radius"
              type="number"
              placeholder="radius"
              min="2"
              value="2"
              class="w-18 h-8 text-base mb-2"
            />
            <select
              id="structures-rect-select-radius"
              class="w-18 h-8 text-base mb-2"
            >
              <option value="pt" selected>pt</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inches">inches</option>
              <option value="%">%</option>
            </select>
            <input
              id="structures-rect-input-bordercolor"
              type="color"
              value="#000000"
              class="w-8 h-8 text-base mb-2"
            />
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">2pt 0pt black</pre>
            </div>
          </div>

          <p class="structures-input-label">Remplissage</p>
          <div class="flex items-center w-full gap-2" style="margin-bottom: 8px">
            <input type="checkbox" id="structures-rect-checkbox-fill" class="w-6 h-6 mb-2" />
            <input
              id="structures-rect-input-fillcolor"
              type="color"
              class="w-16 h-8 text-base mb-2"
              style="opacity: 0.5;transition:0.2s;"
            />
            <div class="flex-1 text-right min-w-0">
              <pre class="text-s whitespace-nowrap truncate opacity-50" style="font-family: ${f()};">none</pre>
            </div>
          </div>

          <p
            onclick="window.__TAURI__.opener.openUrl('https://typst.app/docs/reference/visualize/rect/')"
            style="cursor:pointer;color:var(--color-link);text-decoration: underline;display:flex;width:fit-content;"
          >More information...</p>
        </div>
      `;const e=t.querySelector("#structures-rect-checkbox-fill"),n=t.querySelector("#structures-rect-input-fillcolor");e.addEventListener("change",()=>{e.checked?n.style.opacity="1":n.style.opacity="0.2"}),v({title:"Insérer un rectangle",body:t,buttons:[{label:"Insérer",primary:!0,onClick:()=>{const i=parseInt(document.getElementById("structures-rect-input-width").value),o=parseInt(document.getElementById("structures-rect-select-width").value),s=parseInt(document.getElementById("structures-rect-input-height").value),l=parseInt(document.getElementById("structures-rect-select-height").value),r=document.getElementById("structures-rect-input-inset").value,c=document.getElementById("structures-rect-select-inset").value,a=document.getElementById("structures-rect-input-border").value,p=document.getElementById("structures-rect-select-border").value,d=document.getElementById("structures-rect-input-radius").value,w=document.getElementById("structures-rect-select-radius").value,u=document.getElementById("structures-rect-input-bordercolor").value,m=document.getElementById("structures-rect-input-fillcolor").value,g=i?`
width: ${i}${o},
`:`	width: auto,
`,k=s?`
height: ${s}${l},
`:`	height: auto,
`,A=r?`	inset: ${r}${c},
`:"",Me=a?`	stroke: ${a}${p} + rgb("${u}"),
`:"",Pe=d?`	radius: ${d}${w},
`:"",Ne=m?`	fill: rgb("${m}"),
`:"",ze=`#rect(
${g}${k}${A}${Me}${Pe}${Ne})[
	
]`,D=C();if(D){const ie=D.getSelection();ie&&D.executeEdits(null,[{range:ie,text:ze}])}}}]})}},{id:"figure",content:"#figure",classes:"",title:"Image avec légende",openModal:()=>{const t=document.createElement("div");t.innerHTML=`
        <div id="structures-rect-modal">
          <p class="structures-input-label">Non implémenté</p>
        </div>
      `,v({title:"Image avec légende",body:t,buttons:[]})}}];function ue(){const t=document.getElementById("structures-menu");t.style.fontFamily=f(),document.getElementById("structures-dropdown")||Q(!1)}function Q(t){const e=document.getElementById("structures-btn-icon");e&&e.classList.toggle("structures-btn-icon-rotate",t)}function ut(){const t=document.getElementById("structures-dropdown");t&&(t.innerHTML="",dt.forEach(e=>{const n=document.createElement("li");n.classList.add("structures-dropdown-item");const i=document.createElement("button");i.addEventListener("click",()=>{e.openModal()}),i.innerHTML=e.content,e.classes&&i.classList.add(...e.classes.split(" ")),i.title=e.title,e.id&&(i.id=e.id),n.appendChild(i),t.appendChild(n)}))}function pt(){mt(),gt(),vt()}function mt(){const t=document.querySelectorAll(".menu-item");t.forEach(e=>{const n=e.querySelector(".menu-trigger");n&&(n.addEventListener("click",i=>{i.stopPropagation();const o=e.classList.contains("open");j(),o||(e.classList.add("open"),e.id==="structures-menu"&&Q(!0))}),n.addEventListener("mouseenter",()=>{[...t].some(o=>o.classList.contains("open"))&&!e.classList.contains("open")&&(j(),e.classList.add("open"))}))}),document.addEventListener("click",j),document.addEventListener("keydown",e=>{e.key==="Escape"&&j()})}function j(){document.querySelectorAll(".menu-item.open").forEach(t=>{t.classList.remove("open"),t.id==="structures-menu"&&Q(!1)})}function yt(t){const e=document.getElementById("theme-toggle");if(!e)return;const n=localStorage.getItem("theme")??"light";pe(n,e,t),e.addEventListener("change",()=>{const i=e.checked?"light":"dark";localStorage.setItem("theme",i),pe(i,e,t)})}function pe(t,e,n){document.documentElement.setAttribute("data-theme",t),e.checked=t==="light",n?.(t)}function gt(){const t=document.getElementById("close-console");document.getElementById("output-console"),t?.addEventListener("click",()=>ft()),document.getElementById("toggle-console")?.addEventListener("click",()=>{j(),Te()})}function Te(){document.getElementById("output-console")?.classList.toggle("hidden")}function je(){document.getElementById("output-console")?.classList.remove("hidden")}function ft(){document.getElementById("output-console")?.classList.add("hidden")}const ht=200;function P(t,e){const n=document.getElementById("console-content");if(!n)return;for(;n.children.length>ht;)n.removeChild(n.firstChild);const i=document.createElement("div");i.className=`log-${t}`,i.textContent=`[${new Date().toLocaleTimeString()}] ${e}`,n.appendChild(i),n.scrollTop=n.scrollHeight}function vt(){const t=document.getElementById("resize-handle"),e=document.getElementById("editor-pane"),n=document.getElementById("preview-pane"),i=document.getElementById("main-split");if(!t||!e||!n||!i)return;let o=!1,s=0,l=0;t.addEventListener("mousedown",r=>{o=!0,s=r.clientX,l=e.getBoundingClientRect().width,t.classList.add("dragging"),document.body.style.cursor="col-resize",document.body.style.userSelect="none",r.preventDefault()}),document.addEventListener("mousemove",r=>{if(!o)return;const c=i.getBoundingClientRect().width,a=r.clientX-s,d=Math.min(Math.max(l+a,200),c-200)/c*100;e.style.flex=`0 0 ${d}%`,n.style.flex=`0 0 ${100-d}%`}),document.addEventListener("mouseup",()=>{o&&(o=!1,t.classList.remove("dragging"),document.body.style.cursor="",document.body.style.userSelect="")})}function bt({editor:t,onCompile:e,onEditorZoomIn:n,onEditorZoomOut:i,onEditorZoomReset:o,onNewProject:s,onOpenProject:l}){const r=monaco.KeyMod,c=monaco.KeyCode;t.addAction({id:"typst-bold",label:"Gras",keybindings:[r.CtrlCmd|c.KeyB],run:a=>O(a,"*","*")}),t.addAction({id:"typst-italic",label:"Italique",keybindings:[r.CtrlCmd|c.KeyI],run:a=>O(a,"_","_")}),t.addAction({id:"typst-underline",label:"Souligné",keybindings:[r.CtrlCmd|c.KeyU],run:a=>O(a,"#underline[","]")}),t.addAction({id:"editor-comment",label:"Commenter",keybindings:[r.CtrlCmd|r.Shift|c.Slash,r.CtrlCmd|c.Slash],run:a=>a.getAction("editor.action.commentLine")?.run()}),t.addAction({id:"typst-compile",label:"Compiler",keybindings:[r.CtrlCmd|c.KeyR],run:()=>e()}),t.addAction({id:"toggle-console",label:"Basculer la console",keybindings:[r.CtrlCmd|c.KeyE],run:()=>Te()}),t.addAction({id:"webview-zoom-in",label:"Agrandir",keybindings:[r.CtrlCmd|r.Shift|c.Equal],run:()=>ke()}),t.addAction({id:"webview-zoom-out",label:"Rétrécir",keybindings:[r.CtrlCmd|r.Shift|c.Minus,r.CtrlCmd|r.Shift|c.Digit6],run:()=>Ae()}),t.addAction({id:"webview-zoom-reset",label:"Taille normale",keybindings:[r.CtrlCmd|r.Shift|c.Digit0],run:()=>Be()}),t.addAction({id:"editor-zoom-in",label:"Agrandir l'éditeur",keybindings:[r.CtrlCmd|r.Alt|c.Equal],run:()=>n()}),t.addAction({id:"editor-zoom-out",label:"Rétrécir l'éditeur",keybindings:[r.CtrlCmd|r.Alt|c.Minus,r.CtrlCmd|r.Alt|c.Digit2],run:()=>i()}),t.addAction({id:"editor-zoom-reset",label:"Reset éditeur",keybindings:[r.CtrlCmd|r.Alt|c.Digit0],run:()=>o()}),document.addEventListener("keydown",a=>{(a.ctrlKey||a.metaKey)&&a.shiftKey&&a.code==="KeyN"&&(a.preventDefault(),s()),(a.ctrlKey||a.metaKey)&&a.shiftKey&&a.code==="KeyO"&&(a.preventDefault(),l()),(a.ctrlKey||a.metaKey)&&!a.shiftKey&&(a.code==="Slash"||a.key==="/")&&(a.preventDefault(),t.getAction("editor.action.commentLine")?.run())},!0)}function O(t,e,n){const i=t.getModel(),o=t.getSelection();if(!i||!o)return;const s=i.getValueInRange(o),l=s?`${e}${s}${n}`:`${e}${n}`;if(t.executeEdits("wrap",[{range:o,text:l,forceMoveMarkers:!0}]),!s){const r=t.getPosition();r&&t.setPosition({lineNumber:r.lineNumber,column:r.column-n.length})}t.focus()}const{invoke:L}=window.__TAURI__.core;function wt(t="project"){const e=document.createElement("div");e.innerHTML=`
<input type="text" placeholder="Titre de la note" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;" />
<label for="scope">Portée de la note:</label>
<select name="scope" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;">
    <option value="global" ${t==="global"?"selected":""}>Globale (visible dans tous les projets)</option>
    <option value="project" ${t==="project"?"selected":""}>Projet actuel seulement</option>
</select>
<textarea placeholder="Contenu de la note" style="width:100%;height:150px;padding:0.5rem;font-size:1rem;"/>
    `,v({title:"Ajouter une note",body:e,width:"75%",buttons:[{label:"Ajouter",primary:!0,onClick:async n=>{const i=e.querySelector("input")?.value.trim(),o=e.querySelector("textarea")?.value.trim(),s=e.querySelector("select")?.value;if(i&&o){let l;s=="project"?l=await L("get_current_project_id",{projectPath:$()?.path}):l=null,L("add_note",{title:i,content:o,scope:s,projectId:l}),n()}}}]})}function Et(t){const e=C();if(e){const n=e.getSelection();n&&e.executeEdits(null,[{range:n,text:t,forceMoveMarkers:!0}])}te()}async function _t(t){await ve({title:"Supprimer la note",message:"Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.",confirmLabel:"Supprimer",cancelLabel:"Annuler"})&&(await L("delete_note",{noteId:t}),te(),ee())}async function xt(t){const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.height="100%",e.innerHTML=`
<input type="text" placeholder="Titre de la note" value="${t.title}" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;border:1px solid #cecece;border-radius:6px;" />
<label for="scope">Portée de la note:</label>
<select name="scope" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;">
    <option value="global" ${t.scope==="global"?"selected":""}>Globale (visible dans tous les projets)</option>
    <option value="project" ${t.scope==="project"?"selected":""}>Projet actuel seulement</option>
</select>
<textarea placeholder="Contenu de la note" style="flex:1;width:100%;padding:0.5rem;font-size:1rem;border:1px solid #cecece;border-radius:6px;font-family:${f()};">${t.content}</textarea>
    `,v({title:"Modifier la note",body:e,width:"75%",height:"75%",buttons:[{label:"Enregistrer",primary:!0,onClick:async n=>{const i=e.querySelector("input")?.value.trim(),o=e.querySelector("textarea")?.value.trim(),s=e.querySelector("select")?.value;if(i&&o){let l;s=="project"?l=await L("get_current_project_id",{projectPath:$()?.path}):l=null,L("update_note",{noteId:t.id,title:i,content:o,scope:s,projectId:l}),n(),te(),ee()}}}]})}function $t(t){const e=new Date(t.created_at),n=e.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),i=e.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),o=new Date(t.updated_at),s=o.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),l=o.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),r=document.createElement("div");r.innerHTML=`
<div id="note-preview-metadata">
    <p>Crée le ${n} à ${i}</p>
    <p>Dernière modification le ${s} à ${l}</p>
    <p>Portée ${t.scope==="global"?"globale":"projet"}</p>
</div>
<div id="note-preview-content" style="font-family:${f()};">${t.content}</div>
    `,v({title:t.title,body:r,width:"75%",buttons:[]})}function me(t,e){t.querySelector(`#note-${e.id}`).addEventListener("click",()=>Et(e.content)),t.querySelector(`#delete-${e.id}`).addEventListener("click",()=>_t(e.id)),t.querySelector(`#edit-${e.id}`).addEventListener("click",()=>xt(e)),t.querySelector(`#view-${e.id}`).addEventListener("click",()=>$t(e))}async function Ct(){let t=await L("get_global_notes"),e=[];const n=$();n!==null&&(e=await L("get_project_notes",{projectPath:n.path}));const i=document.createElement("div");if(t.length+e.length===0)i.innerHTML="<p>Aucune note pour le moment.</p>";else{if(t.length>0){const o=document.createElement("h2");o.textContent="Notes globales",o.style.fontSize="1rem",o.style.fontWeight="bold",i.appendChild(o),t.forEach(s=>{const l=document.createElement("div");l.className="note-item",l.innerHTML=`
<span class="flex gap-2">
    <button class="note-btn" id="note-${s.id}">
        <div class="note-btn-title">${s.title}</div>
        <div class="note-btn-content" style="font-family: ${f()};">${s.content}</div>
    </button>
    <div class="flex items-center gap-1">
        <button class="delete-note-btn" id="delete-${s.id}">
            <span class="material-symbols-outlined delete-note-icon">delete</span>
        </button>
        <button class="edit-note-btn" id="edit-${s.id}">
            <span class="material-symbols-outlined edit-note-icon">edit</span>
        </button>
        <button class="view-note-btn" id="view-${s.id}">
            <span class="material-symbols-outlined view-note-icon">visibility</span>
        </button>
    </div>
</span>
                `,me(l,s),i.appendChild(l)})}if(n!==null&&e.length>0){const o=document.createElement("h2");o.textContent="Notes du projet",o.style.fontSize="1rem",o.style.fontWeight="bold",i.appendChild(o),e.forEach(s=>{const l=document.createElement("div");l.className="note-item",l.innerHTML=`
<span class="flex gap-2">
    <button class="note-btn" id="note-${s.id}">
        <div class="note-btn-title">${s.title}</div>
        <div class="note-btn-content" style="font-family: ${f()};">${s.content}</div>
    </button>
    <div class="flex items-center gap-1">
        <button class="delete-note-btn" id="delete-${s.id}">
            <span class="material-symbols-outlined delete-note-icon">delete</span>
        </button>
        <button class="edit-note-btn" id="edit-${s.id}">
            <span class="material-symbols-outlined edit-note-icon">edit</span>
        </button>
        <button class="view-note-btn" id="view-${s.id}">
            <span class="material-symbols-outlined view-note-icon">visibility</span>
        </button>
    </div>
</span>
                    `,me(l,s),i.appendChild(l)})}}return i}async function ee(){const t=document.createElement("div");t.appendChild(await Ct()),v({title:"Bloc-notes",body:t,width:window.innerWidth<1e3?"75%":"50%",buttons:[{label:"Ajouter une note",primary:!0,onClick:e=>{e(),wt()}}]})}function te(){const t=document.querySelector(".ide-modal-overlay");t&&t.remove()}const{invoke:S}=window.__TAURI__.core,{join:It}=window.__TAURI__.path;async function Lt(){const t=document.createElement("div");t.innerHTML=`
<div class="history-entry-form>
    <p id="history-entry-name">Veuillez choisir le chemin du projet</p>
    <button id="history-entry-path-btn" class="ide-button tool-btn">Choisir un dossier</button>
    <div><sub class="history-entry-path"><input id="history-entry-path-input" type="text" placeholder="Aucun chemin sélectionné" style="width:100%;"/></sub></div>
</div>
    `;let e;t.querySelector("#history-entry-path-btn").addEventListener("click",async()=>{e=await S("open_folder_dialog"),e&&(t.querySelector("#history-entry-path-input").value=e)}),v({title:"Ajouter un projet",body:t,width:"50%",buttons:[{label:"Annuler",primary:!1,onClick:n=>n()},{label:"Ajouter",primary:!0,onClick:async n=>{if(!e)return;const i=e.split(/[/\\]/).pop();if(console.log("Adding history entry:",{name:i,path:e}),!i||!e){h("error","Veuillez fournir un nom et un chemin valides.");return}try{await S("add_history_entry",{name:i,path:e})?(h("success","Projet ajouté à l'historique !"),n()):h("error","Ce projet existe déjà dans l'historique.")}catch(o){h("error","Erreur lors de l'ajout à l'historique : "+o)}}}]})}async function St(t){await ve({title:"Supprimer l'entrée",message:"Êtes-vous sûr de vouloir supprimer cette entrée de l'historique ? Cette action est irréversible."})&&(await S("delete_history_entry",{id:t}),oe(),h("success","Entrée supprimée de l'historique."),ne())}async function kt(t){const e=document.createElement("div");e.innerHTML=`
<div class="history-entry-form>
    <p id="history-entry-name">Veuillez choisir le chemin du projet</p>
    <button id="history-entry-path-btn" class="ide-button tool-btn">Choisir un dossier</button>
    <div><sub class="history-entry-path"><input id="history-entry-path-input" type="text" value="${t.path}" placeholder="Aucun chemin sélectionné" style="width:100%;"/></sub></div>
</div>
    `;let n;e.querySelector("#history-entry-path-btn").addEventListener("click",async()=>{n=await S("open_folder_dialog"),n&&(e.querySelector("#history-entry-path-input").value=n)}),v({title:"Modifier l'entrée",body:e,width:"50%",buttons:[{label:"Annuler",primary:!1,onClick:i=>i()},{label:"Enregistrer",primary:!0,onClick:async i=>{const o=e.querySelector("#history-entry-path-input").value.trim();if(!o||!n){h("error","Le nom et le chemin ne peuvent pas être vides.");return}try{await S("update_history_entry",{id:t.id,name:o,path:n}),h("success","Entrée de l'historique mise à jour !"),i(),oe(),ne()}catch(s){h("error","Erreur lors de la mise à jour de l'entrée : "+s)}}}]})}async function At(t){const e=new Date(t.created_at),n=e.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),i=e.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),o=new Date(t.updated_at),s=o.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}),l=o.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),r=await It(t.path,"main.typ"),c=await S("read_file",{path:r}),a=document.createElement("div");a.innerHTML=`
<div id="note-preview-metadata">
    <p>Chemin : ${t.path}</p>
    <p>Nom : ${t.name}</p>
    <p>Crée le ${n} à ${i}</p>
    <p>Dernière modification le ${s} à ${l}</p>
</div>
<div id="note-preview-content" style="font-family:${f()};">${c}</div>
    `,v({title:"Aperçu du projet",body:a,width:"75%",buttons:[]})}async function Bt(t){await et(t.path,e=>{const n=window.__typstEditor;n&&n.setValue(e)}),oe()}function Tt(t,e){t.querySelector(`#history-${e.id}`)?.addEventListener("click",async()=>await Bt(e)),t.querySelector(".delete-history-entry-btn")?.addEventListener("click",()=>St(e.id)),t.querySelector(".edit-history-entry-btn")?.addEventListener("click",()=>kt(e)),t.querySelector(".view-history-entry-btn")?.addEventListener("click",()=>At(e))}async function jt(){const t=await S("get_history"),e=document.createElement("div");return t.forEach(n=>{const i=document.createElement("div");i.className="history-entry",i.innerHTML=`
<span class="flex gap-2">
    <button class="history-entry-btn" id="history-${n.id}">
        <div class="history-entry-btn-title">${n.name}</div>
        <div class="history-entry-btn-content" style="font-family: ${f()};">${n.path}</div>
    </button>
    <div class="flex items-center gap-1">
        <button class="delete-history-entry-btn" id="delete-${n.id}">
            <span class="material-symbols-outlined delete-history-entry-icon">delete</span>
        </button>
        <button class="edit-history-entry-btn" id="edit-${n.id}">
            <span class="material-symbols-outlined edit-history-entry-icon">edit</span>
        </button>
        <button class="view-history-entry-btn" id="view-${n.id}">
            <span class="material-symbols-outlined view-history-entry-icon">visibility</span>
        </button>
    </div>
</span>
        `,Tt(i,n),e.appendChild(i)}),e}async function ne(){const t=document.createElement("div");t.appendChild(await jt()),v({title:"Historique des projets",body:t,width:window.innerWidth<1e3?"75%":"50%",buttons:[{label:"Fermer",primary:!0,onClick:e=>e()},{label:"Ajouter un projet",primary:!1,onClick:async e=>{await Lt(),e()}}]})}function oe(){const t=document.querySelector(".ide-modal-overlay");t&&t.remove()}async function Mt(){if(!window.__TAURI__){document.body.innerHTML='<p style="color:red;padding:1rem">Tauri API non disponible.</p>';return}pt(),await at();const t=document.getElementById("typst-editor"),e=await qe(t);window.__typstEditor=e,e.getDomNode().addEventListener("paste",Re),yt(s=>He(s)),T();const n=document.getElementById("preview"),i=document.getElementById("preview-frame");nt({getSource:()=>e.getValue(),onChange:s=>e.onDidChangeModelContent(s),getCursor:()=>e.getPosition(),preview:n,frame:i,onDiagnostics:s=>K(e,s),autoFit:!0,onZoomChange:T}),e.onDidChangeModelContent(()=>{V(!0),Ge(e.getValue())}),bt({editor:e,onCompile:()=>ye(e,n,i),onEditorZoomIn:()=>se(),onEditorZoomOut:()=>re(),onEditorZoomReset:()=>le(),onNewProject:()=>F(s=>e.setValue(s)),onOpenProject:()=>ae(s=>e.setValue(s))}),y("new-project",()=>F(s=>e.setValue(s))),y("open-project",()=>ae(s=>e.setValue(s))),y("action-undo",()=>e.trigger("","undo",null)),y("action-redo",()=>e.trigger("","redo",null)),y("action-search",()=>e.getAction("actions.find")?.run()),y("action-replace",()=>e.getAction("editor.action.startFindReplaceAction")?.run()),y("action-goto",()=>e.getAction("editor.action.gotoLine")?.run()),y("action-comment",()=>e.getAction("editor.action.commentLine")?.run()),y("webview-zoom-in",()=>ke()),y("webview-zoom-out",()=>Ae()),y("webview-zoom-reset",()=>Be()),y("editor-zoom-in",()=>se()),y("editor-zoom-out",()=>re()),y("editor-zoom-reset",()=>le()),y("unsaved-btn",()=>F(s=>e.setValue(s),e.getValue())),y("open-project-btn",()=>ne()),y("notepad-btn",()=>{ee()}),y("bold-btn",()=>C().getAction("typst-bold")?.run()),y("italic-btn",()=>C().getAction("typst-italic")?.run()),y("underline-btn",()=>C().getAction("typst-underline")?.run()),ue(),ut(),y("zoom-preview-in-btn",()=>{rt(),T()}),y("zoom-preview-out-btn",()=>{lt(),T()}),y("zoom-preview-reset-btn",()=>{$e(n,i),T()}),document.getElementById("compile-btn")?.addEventListener("click",()=>{ye(e,n,i)}),document.getElementById("save-btn")?.addEventListener("click",()=>{Pt(e)});const o=document.getElementById("auto-compile");o&&(o.checked=localStorage.getItem("auto-compile")!=="false",o.addEventListener("change",()=>{localStorage.setItem("auto-compile",String(o.checked))})),document.getElementById("editor-fontfamily-btn")?.addEventListener("click",async()=>{const{invoke:s}=window.__TAURI__.core,l=f(),r=await be({title:"Changer la police de l'éditeur",label:'Nom de la police (ex: "Fira Code", "JetBrains Mono", "Cascadia Mono")',placeholder:l||"Fira Code",validate:async c=>await s("font_exists",{name:c})||`Police "${c}" introuvable sur cette machine.`});r!==null&&(Oe(r),ue())}),we(),Ee()}function y(t,e){document.getElementById(t)?.addEventListener("click",n=>{n.preventDefault(),e()})}function T(){const t=document.getElementById("zoom-preview-input");t&&(t.value=ct())}async function ye(t,e,n){const{invoke:i}=window.__TAURI__.core;try{const o=await i("render_preview",{source:t.getValue(),root:$()?.path??null,cursor:t.getPosition()}),{html:s,jump_pos:l}=o;K(t,[]),e.querySelector(".preview-error")?.remove(),n.style.display="";const r=e.scrollTop;n.contentDocument.open(),n.contentDocument.write(s),n.contentDocument.close(),e.scrollTop=r,l&&X(n,e,l),P("success","Compilation successful")}catch(o){const s=Array.isArray(o)?o:[];K(t,s);const l=s.length>0?s.map(c=>{const a=c.line!=null?` (line ${c.line}, col ${c.column})`:"",p=c.hints?.length?`
  > ${c.hints.join(`
  > `)}`:"";return`${c.severity==="error"?"Error":"Warn"} ${c.message}${a}${p}`}).join(`
`):String(o);P("error",l),je(),n.style.display="none",e.querySelector(".preview-error")?.remove();const r=document.createElement("div");r.className="preview-error",r.textContent=s.length>0?s.map(c=>c.message).join(`
`):String(o),e.appendChild(r)}}function K(t,e){const n=t.getModel();if(!n)return;const i=e.map(o=>({severity:o.severity==="error"?monaco.MarkerSeverity.Error:monaco.MarkerSeverity.Warning,message:o.hints?.length?`${o.message}
Hint: ${o.hints.join(`
`)}`:o.message,startLineNumber:o.line??1,startColumn:o.column??1,endLineNumber:o.end_line??o.line??1,endColumn:o.end_column??(o.column!=null?o.column+1:2)}));monaco.editor.setModelMarkers(n,"typst",i)}async function Pt(t){const{invoke:e}=window.__TAURI__.core;try{let n=sessionStorage.getItem("pdf-export-path");if(!n){if(n=await e("pick_pdf_path"),!n)return;sessionStorage.setItem("pdf-export-path",n)}await e("export_pdf",{source:t.getValue(),path:n,root:$()?.path??null}),P("success",`PDF exporté : ${n}`)}catch(n){P("error",String(n)),je()}}Mt();
