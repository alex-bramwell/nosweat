import{j as t,r as c}from"./iframe-smjXhKmG.js";import{S as s}from"./Select-BiXoY_mJ.js";import"./preload-helper-PPVm8Dsz.js";import"./useDismiss-D_2lBmGb.js";const p={title:"Common/Select",component:s,args:{options:[{value:"amrap",label:"AMRAP"},{value:"for-time",label:"For Time"},{value:"emom",label:"EMOM"},{value:"strength",label:"Strength"}],value:"amrap",placeholder:"Select workout type...",disabled:!1,onChange:()=>{}}},o=e=>{const[n,l]=c.useState(e.value);return t.jsx("div",{style:{maxWidth:280},children:t.jsx(s,{...e,value:n,onChange:l})})},r={render:e=>t.jsx(o,{...e})},a={args:{disabled:!0},render:e=>t.jsx(o,{...e})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => <Interactive {...args} />
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  },
  render: args => <Interactive {...args} />
}`,...a.parameters?.docs?.source}}};const g=["Default","Disabled"];export{r as Default,a as Disabled,g as __namedExportsOrder,p as default};
