import{r as l,j as e}from"./iframe-smjXhKmG.js";import"./preload-helper-PPVm8Dsz.js";const q="_statCard_a4yki_47",A="_statValue_a4yki_70",N="_accent_a4yki_82",w="_secondary_a4yki_86",M="_statSuffix_a4yki_90",E="_statLabel_a4yki_94",L="_spin_a4yki_1",t={statCard:q,statValue:A,accent:N,secondary:w,statSuffix:M,statLabel:E,spin:L},s=({value:a,suffix:d="",label:g,gradient:b="accent",animate:i=!0,className:_=""})=>{const u=l.useRef(null),[x,m]=l.useState(i&&typeof a=="number"?"0":String(a));l.useEffect(()=>{if(!i||typeof a!="number"){m(String(a));return}const p=u.current;if(!p)return;const c=new IntersectionObserver(([S])=>{if(S.isIntersecting){c.disconnect();const C=a,h=1e3,j=performance.now(),f=V=>{const k=V-j,y=Math.min(k/h,1),T=1-Math.pow(1-y,3);m(String(Math.round(T*C))),y<1&&requestAnimationFrame(f)};requestAnimationFrame(f)}},{threshold:.3});return c.observe(p),()=>c.disconnect()},[a,i]);const v=[t.statCard,_].filter(Boolean).join(" ");return e.jsxs("div",{ref:u,className:v,children:[e.jsxs("div",{className:`${t.statValue} ${t[b]}`,children:[x,d&&e.jsx("span",{className:t.statSuffix,children:d})]}),e.jsx("div",{className:t.statLabel,children:g})]})};s.__docgenInfo={description:"",methods:[],displayName:"StatCard",props:{value:{required:!0,tsType:{name:"union",raw:"number | string",elements:[{name:"number"},{name:"string"}]},description:""},suffix:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},label:{required:!0,tsType:{name:"string"},description:""},gradient:{required:!1,tsType:{name:"union",raw:"'accent' | 'secondary'",elements:[{name:"literal",value:"'accent'"},{name:"literal",value:"'secondary'"}]},description:"",defaultValue:{value:"'accent'",computed:!1}},animate:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};const F={title:"Common/StatCard",component:s,argTypes:{gradient:{control:"inline-radio",options:["accent","secondary"]},animate:{control:"boolean"}},args:{value:24,suffix:"+",label:"Weekly Classes",gradient:"accent",animate:!0}},r={},n={args:{value:8,suffix:"",label:"Certified Coaches",gradient:"secondary"}},o={render:()=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem"},children:[e.jsx(s,{value:350,suffix:"+",label:"Active Members"}),e.jsx(s,{value:92,suffix:"%",label:"Retention",gradient:"secondary"}),e.jsx(s,{value:6,label:"Years Strong"})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    value: 8,
    suffix: '',
    label: 'Certified Coaches',
    gradient: 'secondary'
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  }}>
      <StatCard value={350} suffix="+" label="Active Members" />
      <StatCard value={92} suffix="%" label="Retention" gradient="secondary" />
      <StatCard value={6} label="Years Strong" />
    </div>
}`,...o.parameters?.docs?.source}}};const G=["Accent","Secondary","Grid"];export{r as Accent,o as Grid,n as Secondary,G as __namedExportsOrder,F as default};
