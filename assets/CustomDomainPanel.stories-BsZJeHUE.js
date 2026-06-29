import{w as g,f as l,j as n,h as s,r as m}from"./iframe-smjXhKmG.js";import{C as i}from"./CustomDomainPanel-C1_ysGae.js";import"./preload-helper-PPVm8Dsz.js";import"./auth-B4TxNUcQ.js";import"./Button-B5QbUlEo.js";import"./Card-sMFCjOf_.js";import"./Section-B6ca5VHv.js";import"./Container-2PDQuxo8.js";import"./Modal-BR97K09B.js";import"./CloseButton-BSgrvTRE.js";import"./Select-BiXoY_mJ.js";import"./useDismiss-D_2lBmGb.js";import"./NumberInput-D9GBtqAC.js";import"./DurationInput-Ck3y0L0h.js";import"./InfoTooltip-BpBG58aH.js";import"./index-Bgeceq6O.js";import"./index-Bn142nAq.js";import"./FeatureNotEnabled-D9PZ2Ovp.js";import"./features-CFjQOLln.js";import"./EmptyStatePreview-BuwII2It.js";import"./StatusBadge-CZp99nK0.js";import"./DetailGrid-eBvufevI.js";import"./SelectableCard-CzkM3BPC.js";import"./InfoBox-YDmaZweb.js";import"./CardFields-DUUD8URq.js";import"./SectionNav-BHT5Fy2O.js";import"./RouteFallback-Bg8XPnGA.js";const B={title:"Gym Admin/CustomDomainPanel",component:i,parameters:{layout:"fullscreen",auth:l},decorators:[g],args:{gymName:"Iron Forge Fitness",slug:"iron-forge",onNameChange:()=>{},onSlugChange:()=>{}}},a=r=>{const[p,c]=m.useState(r.gymName),[u,d]=m.useState(r.slug);return n.jsx(i,{...r,gymName:p,onNameChange:c,slug:u,onSlugChange:d})},e={render:r=>n.jsx(a,{...r})},o={parameters:{tenant:{gym:{...s,custom_domain:null,custom_domain_status:"none"}}},render:r=>n.jsx(a,{...r})},t={parameters:{tenant:{gym:{...s,custom_domain_status:"pending"}}},render:r=>n.jsx(a,{...r})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: args => <Wrapper {...args} />
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  parameters: {
    tenant: {
      gym: {
        ...mockGym,
        custom_domain: null,
        custom_domain_status: 'none'
      }
    }
  },
  render: args => <Wrapper {...args} />
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  parameters: {
    tenant: {
      gym: {
        ...mockGym,
        custom_domain_status: 'pending'
      }
    }
  },
  render: args => <Wrapper {...args} />
}`,...t.parameters?.docs?.source}}};const H=["DomainVerified","NotConfigured","PendingDns"];export{e as DomainVerified,o as NotConfigured,t as PendingDns,H as __namedExportsOrder,B as default};
