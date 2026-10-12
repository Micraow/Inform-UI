// Isolated source registration fixture; maintained definitions remain in the installers.
import {SCHEMA_MODULES} from '../scripts/schema-source/catalog.mjs';
import {install as install0} from '../scripts/schema-source/modules/flight-discovery.mjs';
import {install as install1} from '../scripts/schema-source/modules/activity-planning.mjs';
import {install as install2} from '../scripts/schema-source/modules/vocabulary-tools.mjs';
import {install as install3} from '../scripts/schema-source/modules/source-citations.mjs';
import {install as install4} from '../scripts/schema-source/modules/entity-facts.mjs';
import {install as install5} from '../scripts/schema-source/modules/discussion-thread.mjs';
import {install as install6} from '../scripts/schema-source/modules/local-converters.mjs';
import {install as install7} from '../scripts/schema-source/modules/weather-sidebar.mjs';
export const SUPPLIED_SOURCE_MODULES = [
  {...{"id":"travel/discovery","category":"travel","title":"Flight discovery","dependsOn":["travel/snapshots","decisions/supplied"],"contractPath":"docs/flight-discovery.md","semanticContractPaths":["docs/flight-discovery.md"],"examplePaths":["examples/schema-modules/flight-discovery.json"],"sourcePath":"scripts/schema-source/modules/flight-discovery.mjs","provides":["DiscoveryAirport","FlightSearchFormNode","DiscoveryFlightResult","FlightResultsNode"],"nodeTypes":["flight-search-form","flight-results"]},install:install0},
  {...{"id":"activities/supplied","category":"activities","title":"Activity planning","dependsOn":["travel/snapshots"],"contractPath":"docs/activity-planning.md","semanticContractPaths":["docs/activity-planning.md"],"examplePaths":["examples/schema-modules/activity-planning.json"],"sourcePath":"scripts/schema-source/modules/activity-planning.mjs","provides":["ActivityParticipant","ActivityAvailability","ActivityOption","SharedActivityPlannerNode","EventAgendaEntry","EventSidebarNode"],"nodeTypes":["shared-activity-planner","event-sidebar"]},install:install1},
  {...{"id":"vocabulary/supplied","category":"vocabulary","title":"Vocabulary tools","dependsOn":["travel/snapshots"],"contractPath":"docs/vocabulary-tools.md","semanticContractPaths":["docs/vocabulary-tools.md"],"examplePaths":["examples/schema-modules/vocabulary-tools.json"],"sourcePath":"scripts/schema-source/modules/vocabulary-tools.mjs","provides":["WordExample","WordCardNode","CopyWord","CopyWordsNode"],"nodeTypes":["word-card","copy-words"]},install:install2},
  {...{"id":"citations/supplied","category":"citations","title":"Source citations","dependsOn":["travel/snapshots"],"contractPath":"docs/source-citations.md","semanticContractPaths":["docs/source-citations.md"],"examplePaths":["examples/schema-modules/source-citations.json"],"sourcePath":"scripts/schema-source/modules/source-citations.mjs","provides":["CodeCiteNode","CitedFilePage","FileCiteNode"],"nodeTypes":["code-cite","file-cite"]},install:install3},
  {...{"id":"entities/facts","category":"entities","title":"Entity facts","dependsOn":["travel/snapshots"],"contractPath":"docs/entity-facts.md","semanticContractPaths":["docs/entity-facts.md"],"examplePaths":["examples/schema-modules/entity-facts.json"],"sourcePath":"scripts/schema-source/modules/entity-facts.mjs","provides":["SidebarFact","SidebarFactTableNode","EntityThumbnailField","EntityThumbnailRecord","EntityThumbnailListNode"],"nodeTypes":["sidebar-fact-table","entity-thumbnail-list"]},install:install4},
  {...{"id":"readers/discussion","category":"readers","title":"Discussion thread","dependsOn":["shared/value"],"contractPath":"docs/reddit-thread-card.md","semanticContractPaths":["docs/reddit-thread-card.md"],"examplePaths":["examples/schema-modules/discussion-thread.json"],"sourcePath":"scripts/schema-source/modules/discussion-thread.mjs","provides":["ThreadComment","RedditThreadCardNode"],"nodeTypes":["reddit-thread-card"]},install:install5},
  {...{"id":"converters/local","category":"converters","title":"Local converters","dependsOn":["shared/value","shared/finance-source"],"contractPath":"docs/converters.md","semanticContractPaths":["docs/converters.md"],"examplePaths":["examples/schema-modules/local-converters.json"],"sourcePath":"scripts/schema-source/modules/local-converters.mjs","provides":["UnitConverterNode","CurrencyConverterNode"],"nodeTypes":["unit-converter","currency-converter"]},install:install6},
  {...{"id":"weather/sidebar","category":"weather","title":"Weather sidebar","dependsOn":["travel/snapshots"],"contractPath":"docs/weather-sidebar.md","semanticContractPaths":["docs/weather-sidebar.md"],"examplePaths":["examples/schema-modules/weather-sidebar.json"],"sourcePath":"scripts/schema-source/modules/weather-sidebar.mjs","provides":["WeatherSidebarPlace","WeatherSidebarTitleNode"],"nodeTypes":["weather-sidebar-title"]},install:install7}
];
export const TEST_MODULES = [...SCHEMA_MODULES, ...SUPPLIED_SOURCE_MODULES.filter(m => !SCHEMA_MODULES.some(existing => existing.id === m.id))];
export const LEGACY_BLOCKS = [
  {
    "id": "travel/discovery",
    "start": "// Original local flight search intent and supplied result exploration.",
    "end": "// Original supplied activity preference matrix and event agenda sidebar."
  },
  {
    "id": "activities/supplied",
    "start": "// Original supplied activity preference matrix and event agenda sidebar.",
    "end": "// Original supplied vocabulary and explicit local clipboard workflow."
  },
  {
    "id": "vocabulary/supplied",
    "start": "// Original supplied vocabulary and explicit local clipboard workflow.",
    "end": "// Original supplied code-line and document-page citation readers."
  },
  {
    "id": "citations/supplied",
    "start": "// Original supplied code-line and document-page citation readers.",
    "end": "// Original supplied attributed facts and local entity-thumbnail detail selection."
  },
  {
    "id": "entities/facts",
    "start": "// Original supplied attributed facts and local entity-thumbnail detail selection.",
    "end": "// Original bounded reader for supplied discussion content; no provider integration."
  },
  {
    "id": "readers/discussion",
    "start": "// Original bounded reader for supplied discussion content; no provider integration.",
    "end": "registry.use('foundations/content');"
  },
  {
    "id": "converters/local",
    "start": "// Local conversion controls use factual unit definitions and caller-supplied exchange snapshots.",
    "end": "node('svg',"
  },
  {
    "id": "weather/sidebar",
    "start": "defs.WeatherSidebarPlace=object({id:suppliedKey,label:short,timezone:short,observedAt:{anyOf:[flightAt,{type:'null'}]},temperature:{anyOf:[{type:'number',minimum:-1000000,maximum:1000000},{type:'null'}]},unit:choice('celsius','fahrenheit'),condition:{anyOf:[condition,{type:'null'}]},source:ref('TravelEventSource')},['id','label','timezone','observedAt','temperature','unit','condition']);",
    "end": "registry.use('finance/ledger-correction');"
  }
];
