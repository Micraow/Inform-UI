/** Original compositions. All actions are bounded, local runtime state changes. */
export function createDesignExamples(image) {
  if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) throw new TypeError('An embedded, licensed raster illustration is required');
  const art = JSON.stringify(image);
  return [
    {
      id: 'DesignFoundations', title: 'Color has a job', layer: 'design',
      description: 'Four semantic roles, official SVG glyphs, visible labels, and readable light/dark surfaces.',
      source: `root=Stack([
 Heading("Color has a job",1),
 Text("Use restrained color to explain meaning. These are illustrative states, not claims about real data.","muted"),
 Grid([
  Card([Row([Icon("InfoCircle",null,"info",24),Heading("Information",3)]),Badge("New detail","info"),Text("Helpful context that changes how to read the answer.","info"),Alert("About this example","The supplied data is fictional and stays in this page.","info")]),
  Card([Row([Icon("CheckCircle",null,"success",24),Heading("Success",3)]),Badge("Saved locally","success"),Text("A completed local action, confirmed by the state.","success"),Alert("Draft saved","This example illustrates a completed state.","success")]),
  Card([Row([Icon("TriangleExclamationErrorWarning",null,"warning",24),Heading("Attention",3)]),Badge("Review needed","warning"),Text("Something to inspect before taking the next step.","warning"),Alert("A detail is missing","Add a caption before sharing the draft.","warning")]),
  Card([Row([Icon("Warning",null,"error",24),Heading("Error",3)]),Badge("Action failed","error"),Text("Explain the problem and make the next step clear.","error"),Alert("Could not save","This is an illustrative error. Try again after checking the input.","error")])
 ],2,"lg"),
 Divider(),
 Heading("One glyph, deliberate sizes",2),
 Row([Icon("Calendar","Calendar, 16 pixels","muted",16),Icon("Calendar","Calendar, 20 pixels","default",20),Icon("Calendar","Calendar, 24 pixels","info",24),Icon("Calendar","Calendar, 32 pixels","info",32),Icon("Calendar","Calendar, 48 pixels","info",48)],"lg"),
 Text("The glyph geometry comes from OpenAI Apps SDK UI. Semantic assignments and these compositions are Inform UI choices.","muted")
],"xl")`
    },
    {
      id: 'CreativeBrief', title: 'A small creative studio', layer: 'composition',
      description: 'Illustration, official icons, a real selection, editable notes, and a visible local-save result.',
      source: `$direction="image"
$notes="Keep the composition calm and leave room to breathe."
$saved=false
root=Stack([
 Row([Icon("ImageSquare",null,"info",24),Badge("CREATIVE BRIEF","info")],"sm"),
 Heading("Make room for a new idea",1),
 Text("Explore a visual direction, add a short note, and save a local preview. The illustration is original project sample media.","muted"),
 Grid([
  Card([Image(${art},"An original abstract landscape of overlapping geometric shapes","Original project illustration · embedded for offline viewing"),Row([Icon("Lightbulb",null,"warning",20),Text("A starting point, with space to experiment.","muted")])]),
  Card([Heading("Choose a direction",2),RadioGroup("What would you like to explore?",$direction,[{label:"Visual story",value:"image"},{label:"A thoughtful explanation",value:"think"},{label:"A reading note",value:"read"}]),Textarea("Creative notes",$notes,3,"Add a direction"),Button("Save local draft",@Set($saved,true))])
 ],2,"lg"),
 Card([Row([Icon($direction=="image" ? "ImageSquare" : $direction=="think" ? "Lightbulb" : "BookOpen",null,"info",32),Heading($direction=="image" ? "Visual story" : $direction=="think" ? "A thoughtful explanation" : "A reading note",2),Badge($saved ? "Saved locally" : "Draft",$saved ? "success" : "muted")]),Text($notes),$saved ? Alert("Local draft saved","The selection and notes remain editable in this preview. No message has been sent.","success") : Text("Choose a direction and save when you are ready.","muted"),Button("Clear saved status",@Reset($saved),"ghost")])
],"xl")`
    },
    {
      id: 'QuietMorning', title: 'A quieter morning', layer: 'composition',
      description: 'A useful image-led answer with schedule icons, adjustable depth, and a completed-state transition.',
      source: `$pace="short"
$ready=false
root=Stack([
 Row([Icon("Calendar",null,"info",24),Badge("MORNING PLAN","info")],"sm"),
 Heading("A little focus before the day begins",1),
 Text("A fictional plan for reading, reflecting, and making one small decision.","muted"),
 Grid([
  Card([Image(${art},"An original geometric illustration in a muted landscape palette","A calm visual cue for this original sample plan"),Row([Icon("Clock",null,"muted",20),Text($pace=="short" ? "15 minutes · a short pause" : "30 minutes · room to go deeper","muted")])]),
  Stack([Card([Row([Icon("BookOpen",null,"info",24),Heading("Read one good page",3)]),Text("Pick a passage worth lingering on. Write down a single idea you want to keep.")]),Card([Row([Icon("Lightbulb",null,"warning",24),Heading("Make one connection",3)]),Text("How could that idea change something you are working on?")])],"lg")
 ],2,"lg"),
 Card([Select("How much space do you have?",$pace,[{label:"A short pause · 15 minutes",value:"short"},{label:"A slower morning · 30 minutes",value:"long"}]),Checkbox("I have chosen the page and written one note",$ready),Row([Icon($ready ? "CheckCircle" : "Clock",null,$ready ? "success" : "muted",24),Badge($ready ? "Ready for the day" : "Still making room",$ready ? "success" : "muted")]),$ready ? Alert("A small start, complete","Your checkmark updates this local plan only.","success") : Alert("Keep it small","One useful note is enough. This is a local example, not a scheduled reminder.","info"),Button("Start fresh",@Reset($ready),"secondary")])
],"xl")`
    }
  ];
}

/** Mount a teaching index; opening a composition must use the real DSL renderer. */
export function mountDesignFoundations(container, {api, tokens, examples, onOpenExample, onOpenIcons, theme = 'light'}) {
  if (!api?.createIcon || !api?.getIcon) throw new TypeError('The official icon API is required');
  const doc = container.ownerDocument, cleanups = [];
  const el = (tag, cls, text) => {const node = doc.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const root = el('section','if-design');root.dataset.theme=theme;
  const style = el('style');style.textContent=designExamplesCSS;root.append(style);
  const title=el('h2','','Design foundations');
  const intro=el('p','if-design-intro','A shared visual language: quiet surfaces, purposeful color, and the right icon. Open a composition to see the real DSL and change its state.');
  root.append(title,intro);
  const roles=[['info','InfoCircle','Information','Helpful context'],['success','CheckCircle','Success','A confirmed outcome'],['warning','TriangleExclamationErrorWarning','Attention','A detail to review'],['error','Warning','Error','A problem with a next step']];
  const roleGrid=el('div','if-design-role-grid');
  const rawRows=[];
  for(const [role,glyph,label,help] of roles){
    const card=el('article','if-design-role');card.dataset.role=role;
    const icon=api.createIcon(doc,api.getIcon(glyph),{size:24});
    const disc=el('span','if-design-disc');disc.append(icon);
    card.append(disc,el('h3','',label),el('p','',help),el('code','',`Icon("${glyph}",null,"${role}",24)`));
    roleGrid.append(card);
  }
  root.append(roleGrid);
  const examplesTitle=el('h3','if-design-section-title','Put it together');root.append(examplesTitle);
  const compositions=el('div','if-design-compositions');
  for(const example of examples){
    const card=el('article','if-design-example');
    card.append(el('span','if-design-kicker',example.layer==='design'?'FOUNDATIONS':'INTERACTIVE COMPOSITION'),el('h3','',example.title),el('p','',example.description));
    const button=el('button','if-design-open','Open live example');button.type='button';
    const click=()=>onOpenExample(example);button.addEventListener('click',click);cleanups.push(()=>button.removeEventListener('click',click));card.append(button);compositions.append(card);
  }
  root.append(compositions);
  const details=el('details','if-design-sources'),summary=el('summary','','Where the colors come from');details.append(summary);
  details.append(el('p','','Primitive values and base semantic mappings are from the public, MIT-licensed OpenAI Apps SDK UI revision 0f00143. Inform UI chooses the combinations, examples, and text-safe substitutions. This is not a complete private ChatGPT design specification.'));
  const swatches=el('div','if-design-swatches');
  for(const role of ['info','success','warning','danger']){const row=el('div','if-design-swatch');const swatch=el('span');swatch.setAttribute('aria-hidden','true');const label=el('span','',role);const value=el('code');row.append(swatch,label,value);swatches.append(row);rawRows.push({role,swatch,value});}
  details.append(swatches,el('p','','Source swatches show original numbers. They are not automatically safe as small text on every background. Light success-soft and dark warning/error text use explicitly documented Inform UI adjustments.'));
  const link=el('a','','Read the pinned public semantic source');link.href='https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/styles/variables-semantic.css';link.target='_blank';link.rel='noopener noreferrer';details.append(link);root.append(details);
  if(onOpenIcons){const iconButton=el('button','if-design-open','Browse all 755 official glyphs');iconButton.type='button';iconButton.addEventListener('click',onOpenIcons);cleanups.push(()=>iconButton.removeEventListener('click',onOpenIcons));root.append(iconButton);}
  container.append(root);
  const setTheme=value=>{if(!['light','dark'].includes(value))throw new TypeError('Unknown theme');root.dataset.theme=value;const v=tokens[value],dark=value==='dark';const vars={bg:v.bg,surface:v['surface-secondary'],text:v.ink,muted:v.muted,line:v.line,focus:v.focus,info:v['info-soft-text'],'info-bg':v['info-soft'],success:dark?v['success-soft-text']:v.success,'success-bg':v['success-soft'],warning:dark?v['series-orange']:v['warning-soft-text'],'warning-bg':v['warning-soft'],error:dark?v['series-red']:v['danger-soft-text'],'error-bg':v['danger-soft']};for(const [name,color]of Object.entries(vars))root.style.setProperty('--d-'+name,color);for(const {role,swatch,value:label}of rawRows){const color=v[role];swatch.style.background=color;label.textContent=color;}};
  setTheme(theme);
  return {element:root,setTheme,dispose(){for(const clean of cleanups)clean();root.remove();}};
}

export const designExamplesCSS=`
.if-design{color:var(--d-text);font:400 14px/1.55 system-ui,sans-serif;display:grid;gap:24px;min-width:0}
.if-design *{box-sizing:border-box;min-width:0}.if-design h2,.if-design h3,.if-design p{margin:0}.if-design h2{font-size:28px;line-height:1.2;letter-spacing:-.035em;font-weight:600}.if-design h3{font-size:16px;line-height:1.35;font-weight:600}.if-design p{color:var(--d-muted)}.if-design-intro{max-width:65ch}.if-design-role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));gap:12px}.if-design-role{display:grid;align-content:start;gap:10px;padding:20px;border:1px solid var(--d-line);border-radius:16px;background:var(--d-bg)}.if-design-disc{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--d-role-bg);color:var(--d-role)}.if-design [data-role=info]{--d-role:var(--d-info);--d-role-bg:var(--d-info-bg)}.if-design [data-role=success]{--d-role:var(--d-success);--d-role-bg:var(--d-success-bg)}.if-design [data-role=warning]{--d-role:var(--d-warning);--d-role-bg:var(--d-warning-bg)}.if-design [data-role=error]{--d-role:var(--d-error);--d-role-bg:var(--d-error-bg)}.if-design code{font:12px/1.55 Consolas,"Source Code Pro",monospace;overflow-wrap:anywhere;color:var(--d-muted)}.if-design-compositions{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:16px}.if-design-example{display:flex;flex-direction:column;gap:12px;padding:24px;border-radius:16px;background:var(--d-surface);border:1px solid var(--d-line)}.if-design-kicker{font-size:10px;font-weight:600;letter-spacing:.1em;color:var(--d-muted)}.if-design .if-design-open{font:500 14px/1.4 system-ui,sans-serif;min-height:44px;padding:10px 16px;border:1px solid var(--d-line);border-radius:999px;background:var(--d-bg);color:var(--d-text);cursor:pointer;align-self:flex-start}.if-design-example .if-design-open{margin-top:auto}.if-design .if-design-open:hover{background:var(--d-surface)}.if-design :focus-visible{outline:2px solid var(--d-focus);outline-offset:3px}.if-design-sources{border-top:1px solid var(--d-line);padding-top:20px}.if-design-sources summary{cursor:pointer;font-weight:500}.if-design-sources p{margin:14px 0;max-width:76ch}.if-design a{color:var(--d-info);text-decoration:underline;text-underline-offset:3px}.if-design-swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.if-design-swatch{display:grid;grid-template-columns:24px 1fr;gap:4px 8px;align-items:center}.if-design-swatch>span:first-child{width:20px;height:20px;border-radius:6px;grid-row:span 2}.if-design-swatch>code{grid-column:2}@media(prefers-reduced-motion:reduce){.if-design *{transition:none!important;animation:none!important}}
`;
