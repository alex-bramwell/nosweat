import{n as t,j as e,u as o}from"./iframe-smjXhKmG.js";import{g as l}from"./features-CFjQOLln.js";import"./Button-B5QbUlEo.js";import"./Card-sMFCjOf_.js";import{S as m}from"./Section-B6ca5VHv.js";import{C as s}from"./Container-2PDQuxo8.js";import"./Modal-BR97K09B.js";import"./CloseButton-BSgrvTRE.js";import"./Select-BiXoY_mJ.js";import"./NumberInput-D9GBtqAC.js";import"./DurationInput-Ck3y0L0h.js";import"./InfoTooltip-BpBG58aH.js";import"./EmptyStatePreview-BuwII2It.js";import"./StatusBadge-CZp99nK0.js";import"./DetailGrid-eBvufevI.js";import"./SelectableCard-CzkM3BPC.js";import"./InfoBox-YDmaZweb.js";import"./CardFields-DUUD8URq.js";import"./SectionNav-BHT5Fy2O.js";import"./RouteFallback-Bg8XPnGA.js";const c=({feature:a,children:n,fallback:r=null})=>t(a)?e.jsx(e.Fragment,{children:n}):e.jsx(e.Fragment,{children:r});c.__docgenInfo={description:"",methods:[],displayName:"FeatureGate",props:{feature:{required:!0,tsType:{name:"union",raw:`| 'class_booking'\r
| 'wod_programming'\r
| 'coach_profiles'\r
| 'day_passes'\r
| 'trial_memberships'\r
| 'service_booking'\r
| 'coach_analytics'\r
| 'member_management'\r
| 'custom_domain'`,elements:[{name:"literal",value:"'class_booking'"},{name:"literal",value:"'wod_programming'"},{name:"literal",value:"'coach_profiles'"},{name:"literal",value:"'day_passes'"},{name:"literal",value:"'trial_memberships'"},{name:"literal",value:"'service_booking'"},{name:"literal",value:"'coach_analytics'"},{name:"literal",value:"'member_management'"},{name:"literal",value:"'custom_domain'"}]},description:""},children:{required:!0,tsType:{name:"ReactNode"},description:""},fallback:{required:!1,tsType:{name:"ReactNode"},description:"Content to show when feature is disabled - null on public site, placeholder in builder",defaultValue:{value:"null",computed:!1}}}};const u=({feature:a})=>{const{gym:n}=o(),r=l(a),i=r?.name||a;return e.jsx(m,{spacing:"relaxed",background:"surface",children:e.jsx(s,{children:e.jsxs("div",{style:{textAlign:"center",padding:"4rem 1rem"},children:[e.jsx("div",{style:{fontSize:"3rem",marginBottom:"1rem"},children:r?.icon||"🔒"}),e.jsxs("h2",{style:{marginBottom:"0.75rem"},children:[i," is not available"]}),e.jsxs("p",{style:{color:"var(--color-muted)",maxWidth:"480px",margin:"0 auto"},children:["This feature is not currently enabled for ",n?.name||"this gym",". Contact your gym administrator for more information."]})]})})})};u.__docgenInfo={description:`Friendly page-level fallback shown when a user navigates to a route\r
whose feature is disabled for their gym.`,methods:[],displayName:"FeatureNotEnabled",props:{feature:{required:!0,tsType:{name:"union",raw:`| 'class_booking'\r
| 'wod_programming'\r
| 'coach_profiles'\r
| 'day_passes'\r
| 'trial_memberships'\r
| 'service_booking'\r
| 'coach_analytics'\r
| 'member_management'\r
| 'custom_domain'`,elements:[{name:"literal",value:"'class_booking'"},{name:"literal",value:"'wod_programming'"},{name:"literal",value:"'coach_profiles'"},{name:"literal",value:"'day_passes'"},{name:"literal",value:"'trial_memberships'"},{name:"literal",value:"'service_booking'"},{name:"literal",value:"'coach_analytics'"},{name:"literal",value:"'member_management'"},{name:"literal",value:"'custom_domain'"}]},description:""}}};export{c as F,u as a};
