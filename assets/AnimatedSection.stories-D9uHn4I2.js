import{r as l,j as a}from"./iframe-smjXhKmG.js";import{C as p}from"./Card-sMFCjOf_.js";import"./preload-helper-PPVm8Dsz.js";const y="_animated_jbzor_75",S="_visible_jbzor_79",x="_fadeInUp_jbzor_79",z="_fadeInScale_jbzor_83",R="_slideInRight_jbzor_87",T="_stagger_jbzor_92",U="_fadeInDown_jbzor_1",w="_glassShimmer_jbzor_1",A="_softPulse_jbzor_1",C="_float_jbzor_1",E="_modalEntrance_jbzor_1",t={animated:y,visible:S,fadeInUp:x,fadeInScale:z,slideInRight:R,stagger:T,fadeInDown:U,glassShimmer:w,softPulse:A,float:C,modalEntrance:E},o=({children:s,animation:e="fadeInUp",delay:f=0,stagger:g=!1,threshold:d=.15,className:_="",style:I,...b})=>{const c=l.useRef(null),[h,m]=l.useState(!1);l.useEffect(()=>{const u=c.current;if(!u||e==="none"){m(!0);return}const i=new IntersectionObserver(([j])=>{j.isIntersecting&&(m(!0),i.disconnect())},{threshold:d});return i.observe(u),()=>i.disconnect()},[e,d]);const v=[t.animated,e!=="none"?t[e]:"",h?t.visible:"",g?t.stagger:"",_].filter(Boolean).join(" ");return a.jsx("div",{ref:c,className:v,style:{...I,"--animation-delay":`${f}ms`},...b,children:s})};o.__docgenInfo={description:"",methods:[],displayName:"AnimatedSection",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},animation:{required:!1,tsType:{name:"union",raw:"'fadeInUp' | 'fadeInScale' | 'slideInRight' | 'none'",elements:[{name:"literal",value:"'fadeInUp'"},{name:"literal",value:"'fadeInScale'"},{name:"literal",value:"'slideInRight'"},{name:"literal",value:"'none'"}]},description:"",defaultValue:{value:"'fadeInUp'",computed:!1}},delay:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"0",computed:!1}},stagger:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},threshold:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"0.15",computed:!1}},className:{defaultValue:{value:"''",computed:!1},required:!1}},composes:["HTMLAttributes"]};const k={title:"Common/AnimatedSection",component:o,argTypes:{animation:{control:"inline-radio",options:["fadeInUp","fadeInScale","slideInRight","none"]},delay:{control:{type:"number"}},stagger:{control:"boolean"}},args:{animation:"fadeInUp",delay:0,stagger:!1,children:null}},n={render:s=>a.jsx(o,{...s,children:a.jsxs(p,{variant:"raised",children:[a.jsx("h3",{style:{marginTop:0},children:"Reveals on scroll"}),a.jsx("p",{style:{color:"var(--color-muted)"},children:"This block animates in when it enters the viewport."})]})})},r={args:{stagger:!0},render:s=>a.jsx(o,{...s,children:[1,2,3].map(e=>a.jsxs(p,{variant:"raised",style:{marginBottom:"0.75rem"},children:["Item ",e]},e))})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: args => <AnimatedSection {...args}>
      <Card variant="raised">
        <h3 style={{
        marginTop: 0
      }}>Reveals on scroll</h3>
        <p style={{
        color: 'var(--color-muted)'
      }}>This block animates in when it enters the viewport.</p>
      </Card>
    </AnimatedSection>
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    stagger: true
  },
  render: args => <AnimatedSection {...args}>
      {[1, 2, 3].map(n => <Card key={n} variant="raised" style={{
      marginBottom: '0.75rem'
    }}>Item {n}</Card>)}
    </AnimatedSection>
}`,...r.parameters?.docs?.source}}};const B=["FadeInUp","Staggered"];export{n as FadeInUp,r as Staggered,B as __namedExportsOrder,k as default};
