import{j as e}from"./iframe-smjXhKmG.js";import{S as r}from"./SelectableCard-CzkM3BPC.js";import"./preload-helper-PPVm8Dsz.js";const{fn:t}=__STORYBOOK_MODULE_TEST__,c={title:"Common/SelectableCard",component:r,args:{icon:e.jsx("span",{style:{fontSize:"1.75rem"},children:"🎫"}),title:"I already have a domain",description:"I own a domain and want to connect it to my gym site.",onClick:t()}},n={},a={args:{icon:void 0,title:"Open Gym",description:"Drop in and train on your own schedule."}},o={render:()=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"},children:[e.jsx(r,{icon:e.jsx("span",{style:{fontSize:"1.75rem"},children:"➕"}),title:"I need a new domain",description:"I don't have a domain yet and need to register one.",onClick:t()}),e.jsx(r,{icon:e.jsx("span",{style:{fontSize:"1.75rem"},children:"🔗"}),title:"I already have a domain",description:"Connect a domain you already own.",onClick:t()})]})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:"{}",...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    icon: undefined,
    title: 'Open Gym',
    description: 'Drop in and train on your own schedule.'
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  }}>
      <SelectableCard icon={<span style={{
      fontSize: '1.75rem'
    }}>➕</span>} title="I need a new domain" description="I don't have a domain yet and need to register one." onClick={fn()} />
      <SelectableCard icon={<span style={{
      fontSize: '1.75rem'
    }}>🔗</span>} title="I already have a domain" description="Connect a domain you already own." onClick={fn()} />
    </div>
}`,...o.parameters?.docs?.source}}};const l=["Default","NoIcon","Pair"];export{n as Default,a as NoIcon,o as Pair,l as __namedExportsOrder,c as default};
