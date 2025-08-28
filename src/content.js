
// src/content.js
// Injects a floating, draggable search box; handles selection and UI updates.

(function() {
  if (window.__geminiSearchBoxInjected) return;
  window.__geminiSearchBoxInjected = true;

  const box = document.createElement('div');
  box.id = 'gemini-search-box';
  box.style.position = 'fixed';
  box.style.zIndex = '2147483647';
  box.style.top = '20px';
  box.style.right = '20px';
  box.style.width = '340px';
  box.style.background = 'rgba(17,17,17,0.95)';
  box.style.color = '#fff';
  box.style.border = '1px solid rgba(255,255,255,0.2)';
  box.style.borderRadius = '12px';
  box.style.boxShadow = '0 6px 24px rgba(0,0,0,0.25)';
  box.style.font = '14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  box.style.backdropFilter = 'blur(6px)';
  box.style.padding = '10px 10px 12px';
  box.style.display = 'none';

  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <strong style="font-size:14px;">Gemini Assistant</strong>
      <span id="gemini-status" style="font-size:12px;opacity:0.75;margin-left:auto;">Ready</span>
      <button id="gemini-close" title="Close" style="background:transparent;border:0;color:#fff;cursor:pointer;font-size:16px;">×</button>
    </div>
    <textarea id="gemini-input" rows="3" placeholder="Ask about this page, or type an instruction (e.g., “summarize selection”)"
      style="width:100%;resize:vertical;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);color:#fff;padding:8px;"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button id="gemini-run" style="flex:1;border:0;border-radius:8px;padding:8px 10px;background:#6ee7b7;color:#063;cursor:pointer;">Go</button>
      <button id="gemini-use-selection" title="Insert selection" style="border:0;border-radius:8px;padding:8px 10px;background:#e5e7eb;color:#111;cursor:pointer;">Use selection</button>
    </div>
    <div id="gemini-output" style="margin-top:10px;max-height:260px;overflow:auto;"></div>
  `;

  document.documentElement.appendChild(box);

  // Draggable
  (function makeDraggable(el) {
    let pos1=0,pos2=0,pos3=0,pos4=0,drag=false;
    el.querySelector('#gemini-close').addEventListener('mousedown', e=>e.stopPropagation());
    el.addEventListener('mousedown', dragMouseDown);
    function dragMouseDown(e){ if(e.target.closest('textarea') || e.target.closest('button')) return;
      drag=true; pos3=e.clientX; pos4=e.clientY; document.onmouseup=closeDrag; document.onmousemove=elementDrag; }
    function elementDrag(e){
      if(!drag) return;
      pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + "px"; el.style.left = (el.offsetLeft - pos1) + "px"; el.style.right="auto";
    }
    function closeDrag(){ drag=false; document.onmouseup=null; document.onmousemove=null; }
  })(box);

  const input = box.querySelector('#gemini-input');
  const output = box.querySelector('#gemini-output');
  box.querySelector('#gemini-close').onclick = ()=> box.style.display='none';
  box.querySelector('#gemini-use-selection').onclick = ()=> {
    const sel = window.getSelection()?.toString();
    if (sel) input.value = (input.value ? input.value + "\n\n" : "") + sel;
  };
  box.querySelector('#gemini-run').onclick = run;

  async function run(){
    setStatus("Thinking…");
    const question = input.value.trim();
    const pageText = getPageText();
    try {
      const res = await chrome.runtime.sendMessage({ type:"RUN_GEMINI", mode:"qa_page", payload:{ question, pageText } });
      if (!res?.ok) throw new Error(res?.error || "Unknown error");
      output.innerText = res.data?.text || "(No response)";
    } catch (e) {
      output.innerText = "Error: " + e.message;
    } finally {
      setStatus("Ready");
    }
  }

  function setStatus(t){ box.querySelector('#gemini-status').innerText = t; }

  function getPageText(){
    // Reasonable limit to keep requests small
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const parts = [];
    let n; let total=0;
    while ((n = walker.nextNode())) {
      const tx = n.nodeValue.replace(/\s+/g,' ').trim();
      if (tx) {
        parts.push(tx);
        total += tx.length;
        if (total > 20000) break; // 20k chars cap
      }
    }
    return parts.join(' ').slice(0, 20000);
  }

  // Toast for quick messages
  function showToast(msg){
    const t = document.createElement('div');
    t.style.position='fixed'; t.style.bottom='20px'; t.style.right='20px';
    t.style.background='rgba(0,0,0,0.85)'; t.style.color='#fff'; t.style.padding='10px 12px';
    t.style.borderRadius='8px'; t.style.zIndex='2147483647'; t.style.boxShadow='0 3px 18px rgba(0,0,0,0.3)';
    t.textContent = msg; document.documentElement.appendChild(t);
    setTimeout(()=> t.remove(), 3000);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SHOW_SEARCH_BOX") {
      box.style.display = 'block';
      if (msg.preset === "summarize") input.value = "Summarize the selected text clearly and concisely.";
      if (msg.preset === "rewrite") input.value = "Rewrite the selected text to be clearer and more concise.";
      if (msg.preset === "qa") input.value = "What is this page about? Provide a quick brief.";
    } else if (msg.type === "SHOW_RESULT_TOAST") {
      showToast(msg.result);
    }
  });

  // Keyboard shortcut (local to page) Alt+G to toggle
  document.addEventListener('keydown', (e)=>{
    if (e.altKey && (e.key === 'g' || e.key === 'G')) {
      box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
    }
  });
})();
