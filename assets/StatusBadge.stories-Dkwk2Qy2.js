import{j as a}from"./iframe-smjXhKmG.js";import{S as r}from"./StatusBadge-CZp99nK0.js";import"./preload-helper-PPVm8Dsz.js";const d={title:"Common/StatusBadge",component:r,argTypes:{variant:{control:"inline-radio",options:["default","warning","success","error"]},label:{control:"text"}},args:{label:"Active",variant:"success"}},e={},s={args:{label:"Pending DNS",variant:"warning"}},t={args:{label:"Failed",variant:"error"}},n={args:{label:"Draft",variant:"default"}},o={render:()=>a.jsxs("div",{style:{display:"flex",gap:"0.5rem",flexWrap:"wrap"},children:[a.jsx(r,{label:"Active",variant:"success"}),a.jsx(r,{label:"Pending DNS",variant:"warning"}),a.jsx(r,{label:"Failed",variant:"error"}),a.jsx(r,{label:"Not Configured",variant:"default"})]})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Pending DNS',
    variant: 'warning'
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Failed',
    variant: 'error'
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Draft',
    variant: 'default'
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  }}>
      <StatusBadge label="Active" variant="success" />
      <StatusBadge label="Pending DNS" variant="warning" />
      <StatusBadge label="Failed" variant="error" />
      <StatusBadge label="Not Configured" variant="default" />
    </div>
}`,...o.parameters?.docs?.source}}};const u=["Success","Warning","ErrorState","Default","AllVariants"];export{o as AllVariants,n as Default,t as ErrorState,e as Success,s as Warning,u as __namedExportsOrder,d as default};
