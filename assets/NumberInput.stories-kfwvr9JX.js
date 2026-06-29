import{j as s,r as c}from"./iframe-smjXhKmG.js";import{N as t}from"./NumberInput-D9GBtqAC.js";import"./preload-helper-PPVm8Dsz.js";const i={title:"Common/NumberInput",component:t,args:{value:5,min:0,max:999,step:1,label:"reps",onChange:()=>{}}},n=e=>{const[o,m]=c.useState(e.value);return s.jsx("div",{style:{maxWidth:220},children:s.jsx(t,{...e,value:o,onChange:m})})},r={render:e=>s.jsx(n,{...e})},a={args:{value:60,label:"kg",step:5,max:300},render:e=>s.jsx(n,{...e})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => <Interactive {...args} />
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    value: 60,
    label: 'kg',
    step: 5,
    max: 300
  },
  render: args => <Interactive {...args} />
}`,...a.parameters?.docs?.source}}};const d=["Default","Weight"];export{r as Default,a as Weight,d as __namedExportsOrder,i as default};
