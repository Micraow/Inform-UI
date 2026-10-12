// Test-only candidate registrations for source modules before central integration.
import {install as learningMedia} from '../../scripts/schema-source/modules/learning-media.mjs';
import {install as pressable} from '../../scripts/schema-source/modules/pressable.mjs';
import {install as htmlView} from '../../scripts/schema-source/modules/html-view.mjs';
import {install as asyncImages} from '../../scripts/schema-source/modules/async-images.mjs';
import {install as asyncVideo} from '../../scripts/schema-source/modules/async-video.mjs';
import {install as tabbedSection} from '../../scripts/schema-source/modules/tabbed-section.mjs';
import {install as visualCards} from '../../scripts/schema-source/modules/visual-cards.mjs';
import {install as linkCards} from '../../scripts/schema-source/modules/link-cards.mjs';
import {install as imageGrid} from '../../scripts/schema-source/modules/image-grid.mjs';
const module=(id,install,provides,nodeTypes,dependsOn)=>({id,install,provides,nodeTypes,dependsOn});
export const mediaCollectionModules=[
  module('learning/practice-media',learningMedia,['LearningAudioLabelCardNode','LearningImageChoiceCardNode','LearningImageLabelCardNode','LearningImageOption','LearningPracticeAudio','LearningPracticeImage'],['learning-audio-label-card','learning-image-choice-card','learning-image-label-card'],['shared/value']),
  module('foundations/pressable',pressable,['PressableNode'],['pressable'],['foundations/text']),
  module('content/html-view',htmlView,['HtmlViewNode'],['html-view'],['shared/value']),
  module('media/async-images',asyncImages,['AsyncImageGroupNode','AsyncImageNode'],['async-image','async-image-group'],['media/readers']),
  module('content/tabbed-section',tabbedSection,['SuppliedSectionTab','TabbedSectionNode'],['tabbed-section'],['shared/value']),
  module('content/visual-cards',visualCards,['VisualEntityRequest','VisualCardItem','VisualCardCarouselNode'],['visual-card-carousel'],['media/readers']),
  module('content/link-cards',linkCards,['LinkCardNode','RecommendationLinkCardNode'],['link-card','recommendation-link-card'],['shared/value']),
  module('media/image-grid',imageGrid,['ImageGridItem','ImageGridTile','ImageGridRow','ImageGridPlaceholderTile','ImageGridPlaceholderRow','ImageGridRecommendation','ImageGridNode'],['image-grid'],['shared/value']),
  module('media/async-video',asyncVideo,['AsyncVideoCarouselNode','AsyncVideoItem'],['async-video-carousel'],['shared/value'])
];
