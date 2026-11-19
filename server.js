import "dotenv/config";
import express from "express";
import Stripe from "stripe";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
app.set("trust proxy",1);
app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(root,"public")));


// ---- Protection: access code + rate limits (in-memory; resets on restart) ----
const ACCESS_CODE=process.env.ACCESS_CODE||"";
const PER_IP_HOURLY=Number(process.env.RATE_LIMIT_PER_HOUR||20);
const GLOBAL_DAILY=Number(process.env.DAILY_LIMIT||300);
const ipHits=new Map(); let day={d:new Date().toISOString().slice(0,10),n:0};
setInterval(()=>{const cut=Date.now()-3600000;for(const [k,v] of ipHits){const f=v.filter(t=>t>cut);f.length?ipHits.set(k,f):ipHits.delete(k)}},600000).unref();
function sameCode(a){const x=crypto.createHash("sha256").update(String(a||"")).digest(),y=crypto.createHash("sha256").update(ACCESS_CODE).digest();return crypto.timingSafeEqual(x,y)}
function guard(req,res,next){
  if(ACCESS_CODE && !sameCode(req.get("x-access-code"))) return res.status(401).json({error:"Access code required or incorrect.",needCode:true});
  const now=Date.now(),today=new Date().toISOString().slice(0,10);
  if(day.d!==today) day={d:today,n:0};
  if(day.n>=GLOBAL_DAILY) return res.status(429).json({error:"Daily usage limit reached. Please try again tomorrow."});
  const hits=(ipHits.get(req.ip)||[]).filter(t=>t>now-3600000);
  if(hits.length>=PER_IP_HOURLY) return res.status(429).json({error:"Too many requests. Please try again in a while."});
  hits.push(now);ipHits.set(req.ip,hits);day.n++;next();
}

const tools = new Set(["chat","writer","code","business","marketing","seo","email","social","summarizer","translator","study","career","startup","product","support"]);
app.get("/api/status", (_req,res)=>res.json({
  ok:true, version:"2.0.0", accessRequired:Boolean(ACCESS_CODE),
  aiConfigured:Boolean(process.env.OPENAI_API_KEY),
  billingConfigured:process.env.ENABLE_BILLING==="true" && Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
  features:["AI Chat","Writing Studio","Code Assistant","Business Planner","Marketing Studio","SEO Assistant","Email Writer","Social Media Studio","Summarizer","Translator","Study Tutor","Career Coach","Startup Planner","Product Description","Customer Support Drafts"]
}));

app.post("/api/ai", guard, async(req,res)=>{
  const {tool="chat",prompt,history=[]}=req.body||{};
  if(!tools.has(tool)) return res.status(400).json({error:"Unknown AI tool."});
  if(typeof prompt!=="string" || !prompt.trim() || prompt.length>12000) return res.status(400).json({error:"Enter a prompt (maximum 12,000 characters)."});
  const safeHistory = Array.isArray(history) ? history.slice(-10).filter(m=>["user","assistant"].includes(m?.role)&&typeof m?.content==="string").map(m=>({role:m.role,content:m.content.slice(0,5000)})) : [];
  const instructions = {
    chat:"Answer accurately and clearly. State uncertainty when needed.",
    writer:"Act as an expert editor and copywriter. Produce polished, original writing.",
    code:"Act as a senior software engineer. Explain assumptions, provide safe code and testing steps.",
    business:"Act as a practical business strategist. Give realistic steps, risks, and simple metrics.",
    marketing:"Act as a marketing strategist. Create ethical campaigns and measurable plans.",
    seo:"Act as an SEO consultant. Give useful, people-first recommendations; never promise rankings.",
    email:"Write a concise, professional email with a useful subject line when appropriate.",
    social:"Create platform-appropriate social content with a clear call to action.",
    summarizer:"Summarize the supplied material faithfully. Do not invent missing details.",
    translator:"Translate while preserving meaning, tone, and formatting.",
    study:"Teach step by step, with examples and a short knowledge check.",
    career:"Give practical, truthful career guidance and tailored application material.",
    startup:"Create a realistic startup plan including customer, problem, MVP, costs, and validation.",
    product:"Write clear, persuasive product copy without unsupported claims.",
    support:"Draft empathetic, helpful customer-support responses; do not claim actions were completed."
  };
  if(!process.env.OPENAI_API_KEY) return res.json({
    demo:true,
    reply:`AJIT AI ${tool.toUpperCase()} is ready in preview mode.\n\nYour request:\n${prompt}\n\nTo activate live AI answers, add your provider API key to the hosting environment. This preview does not pretend to generate a real AI result.`
  });
  try{
    const endpoint=(process.env.OPENAI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"");
    const response=await fetch(`${endpoint}/chat/completions`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||"gpt-4o-mini",
        messages:[{role:"system",content:`You are AJIT AI, a professional multi-tool assistant. ${instructions[tool]} Be helpful, safe, and honest.`},...safeHistory,{role:"user",content:prompt}],
        temperature:0.65
      }),
      signal:AbortSignal.timeout(60000)
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) return res.status(502).json({error:data?.error?.message||"AI provider request failed."});
    res.json({reply:data.choices?.[0]?.message?.content||"No answer was returned."});
  }catch(e){console.error("AI provider:",e.message);res.status(502).json({error:"AI provider is temporarily unavailable. Please try again."});}
});

app.post("/api/create-checkout-session",async(req,res)=>{
  if(process.env.ENABLE_BILLING!=="true") return res.status(503).json({error:"Pro plan is coming soon."});
  if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_PRICE_ID) return res.status(503).json({error:"Billing is not configured. Add your Stripe secret key and recurring monthly price ID in hosting settings."});
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin=process.env.APP_URL||`${req.protocol}://${req.get("host")}`;
    const session=await stripe.checkout.sessions.create({
      mode:"subscription",
      line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],
      success_url:`${origin}/?billing=success`,
      cancel_url:`${origin}/?billing=cancelled`
    });
    res.json({url:session.url});
  }catch(e){console.error("Stripe:",e.message);res.status(500).json({error:"Could not create checkout session. Verify Stripe settings."});}
});
app.get("*",(_req,res)=>res.sendFile(path.join(root,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`AJIT AI Ultimate running on port ${PORT}`));
