# Official icon catalog

Inform UI vendors all **755** SVG component sources in [OpenAI Apps SDK UI](https://github.com/openai/apps-sdk-ui/tree/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/components/Icon/svg), pinned to commit `0f00143c7a639906f1621fe58e1b6be7b5bea46d`. These are static, native SVG definitions, with no React dependency. The glyph catalog is separate from the DSL component registry; 755 icons do not mean 755 UI components.

The public entry points below are available from a built repository/package. This documentation does not imply that a new npm release has been published.

## Use a glyph in DSL

```text
root = Stack([
  Icon("Check", "Complete", "success", 24)
])
```

Use the exact canonical name or a documented alias from the catalog. The label can be `null` for decorative icons. See [design foundations](v2/design-foundations.md) for tones, sizes and composition. The native SVG APIs below are host utilities; they do not introduce a separate interface authoring format.

## Small, per-icon imports

```ts
import { createIcon } from '@micraow/inform-ui/icons';
import Check from '@micraow/inform-ui/icons/Check';

const svg = createIcon(document, Check, {
  size: 20,
  label: 'Complete',
  className: 'status-icon',
});
container.append(svg);
```

Every single-icon module exports both its exact canonical name and a default export. `import { Check } from '@micraow/inform-ui/icons/Check'` is equivalent. The lightweight `icons` entry exports `createIcon` and types, with no full registry. A single-icon import does not load the other 754 definitions. There are no dynamic imports, remote URLs, icon fonts, image services or React runtime imports.

`createIcon(document, definition, options?)` returns an `SVGSVGElement` owned by the supplied document. Options are deliberately limited:

- `size`: a positive finite number (SVG pixels), or a positive numeric `px`, `em`, `rem` or `%` length. Default `1em`; numeric part must be at most 4096. Both width and height use the same value.
- `label`: nonempty plain text. Adds `role="img"` and `aria-label`. Omit it for a decorative `aria-hidden="true"` icon, including an icon inside an already-labelled button.
- `className`: additional CSS classes, alongside `iui-official-icon` and any pinned upstream classes.

Icons are always `focusable="false"` and do not add a tab stop. Size overrides preserve the original viewBox, including non-square originals; they do not rewrite coordinates. Original physical left/right glyphs do not auto-mirror in RTL. Choose navigation direction at the control level. Most glyphs inherit `currentColor`; original colored fills and the `var(--green-500)` fill are preserved. Set that existing color token in the host theme when using its icon.

```ts
const button = document.createElement('button');
button.setAttribute('aria-label', 'Complete task');
button.append(createIcon(document, Check)); // Decorative because the button is labelled.
```

## Explicit full registry

Use the larger `all` entry only when runtime lookup across the whole catalog is wanted, for example in a searchable icon picker.

```ts
import { createIcon } from '@micraow/inform-ui/icons';
import { getIcon, iconNames, isIconName } from '@micraow/inform-ui/icons/all';

container.append(createIcon(document, getIcon('ChevronRight')));
container.append(createIcon(document, getIcon('warning'), { label: 'Warning' }));
console.log(iconNames.length); // 755
console.log(isIconName('Check')); // true
console.log(isIconName('check')); // false: check is an alias, not a canonical name.
getIcon('MissingIcon'); // Throws TypeError. No substitution or network request.
```

`all` exports:

- `icons`: read-only registry keyed by the 755 exact canonical names
- `iconNames`: read-only array of those names
- `iconAliases`: read-only mapping from 71 Inform UI semantic aliases to canonical names
- `getIcon(name: string)`: resolves an exact canonical name or documented alias, otherwise throws
- `isIconName(name: string)`: tests canonical names only, with a TypeScript type guard

The lightweight `icons` entry exports types `IconName`, `IconAlias`, `IconCategory`, `IconDefinition`, `IconShape`, `IconShapeTag`, `IconAttributes`, `IconAttribute` and `IconOptions`. Types do not bring the registry into a runtime bundle.

## Machine-readable selection

Read [`src/icons/catalog.json`](../src/icons/catalog.json), also exported as `@micraow/inform-ui/icons/catalog.json`, before selecting a glyph. In a JSON-import-capable ESM host:

```ts
import catalog from '@micraow/inform-ui/icons/catalog.json' with { type: 'json' };
const matches = catalog.icons.filter(icon =>
  icon.category === 'time-planning' || icon.keywords.includes('calendar')
);
```

The catalog contains:

- `schemaVersion`, `repository`, `commit`, `license` and `iconCount`
- `categories`: Inform UI browsing groups with `id`, `label` and `count`
- `aliases`: `{ alias, name, purpose }` records describing each semantic alias
- `icons`: `{ name, category, aliases, keywords, viewBox, importSubpath, source }`
- `source`: pinned upstream `path`, `url`, `gitBlobSha` and `sha256`

Categories and semantic aliases are Inform UI metadata, not official upstream names or classifications. Keywords are search hints split from canonical names, not claims about an icon's suitability. Canonical names are case-sensitive and preserve upstream spelling, including `Astronout`, `Inkedin` and `FileSpreedsheet`. A missing name is an error; do not guess a near-match, synthesize an icon, fetch a URL or claim that a substitute is official.

For agents: first search the JSON by purpose, aliases or keywords; inspect the candidate glyph in the icon catalog when appearance matters; then use its exact `importSubpath` for a lean component. Prefer a documented alias only when its stated purpose matches. Logos and brand glyphs remain catalog entries; their presence does not authorize replacing another product's logo or imply brand endorsement. Data charts, custom illustrations and learning item numbers are not general-purpose UI icons.

## Source fidelity and security

[`manifest.json`](../src/icons/manifest.json) tracks every original source's path, byte count, Git blob SHA-1 and SHA-256. Exact original bytes are preserved as inert `src/icons/upstream/*.tsx.txt`; they are not compiled or executed. The pinned MIT [`LICENSE`](../src/icons/LICENSE) is Copyright 2025 OpenAI, with Git blob `b8ac8dc0f960bbe0b0cc90cd06d58b672151773f`. Each adapted definition contains the complete legal notice, retained once in a normal bundled output.

The generator parses the original TSX with TypeScript's AST. It accepts only the static wrapper, type-only React import, literal attributes, numeric literals, one root `{...props}` marker and finite SVG children. It removes the React wrapper and that marker without evaluating any original code. Changing upstream requires deliberate manifest and parser review, not silently dropping unrecognized SVG features.

The pinned set contains 730 `0 0 24 24` viewBoxes and 25 other viewBoxes, 1,206 paths, 7 rectangles, 2 circles, 6 groups and 5 local clipping definitions. All are preserved. Each instantiated clip ID and its local reference are rewritten together to avoid collisions between repeated instances. Hierarchy, fill/stroke rules, original classes, opacity, transforms and colored fills are retained. No mask, gradient or active SVG element occurs in this pinned set.

Build and runtime share an attribute/tag allowlist. Script, style, event handlers, HTML, images, external references, unknown SVG tags, arbitrary CSS paints and unbound clip references are rejected. Root options cannot inject extra SVG attributes. DOM construction uses `createElementNS` and `setAttribute`, with no `innerHTML`. Labels are plain text. Exported definitions are read-only TypeScript data; do not mutate them.

## Verified bundle sizes

Measured with esbuild 0.25.10, ES2022 ESM, minification, MIT notice retained at EOF, and Node's default gzip level. Raw means the uncompressed minified bundle. Sizes exclude source snapshots and catalog JSON.

| Import | Raw bytes | Gzip bytes | Icon definitions |
| --- | ---: | ---: | ---: |
| `createIcon` API only | 5,115 | 2,177 | 0 |
| `Check` definition only | 1,467 | 958 | 1 |
| `createIcon` + `Check` | 6,573 | 3,106 | 1 |
| Full registry | 1,021,148 | 323,988 | 755 |
| Full registry + `createIcon` | 1,026,319 | 326,238 | 755 |

The machine catalog is 489,426 raw / 75,894 gzip bytes. Exact upstream source snapshots total 1,104,678 bytes; adapted TypeScript modules total 2,020,658 bytes, including the MIT notice in each source module. These source-storage totals are not network bundle sizes. See [`bundle-sizes.json`](../src/icons/bundle-sizes.json) for the measured configuration and results.

Reproduce generation, verification and size measurement:

```sh
node scripts/build-icon-catalog.mjs
node scripts/build-icon-catalog.mjs --check
node scripts/build-icon-catalog.mjs --check --measure
node --test tests/icons-catalog.test.mjs
```

Tests render all 755 in JSDOM and compare every tree, attribute and coordinate to an independent XML conversion of the pinned source. They verify source and license hashes, generated-directory counts, alias targets, rejection of unsafe content, zero network requests for names, accessibility, clip isolation and per-icon bundle inputs. TypeScript consumer tests cover the built public subpaths. JSDOM equivalence is not browser pixel-diff certification.

## Full canonical list

The following list contains all 755 exact names, grouped by Inform UI browsing category. The JSON catalog is the machine source of truth.

### Arrows and navigation (67)

`ArrowBottomLeftSm`, `ArrowBottomRightSm`, `ArrowCurved`, `ArrowCurvedLeft`, `ArrowCurvedRight`, `ArrowCurvedRightXs`, `ArrowCurvedRightXs24px`, `ArrowDown`, `ArrowDownLg`, `ArrowDownSm`, `ArrowLeft`, `ArrowLeftLg`, `ArrowLeftSm`, `ArrowRight`, `ArrowRightLg`, `ArrowRightSm`, `ArrowRotateCcw`, `ArrowRotateCw`, `ArrowTopLeftSm`, `ArrowTopRightSm`, `ArrowUp`, `ArrowUpLg`, `ArrowUpRight`, `ArrowUpSm`, `BackLarge`, `BackSmall`, `BackToApp`, `CaretDown`, `CaretLeft`, `CaretRight`, `CaretUp`, `ChevronDown`, `ChevronDownLg`, `ChevronDownMd`, `ChevronDownUp`, `ChevronDownVector`, `ChevronLeft`, `ChevronLeftLg`, `ChevronLeftMd`, `ChevronRight`, `ChevronRightAlt`, `ChevronRightLg`, `ChevronRightMd`, `ChevronSmallDown`, `ChevronSmallLeft`, `ChevronSmallRight`, `ChevronSmallUp`, `ChevronUp`, `ChevronUpDown`, `ChevronUpLg`, `ChevronUpMd`, `DoubleChevronLeft`, `DoubleChevronRight`, `EnterLogin`, `ExitLogout`, `ExternalLink`, `Forward`, `Go`, `GoFilled`, `Home`, `HomeAlt`, `MinimizeDown`, `MinimizeLeft`, `MinimizeRight`, `MinimizeTop`, `OpenLeft`, `OpenRight`

### Actions and editing (114)

`AddMember`, `AddSources`, `AutoPairApps`, `AutoSuggestedEdits`, `Autocomplete`, `Cleanup`, `Clear`, `Click`, `Clip`, `Clipboard`, `ClipboardCopy`, `CloseBold`, `ComposeCanvasEditStar`, `ComposeDashedTemporary`, `ComposeEditSquare`, `Connect`, `ConnectApps`, `ConnectedDynamicGpt`, `ConnectorsConnectedApps`, `Copy`, `Cursor`, `Customize`, `Delete`, `DeleteAccount`, `Download`, `DownloadCircle`, `DownloadSimple`, `Edit`, `EditAlt`, `EditDalleImage`, `EditPencil`, `EditStar`, `EditXs`, `Filter`, `GenerateSuggestedEdits`, `Link`, `LinkDisabledBold`, `LinkExternalWebsite`, `MagnifyingGlassSearch`, `MagnifyingGlassSmSearch`, `Minus`, `MinusCircle`, `MinusCircleFilled`, `Pencil`, `PencilSparkle`, `PencilSquare`, `Pens`, `Pin`, `PinFilled`, `Plus`, `Plus14px`, `PlusCircle`, `PlusCircleAdd`, `PlusCircleFilled`, `PlusComposer`, `PlusFilled`, `PlusLg`, `PlusLg18pxAdd`, `PlusSm12px`, `PlusSquareAdd`, `Regenerate`, `RegenerateOff`, `RegenerateStar`, `Reload`, `RemoveForeverPermanently`, `RemoveRedEye`, `Resend`, `ResetChat`, `RestoreUntrash`, `SavedFilledXs`, `SavedXs`, `Search`, `SearchConnector`, `SearchFeed`, `SearchXs`, `SelectText`, `Settings`, `SettingsCircle`, `SettingsCog`, `SettingsSlider`, `SettingsWrench`, `Share`, `ShareScreen`, `ShareScreenFilled`, `ShareScreenOff`, `ShareScreenOffFilled`, `Shortcuts`, `Sparkle`, `SparkleDouble`, `SparkleFilledPlus`, `SparklePlus`, `Sparkles`, `SparklesFilled`, `SuggestEdit`, `Tap`, `Text`, `TextLonger`, `TextPrompt`, `TextShorter`, `TextShorterConcise`, `Tools`, `ToolsSkills`, `Trash`, `TrashRemove`, `Undo`, `Unlink`, `Unpin`, `WriteAlt`, `WriteAlt2`, `Writing`, `X`, `XCrossed`, `XXs`, `XXsCrossed`

### Status and feedback (51)

`Check`, `CheckCircle`, `CheckCircleDashed`, `CheckCircleFilled`, `CheckLg`, `CheckMd`, `CircleQuestion`, `Complete`, `Confetti`, `ConfettiParty`, `Error`, `ExclamationMarkCircle`, `FeaturedWreath`, `Heart`, `HeartFilled`, `HeartFilledXs`, `HeartXs`, `Help`, `Info`, `InfoCircle`, `Lifesaver`, `Love`, `Question`, `QuestionMark`, `QuestionMarkCircle`, `SimpleRelax`, `SimpleSad`, `SimpleSmile`, `Star`, `StarFilled`, `StartStrokeMd`, `Status`, `ThumbDown`, `ThumbDownFilled`, `ThumbMixed`, `ThumbUp`, `ThumbUpFilled`, `Thumbs`, `TriangleExclamationErrorWarning`, `TriangleExclamationFilledErrorWarning`, `TrophyTop`, `Warning`, `WarningFilledWrapCenteredForCircle`, `WarningWrapCenteredForCircle`, `Wreath`, `XCircle`, `XCircleCrossedClose`, `XCircleFilled`, `XCircleFilledCrossedClose`, `XSquareCrossed`, `XSquareFilledCrossed`

### Files and folders (34)

`Archive`, `Cabinet`, `Document`, `Documentation`, `File`, `File3d`, `FileAudio`, `FileBlank`, `FileCode`, `FileDocument`, `FileImage`, `FilePresentation`, `FileSpreadsheet`, `FileSpreedsheet`, `FileUpload`, `FileVideo`, `FileZip`, `Folder`, `FolderDocumentsFinder`, `FolderOpen`, `FolderPlus`, `FolderPlusAdd`, `FolderShared`, `FolderSharedOpen`, `FolderStuffed`, `FolderUnshare`, `Folders`, `PageBlank`, `Paperclip`, `PaperclipAttach`, `PastedText`, `Storage`, `Unarchive`, `UploadDocuments`

### Communication (26)

`AtSign`, `Bell`, `BellFilled`, `Chat`, `ChatCompose`, `ChatDashedCheckedTemp`, `ChatDashedTemp`, `ChatTemporary`, `ChatTripleDots`, `Chats`, `Comment`, `Email`, `Followup`, `Forum`, `Mail`, `Messaging`, `NotificationBell`, `NotificationOffBell`, `Phone`, `PhoneMissed`, `PhoneRing`, `PhoneWaves`, `Quote`, `QuoteReplyFilledQuoteXs`, `Reply`, `ShareChat`

### People and access (34)

`ApiKey`, `ApiKeyAdmin`, `ApiKeyServiceAccount`, `ApiKeys`, `AvatarFilledProfile`, `AvatarProfile`, `Group`, `GroupFilled`, `Groups`, `Identity`, `IdentityMeSecure`, `Key`, `Keyboard`, `KeyboardShortcut`, `Lock`, `LockKeyHole`, `Logout`, `Members`, `MembersFilled`, `MyGptProfileMe`, `NoTraining`, `ParentControl`, `PrivacyIntern`, `ShieldCheck`, `ShieldKey`, `ShieldLock`, `ShieldPerson`, `User`, `UserAdd`, `UserGpts`, `UserHeart`, `UserLock`, `UserVoice`, `Users`

### Media, audio and video (118)

`AspectRatio11`, `AspectRatio169`, `AspectRatio34`, `AspectRatio43`, `AspectRatio916`, `Back10s`, `Back15s`, `Blend`, `BlendingCurveSharp`, `BlendingCurveSmooth`, `BlendingCurveSubtle`, `Camera`, `CameraFilledPhoto`, `CameraPhoto`, `CaptionCcOff`, `CaptionCcOn`, `CaptionOff`, `CaptionOn`, `ClappingBoardClosed`, `ClappingBoardOpen`, `DownloadGifWatermark`, `DownloadVideo`, `DownloadVideoWatermark`, `Forward10s`, `Forward15s`, `Headphones`, `ImageCaption`, `ImageSquare`, `ImageSquarePictureLibrary`, `ImageToText`, `ImageWide`, `ImageWideFilled`, `ImageWidePictureLibrary`, `Images`, `Inpaint`, `InpaintRespond`, `Loop`, `LoopLong`, `LoopNormal`, `LoopShort`, `LoopXs`, `Mic`, `MicFilled`, `MicFilledOff`, `MicLgDictate`, `MicOff`, `Music`, `Pause`, `PauseCircle`, `PauseCircleFilled`, `PauseOutline`, `PauseSm`, `PictureInPicture`, `Play`, `PlayCircle`, `PlayCircleFilled`, `PlayOutline`, `PlaySm`, `PlayTriangle`, `Playground`, `Record`, `RemixMild`, `RemixMildXs`, `RemixStrong`, `RemixSubtle`, `Resolution1080p`, `Resolution360p`, `Resolution480p`, `Resolution720p`, `Rewind`, `Scissor`, `ScissorXs`, `ScreenPosition`, `Shuffle`, `Skip`, `SoundOffSimpleMute`, `SoundOffSpeaker`, `SoundOnReadOutLoudSpeaker`, `Speak`, `SpeechToText`, `Stop`, `StopCircle`, `StopCircleFilled`, `StopOutline`, `StopSm`, `StopStrokeMd`, `Stopwatch`, `Storyboard`, `TextToSpeech`, `ThumbnailLarge`, `ThumbnailMedium`, `ThumbnailSmall`, `Upscale`, `UpscaleXs`, `Variation2v2`, `VariationV21`, `VariationV31`, `VariationV32`, `VariationV33`, `VariationV41`, `VariationV42`, `VariationV43`, `VariationV44`, `Video`, `VideoCaption`, `VideoFilled`, `VideoFilledOff`, `VideoGrid`, `VideoList`, `VideoToText`, `Videos`, `Voice`, `Voice4Bars`, `Voice5BarsSoundwave`, `VoiceBold`, `VoiceInputAreaMobileFilledVoiceXs`, `VoiceLight`, `WhisperAutoSubmit`

### Layout and interface (66)

`Category`, `Circle`, `CircleDashed`, `Collapse`, `CollapseLarge`, `CollapseLeft`, `CollapseLg`, `CollapseRight`, `CollapseSm`, `CollapseSmall`, `Compare`, `CompareArrows`, `Desktop`, `Dock`, `Dot`, `DotsHorizontal`, `DotsHorizontalCircle`, `DotsHorizontalMoreMenu`, `DotsVertical`, `DotsVerticalCircle`, `DotsVerticalMoreMenu`, `EmptyCircle`, `EmptyCircleFilled`, `Expand`, `ExpandLarge`, `ExpandLg`, `ExpandMd`, `ExpandSm`, `ExpandSmall`, `Grid`, `GridAlt`, `Hamburger`, `Menu`, `MenuInverted`, `MenuSidebar`, `Menubar`, `Mobile`, `PinWindow`, `PopOutWindow`, `RadioSelected`, `Sidebar`, `SidebarCollapseLeft`, `SidebarCollapseRight`, `SidebarFloatingLeft`, `SidebarFloatingOpenLeft`, `SidebarFloatingOpenRight`, `SidebarFloatingRight`, `SidebarLeft`, `SidebarMenuMobile`, `SidebarMenuMobileBadgeCutout`, `SidebarOpenLeft`, `SidebarOpenLeftAlt`, `SidebarOpenRight`, `SidebarOpenRightAlt`, `SidebarRight`, `SquareCheckCheckboxChecked`, `SquareCheckFilledCheckboxCheckedFilled`, `SquareCheckboxUnchecked`, `SquareFilledTableLegend`, `SquareImage`, `SquarePlus`, `SquarePlusAlt`, `SquareTableLegend`, `SquareText`, `Widget`, `WidgetAdd`

### Data and code (47)

`Analytics`, `AnalyzeData`, `Array`, `BarChart`, `BarChartFilled`, `Batch`, `Batches`, `Boolean`, `Branch`, `BranchAlt`, `Bug`, `Chart`, `ChartXAxis`, `ChartYAxis`, `Code`, `CodeSquareSlash`, `Commit`, `DataControls`, `Enum`, `FineTuning`, `Function`, `Functions`, `Latency`, `MarkerCode`, `MarkerData`, `MarkerMultiple`, `MarkerQuote`, `Nodes`, `Number`, `ObjectIcon`, `PullRequestClosed`, `PullRequestDraft`, `PullRequestMerged`, `PullRequestOpen`, `Speed`, `SpeedometerLatencySpeed`, `SquareCode`, `String`, `TableCellFilled`, `TableCellsFilled`, `TableColumnFilled`, `TableFilled`, `TableRowFilled`, `Terminal`, `TerminalLg`, `Trending`, `Usage`

### Time and planning (16)

`Calendar`, `CalendarAlt`, `CalendarToday`, `Clock`, `Clock10s`, `Clock15s`, `Clock20s`, `Clock5s`, `ClockOff`, `History`, `HistoryOff`, `HistoryOn`, `ManageHistory`, `Sleep`, `Tasks`, `Timer`

### Places and travel (15)

`Compass`, `DiningEvents`, `EarthTravelWorld`, `Globe`, `GlobeAltRealTimeSearch`, `GlobeFilled`, `GlobeOffRealTimeSearch`, `GlobeRealTimeSearch`, `GlobeSpin`, `LocalServices`, `MapPin`, `Maps`, `MapsAddress`, `MapsDirections`, `Plane`

### Commerce and work (24)

`BalancingScale`, `Bills`, `BuildingWorkspace`, `Business`, `BusinessFilled`, `Card`, `CreditCard`, `Credits`, `DollarCircle`, `Invoice`, `Order`, `Paid`, `ProDiamond`, `ProFilledDiamond`, `ProductTag`, `Scales`, `ShoppingBag`, `SubscriptionPlan`, `Suitcase`, `SuitcaseFilledWorkBusiness`, `SuitcaseWorkBusiness`, `Upgrade`, `UpgradePlan`, `Workspace`

### Learning and health (29)

`Atom`, `Book`, `BookBookmark`, `BookClock`, `BookClosed`, `BookOpen`, `BookWrench`, `Brain`, `Certificate`, `Dumbbell`, `Education`, `Flask`, `FlaskFilled`, `Graduate`, `GraduationCap`, `Health`, `Kettlebell`, `Lab`, `Language`, `Notebook`, `NotebookCheck`, `NotebookNarrow`, `NotebookPencil`, `Notepad`, `Pulse`, `ReadingLevel`, `Spelling`, `Stethoscope`, `Translate`

### Appearance and nature (23)

`Astronout`, `ColorTheme`, `DarkMode`, `FistBump`, `Frozen`, `HandBack`, `HandFront`, `HandPeace`, `HandRaised`, `HandRaisedHey`, `HandWavingBye`, `LightMode`, `Lotus`, `Moon`, `MoonSunSystem`, `Paw`, `PlantDesk`, `Snorkle`, `Snowflake`, `Sun`, `SystemMode`, `TBoneRaw`, `Whisk`

### Brands and products (19)

`ExploreSora`, `Inkedin`, `Instagram`, `Jira`, `Linear`, `Mcp`, `OpenaiLogoBold`, `OpenaiLogoBoldBoundingBox`, `OpenaiLogoRegular`, `OpenaiLogoRegularBoundingBox`, `OpenaiLogoWebappVariable480`, `Snapchat`, `SoraBasicPopcorn`, `SoraProDirector`, `Tiktok`, `Wechat`, `Whatsapp`, `Youtube`, `Zendesk`

### General and miscellaneous (72)

`Agent`, `AgentMode`, `AllGizmos`, `AllProductsExplore`, `Assistant`, `BackgroundConversation`, `Beta`, `Bolt`, `BuilderProfileCard`, `Cube`, `DeepSearchTelescope`, `DisabledCursor`, `Dropdown`, `DropdownVector`, `EmojiAdd`, `EmojiLists`, `EmojiRemove`, `EmojiSections`, `EmojiWords`, `Equal`, `Explore`, `Eye`, `EyeClosed`, `EyeOff`, `Flag`, `Flash`, `Glasses`, `HapticFeedback`, `Inspiration`, `InspirationFilled`, `Interactiv`, `InternalKnowledge`, `InternalKnowledgeOptimizedForCircle`, `Io`, `JumpToCaption`, `Lightbulb`, `Lightbulb20`, `Lightbulb22`, `Lightbulb22Filled`, `LightbulbGlow`, `MemoryFilledSm`, `MemoryOffRemember`, `MemoryOnRemember`, `MemoryWriteSm`, `MoreCircleMenuDots`, `Name`, `NewsPaper`, `On`, `Operator`, `Plugin`, `PluginPuzzle`, `PresetDefault`, `PresetSelected`, `QuickStart`, `Report`, `Robot`, `RobotHead`, `RobotHeadSad`, `Spin`, `Stack`, `StickyNote`, `Studio`, `Stuff`, `StuffTools`, `Tag`, `Telescope`, `Terms`, `TuningFork`, `VersionsV1`, `Wave`, `WebsiteNetwork`, `WorkWithApps`
