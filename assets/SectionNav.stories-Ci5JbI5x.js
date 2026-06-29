import{j as t,r as l}from"./iframe-smjXhKmG.js";import{S as o}from"./SectionNav-BHT5Fy2O.js";import"./preload-helper-PPVm8Dsz.js";const m=[{id:"overview",label:"Overview",done:!0},{id:"branding",label:"Branding",done:!0},{id:"schedule",label:"Schedule",done:!1},{id:"payments",label:"Payments",done:!1}],u={title:"Common/SectionNav",component:o,argTypes:{variant:{control:"inline-radio",options:["floating","inline"]}},args:{items:m,activeId:"schedule",title:"Setup",variant:"inline",onSelect:()=>{}}},s=e=>{const[i,c]=l.useState(e.activeId),d=e.variant==="inline",r=t.jsx(o,{...e,activeId:i,onSelect:c});return d?t.jsx("div",{style:{maxWidth:320},children:r}):r},n={args:{meta:"2 of 4 done"},render:e=>t.jsx(s,{...e})},a={args:{variant:"floating"},render:e=>t.jsx(s,{...e})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    meta: '2 of 4 done'
  },
  render: args => <Interactive {...args} />
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'floating'
  },
  render: args => <Interactive {...args} />
}`,...a.parameters?.docs?.source}}};const f=["Inline","Floating"];export{a as Floating,n as Inline,f as __namedExportsOrder,u as default};
