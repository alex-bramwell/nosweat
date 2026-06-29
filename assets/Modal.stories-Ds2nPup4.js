import{j as e,r as m}from"./iframe-smjXhKmG.js";import{M as s}from"./Modal-BR97K09B.js";import{B as d}from"./Button-B5QbUlEo.js";import"./preload-helper-PPVm8Dsz.js";import"./CloseButton-BSgrvTRE.js";const h={title:"Common/Modal",component:s,parameters:{layout:"fullscreen"},argTypes:{size:{control:"inline-radio",options:["compact","default","wide","fullscreen"]}},args:{size:"default",isOpen:!0,onClose:()=>{},children:null}},c=()=>e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h2",{style:{marginTop:0},children:"Start Your Free Trial"}),e.jsx("p",{style:{color:"var(--color-muted)"},children:"Experience the Iron Forge difference with no commitment. Your first class is on us."}),e.jsx(d,{variant:"primary",fullWidth:!0,children:"Continue to Create Account"})]}),p=r=>{const[i,l]=m.useState(!1);return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx(d,{onClick:()=>l(!0),children:"Open modal"}),e.jsx(s,{...r,isOpen:i,onClose:()=>l(!1),children:e.jsx(c,{})})]})},o={render:r=>e.jsx(p,{...r})},a={args:{size:"compact"},render:r=>e.jsx(s,{...r,onClose:()=>{},children:e.jsx(c,{})})},n={args:{size:"wide"},render:r=>e.jsx(s,{...r,onClose:()=>{},children:e.jsx(c,{})})},t={args:{size:"fullscreen"},render:r=>e.jsx(s,{...r,onClose:()=>{},children:e.jsx(c,{})})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: args => <Interactive {...args} />
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'compact'
  },
  render: args => <Modal {...args} onClose={() => {}}><DemoBody /></Modal>
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'wide'
  },
  render: args => <Modal {...args} onClose={() => {}}><DemoBody /></Modal>
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'fullscreen'
  },
  render: args => <Modal {...args} onClose={() => {}}><DemoBody /></Modal>
}`,...t.parameters?.docs?.source}}};const C=["Default","Compact","Wide","Fullscreen"];export{a as Compact,o as Default,t as Fullscreen,n as Wide,C as __namedExportsOrder,h as default};
