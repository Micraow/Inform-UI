# View migration coverage

This package provides contracts only. Runtime and decomposition coverage must be filled from integration evidence. An old dispatcher case is not a migrated renderer.

| Old type | New DSL target | Kind | Old renderer source | New adapter verified | Public bases composed | Required public bases |
|---|---|---|---|---|---|---|
| text | Text | base | yes | no | no | Text |
| title | Heading | base | yes | no | no | Heading |
| caption | Text | base | yes | no | no | Text |
| agenda | AgendaView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| person-profile | PersonProfileView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| news-article | NewsArticleView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| entity-reviews | EntityReviewsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| restaurant-availability | RestaurantAvailabilityView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| onboarding-selection | OnboardingSelectionView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| create-interactive-poll | CreateInteractivePollView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| location-choice-request | LocationChoiceRequestView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| business-gallery | BusinessGalleryView | view | yes | no | no | Card, Image, Text, Row, Button |
| flight-option | FlightOptionView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| artist-upcoming-events | ArtistUpcomingEventsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| package-tracker | PackageTrackerView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| flight-tracker | FlightTrackerView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| sidebar-people-also-ask | SidebarPeopleAlsoAskView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| email-preview | EmailPreviewView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| file-nav-list | FileNavListView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| jobs | JobsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| product-card | ProductCardView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| local-business | LocalBusinessView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| restaurant-reviews | RestaurantReviewsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| flight-search-form | FlightSearchFormView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| flight-results | FlightResultsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| shared-activity-planner | SharedActivityPlannerView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| event-sidebar | EventSidebarView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| word-card | WordCardView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| copy-words | CopyWordsView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| code-cite | CodeCiteView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| file-cite | FileCiteView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| sidebar-fact-table | SidebarFactTableView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| entity-thumbnail-list | EntityThumbnailListView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| reddit-thread-card | RedditThreadCardView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| markdown | MarkdownView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| writing-block | WritingBlockView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| email-draft | EmailDraftView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| task-expansion-card | TaskExpansionCardView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| code | CodeView | base | yes | no | no | Code |
| math | MathView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| badge | Badge | base | yes | no | no | Badge |
| divider | Divider | base | yes | no | no | Divider |
| spacer | SpacerView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| link | LinkView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| favicon | FaviconView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| image | Image | base | yes | no | no | Image |
| box | Stack | base | yes | no | no | Stack |
| card | Card | base | yes | no | no | Card |
| row | Row | base | yes | no | no | Row |
| col | Stack | base | yes | no | no | Stack |
| grid | Grid | base | yes | no | no | Grid |
| grid-item | GridItemView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| blockquote | BlockquoteView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| section | SectionView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| figure | FigureView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| details | DetailsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| tooltip | TooltipView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| popover | PopoverView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| flow | Row | base | yes | no | no | Row |
| icon | Icon | base | yes | no | no | Icon |
| pulse-indicator | PulseIndicatorView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| loading | LoadingView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| loading-block | LoadingBlockView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| citation | CitationView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| web-link-cards | WebLinkCardsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| prompt-suggestions | PromptSuggestionsView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| animate | AnimateView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| celebration | CelebrationView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| carousel | CarouselView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| tab-panel | TabPanelView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| tab-group | TabGroupView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| list | ListView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| restaurant-menu | RestaurantMenuView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| table | Table | base | yes | no | no | Table |
| metric | MetricView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| metric-grid | MetricGridView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| steps | StepsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| callout | Alert | base | yes | no | no | Alert |
| label | LabelView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| slider | Slider | base | yes | no | no | Slider |
| checklist | ChecklistView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| rating | RatingView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| toggle | Switch | base | yes | no | no | Switch |
| select | Select | base | yes | no | no | Select |
| input | Input | base | yes | no | no | Input |
| textarea | Textarea | base | yes | no | no | Textarea |
| radio | RadioGroup | base | yes | no | no | RadioGroup |
| segmented | SegmentedView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| field | FieldView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| form | FormView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| button | Button | base | yes | no | no | Button |
| topology | TopologyView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| chart | BarChart | base | yes | no | no | BarChart |
| clock | ClockView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| stopwatch | StopwatchView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| timer | TimerView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| weather | WeatherView | view | yes | no | no | Card, Heading, Text, Row, Icon, Select, Table |
| f1-races | F1RacesView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| f1-standings | F1StandingsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| sports-schedule | SportsScheduleView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| sports-scoreboard | SportsScoreboardView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| sports-standings | SportsStandingsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| quiz | QuizView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| flashcards | FlashcardsView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| fill-blank | FillBlankView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| sentence-builder | SentenceBuilderView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| vocab-card | VocabCardView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| finance-quote | FinanceQuoteView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| finance-chart | FinanceChartView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| finance-comparison | FinanceComparisonView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| finance-heatmap | FinanceHeatmapView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| asset-distribution | AssetDistributionView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| transaction-list | TransactionListView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-accounts | LedgerAccountsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-recurring-transactions | LedgerRecurringTransactionsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| nba-scores | NbaScoresView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| soccer-games | SoccerGamesView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| american-football-games | AmericanFootballGamesView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| basketball-tournament | BasketballTournamentView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| election-results | ElectionResultsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| nba-game-boxscore | NbaGameBoxscoreView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| cricket-match-boxscore | CricketMatchBoxscoreView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| nba-player-summary | NbaPlayerSummaryView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| tennis-player-summary | TennisPlayerSummaryView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select |
| unit-converter | UnitConverterView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| currency-converter | CurrencyConverterView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| svg | SvgView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| native | NativeView | refusal | no | no | no | Card, Heading, Text, Stack, Row, Button |
| follow-up-card-group | FollowUpCardGroupView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| ledger-transaction-detail | LedgerTransactionDetailView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| recommendation-card | RecommendationCardView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| prompt-checklist | PromptChecklistView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
| ledger-finance-status-banner | LedgerFinanceStatusBannerView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| learning-audio-label-card | LearningAudioLabelCardView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| learning-image-choice-card | LearningImageChoiceCardView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| learning-image-label-card | LearningImageLabelCardView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| weather-sidebar-title | WeatherSidebarTitleView | view | yes | no | no | Card, Heading, Text, Row, Icon, Select, Table |
| ledger-low-confidence-category-correction | LedgerLowConfidenceCategoryCorrectionView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-net-worth | LedgerNetWorthView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| pressable | PressableView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| ledger-fee-interest-paid | LedgerFeeInterestPaidView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| html-view | HtmlViewView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| youtube | YoutubeView | host | yes | no | no | Card, Image, Text, Row, Button |
| search-image | SearchImageView | view | yes | no | no | Card, Image, Text, Row, Button |
| async-image-group | AsyncImageGroupView | view | yes | no | no | Card, Image, Text, Row, Button |
| async-image | AsyncImageView | view | yes | no | no | Card, Image, Text, Row, Button |
| lottie | LottieView | host | yes | no | no | Card, Image, Text, Row, Button |
| tabbed-section | TabbedSectionView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| visual-card-carousel | VisualCardCarouselView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| link-card | LinkCardView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| recommendation-link-card | RecommendationLinkCardView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| ledger-spend-so-far-this-month | LedgerSpendSoFarThisMonthView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-upcoming-activity | LedgerUpcomingActivityView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| image-grid | ImageGridView | view | yes | no | no | Card, Image, Text, Row, Button |
| conversation-suggestions | ConversationSuggestionsView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| follow-up-action-bar | FollowUpActionBarView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| ledger-income-tracker | LedgerIncomeTrackerView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| async-video-carousel | AsyncVideoCarouselView | view | yes | no | no | Card, Image, Text, Row, Button |
| display-automation | DisplayAutomationView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| list-automations | ListAutomationsView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| automation-plan-summary | AutomationPlanSummaryView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| scheduled-task-suggestion | ScheduledTaskSuggestionView | host | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| entity-card | EntityCardView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| entity-overview | EntityOverviewView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| ask-user-details | AskUserDetailsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| ask-user-files | AskUserFilesView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| ledger-spend-by-category | LedgerSpendByCategoryView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-spend-by-category-detail | LedgerSpendByCategoryDetailView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-spend-by-category-recent-transactions | LedgerSpendByCategoryRecentTransactionsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| learning-voice-mode-launcher-card | LearningVoiceModeLauncherCardView | host | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| offer-voice-conversation | OfferVoiceConversationView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| learning-speak-card | LearningSpeakCardView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| conversational-onboarding-advice | ConversationalOnboardingAdviceView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| conversational-onboarding-writing | ConversationalOnboardingWritingView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| onboarding-feature-card | OnboardingFeatureCardView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| onboarding-plugin-suggestions | OnboardingPluginSuggestionsView | host | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| onboarding-starter-tasks | OnboardingStarterTasksView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| conversational-onboarding-study | ConversationalOnboardingStudyView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| conversational-onboarding-search | ConversationalOnboardingSearchView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| follow-up-quiz | FollowUpQuizView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| multiple-choice-block-v2 | MultipleChoiceBlockV2View | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| personality-quiz | PersonalityQuizView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| whats-new-capability-welcome | WhatsNewCapabilityWelcomeView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| ask-user-location | AskUserLocationView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| reservation-time-pills-ref-carousel | ReservationTimePillsRefCarouselView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| whats-new-capability-search | WhatsNewCapabilitySearchView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| push-drip-series-intro | PushDripSeriesIntroView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| stop-push-drip-series | StopPushDripSeriesView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| task-autopause-card | TaskAutopauseCardView | host | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| ledger-finance-onboarding | LedgerFinanceOnboardingView | host | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-repair-bank-connection | LedgerRepairBankConnectionView | host | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| finance-onboarding-suggestions | FinanceOnboardingSuggestionsView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| places-metadata-bar | PlacesMetadataBarView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| plugin-followup | PluginFollowupView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| instant-suggestions | InstantSuggestionsView | view | yes | no | no | Card, Heading, Text, Stack, Button, Icon |
| ledger-equity-updates | LedgerEquityUpdatesView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-watchlist | LedgerWatchlistView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| homework-helper-v2 | HomeworkHelperV2View | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| image-gen | ImageGenView | host | yes | no | no | Card, Image, Text, Row, Button |
| internal-partner-app | InternalPartnerAppView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| bento | BentoView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| open-detail | OpenDetailView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| openai | OpenaiView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| ledger-credit-score | LedgerCreditScoreView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-credit-score-detail | LedgerCreditScoreDetailView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| ledger-low-confidence-category-correction-legacy | LedgerLowConfidenceCategoryCorrectionLegacyView | view | yes | no | no | Card, Heading, Text, Row, Badge, Table, Select, Button |
| superbowl-riddle | SuperbowlRiddleView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| learning-viz-dil | LearningVizDilView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| care-provider-results | CareProviderResultsView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| care-provider-sidebar | CareProviderSidebarView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| entity | EntityView | view | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| gen-image | GenImageView | host | yes | no | no | Card, Image, Text, Row, Button |
| speech-synthesizer | SpeechSynthesizerView | host | yes | no | no | Card, Heading, Text, Stack, Row, Button |
| calculator-corrected-adjusted-age-of-preterm-infants | CalculatorCorrectedAdjustedAgeOfPretermInfantsView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| calculator-glasgow-coma-scale-gcs | CalculatorGlasgowComaScaleGcsView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| calculator-rox-index-for-high-flow-nasal-cannula | CalculatorRoxIndexForHighFlowNasalCannulaView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| calculator-qsofa-score | CalculatorQsofaScoreView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| questionnaire | QuestionnaireView | view | yes | no | no | Card, Heading, Text, Stack, Input, RadioGroup, Select, Button |
| rating-summary | RatingSummaryView | view | yes | no | no | Stack, Text, Input, RadioGroup, Button |
