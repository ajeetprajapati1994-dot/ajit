const $=s=>document.querySelector(s);
const toolData=[
["chat","✦","AI Assistant","Ask anything","What can I help you with today?"],
["writer","✎","AI Writer","Emails & content","Write a clear, engaging piece of content about: "],
["code","⌘","Code Assistant","Build & debug","Help me build or debug this code: "],
["business","◈","Business Planner","Ideas & strategy","Create a practical business plan for: "],
["marketing","◎","Marketing Studio","Campaigns & growth","Create a marketing strategy for: "],
["seo","⌕","SEO Assistant","Search visibility","Create a people-first SEO improvement plan for: "],
["email","✉","Email Writer","Professional emails","Write a professional email about: "],
["social","▣","Social Media","Posts & captions","Create social media posts for: "],
["summarizer","≡","Summarizer","Key points fast","Summarize this text and list key takeaways: "],
["translator","文","Translator","Translate naturally","Translate this text. Preserve its tone: "],
["study","⌑","Study Tutor","Learn step by step","Teach me this topic step by step: "],
["career","↗","Career Coach","CV & interviews","Help me improve my career profile for: "],
["startup","🚀","Startup Planner","Validate an idea","Create a lean startup plan for this idea: "],
["product","◇","Product Copy","Descriptions & ads","Write a compelling product description for: "],
["support","♡","Support Replies","Customer messages","Draft a helpful customer support reply to: "]
];
function code(){try{return localStorage.getItem("ajit_code")||""}catch{return ""}}
let current="chat",history=[];
const navs=$("#navs"),tiles=$("#tiles");
toolData.forEach((t,i)=>{
 const nav=document.createElement("button");nav.className="nav"+(!i?" active":"");nav.innerHTML=`<span class="ico">${t[1]}</span>${t[2]}`;nav.onclick=()=>select(t[0]);nav.dataset.id=t[0];navs.append(nav);
 if(i>0){const tile=document.createElement("button");tile.className="tile";tile.innerHTML=`<span class="tileico">${t[1]}</span><span><b>${t[2]}</b><small>${t[3]}</small></span>`;tile.onclick=()=>{select(t[0]);$("#prompt").value=t[4];$("#prompt").focus()};tiles.append(tile);}
});
function select(id){current=id;const t=toolData.find(x=>x[0]===id);$("#crumb").textContent=t[2];$("#toolTitle").textContent="AJIT AI "+t[2];$("#mode").textContent=t[2];$("#heroTitle").innerHTML=id==="chat"?'Make more possible<br><em>with one AI workspace.</em>':`${t[2]}<br><em>powered by AJIT AI.</em>`;$("#heroSub").textContent=t[3]+" — all in one workspace.";document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.id===id));}
function toast(s){const e=$("#toast");e.textContent=s;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),3600)}
function add(role,text){const d=document.createElement("div");d.className="msg "+role;const b=document.createElement("div");b.className="bubble";b.textContent=text;if(role==="assistant"){const a=document.createElement("span");a.className="bot";a.textContent="A";d.append(a,b)}else d.append(b);$("#messages").append(d);$("#messages").scrollTop=$("#messages").scrollHeight}
$("#clear").onclick=()=>{history=[];$("#messages").innerHTML='<div class="msg assistant"><span class="bot">A</span><div class="bubble"><b>New conversation ✨</b><p>What would you like to create?</p></div></div>'};
async function post(url,body,extra){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...extra},body:body&&JSON.stringify(body)});const d=await r.json().catch(()=>({}));return{r,d}}
async function ask(payload){let {r,d}=await post("/api/ai",payload,{"x-access-code":code()});
 if(r.status===401){try{localStorage.removeItem("ajit_code")}catch{}const c=window.prompt("Enter access code:");if(!c)throw Error("Access code is required to use AJIT AI.");try{localStorage.setItem("ajit_code",c)}catch{}({r,d}=await post("/api/ai",payload,{"x-access-code":c}));if(r.status===401){try{localStorage.removeItem("ajit_code")}catch{}throw Error("Incorrect access code. Please try again.")}}
 if(!r.ok)throw Error(d.error||(r.status>=500?"Server is waking up or busy. Please wait a few seconds and try again.":"Request failed"));return d}
$("#form").onsubmit=async e=>{e.preventDefault();const prompt=$("#prompt").value.trim();if(!prompt||$("#send").disabled)return;add("user",prompt);$("#prompt").value="";const wait=document.createElement("div");wait.className="msg assistant";wait.innerHTML='<span class="bot">A</span><div class="bubble">Thinking…</div>';$("#messages").append(wait);$("#messages").scrollTop=$("#messages").scrollHeight;$("#send").disabled=true;try{const d=await ask({tool:current,prompt,history});wait.remove();add("assistant",d.reply||"No response");history.push({role:"user",content:prompt},{role:"assistant",content:d.reply||""});if(d.demo)toast("Preview mode: configure an AI API key to activate real AI.");}catch(err){wait.remove();add("assistant","Sorry — "+err.message)}finally{$("#send").disabled=false}};
async function upgrade(){try{const {r,d}=await post("/api/create-checkout-session");if(!r.ok||!d.url)throw Error(d.error||"Pro plan is coming soon.");location.href=d.url}catch(e){toast(e.message)}}
$("#upgradeSide").onclick=upgrade;$("#upgradeTop").onclick=upgrade;
fetch("/api/status").then(r=>r.json()).then(d=>{$("#status").textContent=d.aiConfigured?"● AI connected":"● Preview mode";$("#status").style.color=d.aiConfigured?"#65d8a8":"#d6b77c"}).catch(()=>$("#status").textContent="● Status unavailable");
const billing=new URLSearchParams(location.search).get("billing");if(billing==="success")toast("Checkout returned successfully. Subscription entitlement/webhook setup is still required.");if(billing==="cancelled")toast("Checkout cancelled.");
