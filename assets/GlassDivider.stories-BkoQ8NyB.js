import{j as e}from"./iframe-smjXhKmG.js";import"./preload-helper-PPVm8Dsz.js";const c="_divider_xj3je_1",p="_gradient_xj3je_7",m="_glow_xj3je_11",t={divider:c,gradient:p,glow:m},l=({gradient:o=!0,glow:n=!1,className:d=""})=>{const i=[t.divider,o?t.gradient:"",n?t.glow:"",d].filter(Boolean).join(" ");return e.jsx("div",{className:i})};l.__docgenInfo={description:"",methods:[],displayName:"GlassDivider",props:{gradient:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},glow:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};const f={title:"Common/GlassDivider",component:l,argTypes:{gradient:{control:"boolean"},glow:{control:"boolean"}},args:{gradient:!0,glow:!1},decorators:[o=>e.jsxs("div",{style:{padding:"1rem 0"},children:[e.jsx("p",{style:{color:"var(--color-muted)"},children:"Above the divider"}),e.jsx(o,{}),e.jsx("p",{style:{color:"var(--color-muted)"},children:"Below the divider"})]})]},r={},s={args:{glow:!0}},a={args:{gradient:!1}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    glow: true
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    gradient: false
  }
}`,...a.parameters?.docs?.source}}};const v=["Gradient","Glowing","Plain"];export{s as Glowing,r as Gradient,a as Plain,v as __namedExportsOrder,f as default};
