import{j as o,r as p}from"./iframe-smjXhKmG.js";import{I as s}from"./ImageUpload-KMt1nt-m.js";import"./preload-helper-PPVm8Dsz.js";const l={title:"Gym Admin/ImageUpload",component:s,args:{label:"Logo",description:"Use a transparent PNG, around 240px tall.",value:"",gymId:"gym-1",assetType:"logo",onUpload:()=>{},onRemove:()=>{}}},n=e=>{const[m,t]=p.useState(e.value);return o.jsx("div",{style:{maxWidth:420},children:o.jsx(s,{...e,value:m,onUpload:t,onRemove:()=>t("")})})},a={render:e=>o.jsx(n,{...e})},r={args:{label:"Hero Background",description:"Recommended 1920x1080px.",value:"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",assetType:"hero_image"},render:e=>o.jsx(n,{...e})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: args => <Interactive {...args} />
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Hero Background',
    description: 'Recommended 1920x1080px.',
    value: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    assetType: 'hero_image'
  },
  render: args => <Interactive {...args} />
}`,...r.parameters?.docs?.source}}};const u=["Empty","WithImage"];export{a as Empty,r as WithImage,u as __namedExportsOrder,l as default};
