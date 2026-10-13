import {createIcon, type IconDefinition, type IconName, type IconAlias, type IconOptions} from '@micraow/inform-ui/icons';
import Check, {Check as NamedCheck} from '@micraow/inform-ui/icons/Check';
import {getIcon,icons,iconAliases,iconNames,isIconName} from '@micraow/inform-ui/icons/all';
const canonical: IconName = 'Check';
const alias: IconAlias = 'warning';
const definition: IconDefinition = Check;
const same: typeof Check = NamedCheck;
const opts: IconOptions = {size:24,label:'Complete',className:'status-icon'};
const node: SVGSVGElement = createIcon(document,definition,opts);
createIcon(document,getIcon(alias));
createIcon(document,icons[canonical]);
const official: IconName = iconAliases[alias];
const name: IconName | undefined = iconNames[0];
const candidate: string = 'Check';if(isIconName(candidate)){const narrowed: IconName=candidate;void narrowed;}
// @ts-expect-error unknown official names cannot be declared as canonical
const badName: IconName = 'NotAnOfficialIcon';
// @ts-expect-error caller-provided event handlers are outside the safe API
createIcon(document,Check,{onload:()=>{}});
// @ts-expect-error styles are not accepted as arbitrary SVG attributes
createIcon(document,Check,{style:'fill:url(https://invalid)'});
// @ts-expect-error definitions preserve canonical literal names
const wrong: 'ArrowLeft' = Check.name;
void [same,node,official,name,badName,wrong];
