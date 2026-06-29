import{j as m}from"./iframe-smjXhKmG.js";import"./preload-helper-PPVm8Dsz.js";const p="_gradientText_1kfaq_1",u="_accent_1kfaq_9",g="_secondary_1kfaq_13",_="_warm_1kfaq_17",f="_cool_1kfaq_21",t={gradientText:p,accent:u,secondary:g,warm:_,cool:f},o=({children:s,as:c="span",gradient:l="accent",className:i=""})=>{const d=[t.gradientText,t[l],i].filter(Boolean).join(" ");return m.jsx(c,{className:d,children:s})};o.__docgenInfo={description:"",methods:[],displayName:"GradientText",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},as:{required:!1,tsType:{name:"union",raw:"'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p'",elements:[{name:"literal",value:"'h1'"},{name:"literal",value:"'h2'"},{name:"literal",value:"'h3'"},{name:"literal",value:"'h4'"},{name:"literal",value:"'span'"},{name:"literal",value:"'p'"}]},description:"",defaultValue:{value:"'span'",computed:!1}},gradient:{required:!1,tsType:{name:"union",raw:"'accent' | 'secondary' | 'warm' | 'cool'",elements:[{name:"literal",value:"'accent'"},{name:"literal",value:"'secondary'"},{name:"literal",value:"'warm'"},{name:"literal",value:"'cool'"}]},description:"",defaultValue:{value:"'accent'",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};const v={title:"Common/GradientText",component:o,argTypes:{as:{control:"inline-radio",options:["h1","h2","h3","h4","span","p"]},gradient:{control:"inline-radio",options:["accent","secondary","warm","cool"]},children:{control:"text"}},args:{children:"Forge Your Strength",as:"h1",gradient:"accent"}},e={},a={args:{gradient:"secondary"}},r={args:{gradient:"warm"}},n={args:{gradient:"cool"}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    gradient: 'secondary'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    gradient: 'warm'
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    gradient: 'cool'
  }
}`,...n.parameters?.docs?.source}}};const x=["Accent","Secondary","Warm","Cool"];export{e as Accent,n as Cool,a as Secondary,r as Warm,x as __namedExportsOrder,v as default};
