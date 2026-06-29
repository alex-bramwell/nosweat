import{u as T,b as v,r as i,j as t,s as g,w as k,h as _}from"./iframe-smjXhKmG.js";import"./preload-helper-PPVm8Dsz.js";const y=()=>{const{gym:e,refreshTenant:x}=T(),{user:h}=v(),[b,w]=i.useState(0),[r,o]=i.useState(!1),l=e&&h?.id===e.owner_id;if(i.useEffect(()=>{if(!e||e.trial_status!=="active")return;(async()=>{const{count:p}=await g.from("profiles").select("*",{count:"exact",head:!0}).eq("gym_id",e.id).eq("role","member");p!==null&&w(p)})()},[e]),!e||!e.trial_end_date||e.trial_status!=="active"&&e.trial_status!=="expired")return null;const S=new Date,j=new Date(e.trial_end_date),s=Math.max(0,Math.ceil((j.getTime()-S.getTime())/(1e3*60*60*24))),d=s===0||e.trial_status==="expired",c=async()=>{if(e){o(!0);try{await g.from("gyms").update({trial_status:"active",trial_start_date:new Date().toISOString(),trial_end_date:new Date(Date.now()+336*60*60*1e3).toISOString()}).eq("id",e.id),await x()}finally{o(!1)}}},m={display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"0.5rem 1rem",background:d?"linear-gradient(90deg, #dc2626 0%, #ef4444 100%)":"linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)",color:"#ffffff",fontSize:"0.875rem",fontWeight:500,textAlign:"center",zIndex:100,fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif"},f={color:"#ffffff",fontWeight:700,textDecoration:"underline",textUnderlineOffset:"2px"},u={background:"rgba(255, 255, 255, 0.2)",border:"1px solid rgba(255, 255, 255, 0.4)",color:"#ffffff",padding:"0.2rem 0.6rem",borderRadius:"6px",fontSize:"0.75rem",fontWeight:600,cursor:r?"wait":"pointer",opacity:r?.6:1,fontFamily:"inherit"};return d?t.jsxs("div",{style:m,children:[t.jsx("span",{children:"Your free trial has ended."}),t.jsx("a",{href:"/subscribe",style:f,children:"Upgrade now"}),l&&t.jsx("button",{style:u,onClick:c,disabled:r,children:r?"Resetting...":"Reset trial"})]}):t.jsxs("div",{style:m,children:[t.jsxs("span",{children:["Free trial: ",t.jsxs("strong",{children:[s," day",s!==1?"s":""," left"]})," ","·"," ",t.jsxs("strong",{children:[b,"/",e.trial_member_limit]})," members"]}),t.jsx("a",{href:"/subscribe",style:f,children:"Upgrade"}),l&&t.jsx("button",{style:u,onClick:c,disabled:r,children:r?"Resetting...":"Reset trial"})]})};y.__docgenInfo={description:"",methods:[],displayName:"TrialBanner"};const E={title:"Common/TrialBanner",component:y,parameters:{layout:"fullscreen"},decorators:[k]},a={parameters:{tenant:{gym:{..._,trial_status:"active",trial_start_date:"2026-06-20",trial_end_date:"2026-07-04"}}}},n={parameters:{tenant:{gym:{..._,trial_status:"expired",trial_end_date:"2026-06-10"}}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  parameters: {
    tenant: {
      gym: {
        ...mockGym,
        trial_status: 'active',
        trial_start_date: '2026-06-20',
        trial_end_date: '2026-07-04'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  parameters: {
    tenant: {
      gym: {
        ...mockGym,
        trial_status: 'expired',
        trial_end_date: '2026-06-10'
      }
    }
  }
}`,...n.parameters?.docs?.source}}};const I=["ActiveTrial","ExpiredTrial"];export{a as ActiveTrial,n as ExpiredTrial,I as __namedExportsOrder,E as default};
