# 组件实现进度

当前固定分母为256项：功能已验31，部分18，已写待验2，未实现205。

功能已验不代表像素级复刻、全部浏览器或无障碍验收完成。Schema节点数与组件合同数量不是同一计数。

| ID | 组件 | 状态 | 说明 |
|---|---|---|---|
| base-animate | 动画/过渡与组编排 | 未实现 | 暂无专门实现证据 |
| base-badge | 徽章 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-blockquote | 引用块 | 未实现 | 暂无专门实现证据 |
| base-box | 基础容器 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-button | 按钮 | 部分实现 | 仅set/reset动作 |
| base-caption | 说明/图注 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-card | 卡片容器 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-carousel | 轮播 | 部分实现 | 仅滚动，缺完整轮播控制 |
| base-celebration | 完成庆祝反馈 | 未实现 | 暂无专门实现证据 |
| base-line-chart | 折线图 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-bar-chart | 柱状图 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-area-chart | 面积图 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-scatter-chart | 散点图 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-checkbox | 复选框 | 部分实现 | 仅toggle基础绑定，缺独立required/disabled合同 |
| base-code | 行内代码 | 部分实现 | 无行内代码 |
| base-col | 纵向布局 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-date-picker | 日期选择 | 未实现 | 暂无专门实现证据 |
| base-divider | 分隔线 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-favicon | 网站/来源图标 | 未实现 | 暂无专门实现证据 |
| base-flashcard-flip | 双面翻卡容器 | 功能已验 | f372c71已通过完整CI与学习亮暗截图复核 |
| base-flow | 流式铺排 | 未实现 | 暂无专门实现证据 |
| base-form | 表单 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-grid | 网格 | 部分实现 | 无独立grid-item/span |
| base-html-view | 隔离HTML视图 | 未实现 | 暂无专门实现证据 |
| base-icon | 图标 | 未实现 | 暂无专门实现证据 |
| base-image | 图片 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-input | 单行输入 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-label | 字段标签 | 部分实现 | 仅字段内部label |
| base-link | 链接 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-list | 列表 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-loading | 加载指示 | 部分实现 | 仅领域局部状态 |
| base-loading-block | 骨架/加载占位 | 部分实现 | 仅领域局部状态 |
| base-lottie | Lottie动画 | 未实现 | 暂无专门实现证据 |
| base-markdown | Markdown | 部分实现 | 纯文本降级 |
| base-math | 数学公式 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-pie-chart | 饼图/环图 | 部分实现 | 只有donut |
| base-popover | 弹出层 | 未实现 | 暂无专门实现证据 |
| base-pressable | 可点击内容区 | 未实现 | 暂无专门实现证据 |
| base-pulse-indicator | 脉冲状态指示 | 未实现 | 暂无专门实现证据 |
| base-radio-group | 单选组 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-row | 横向布局 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-search-image | 检索图片媒体 | 未实现 | 暂无专门实现证据 |
| base-segmented-control | 分段选择 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-select | 下拉选择 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-slider | 滑块 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-spacer | 间隔占位 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-svg | SVG矢量图 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-table | 表格 | 部分实现 | 无section/合并单元格 |
| base-text | 文本 | 部分实现 | 缺italic/underline/strike/shimmer |
| base-textarea | 多行输入 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-title | 标题 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| base-tooltip | 工具提示 | 未实现 | 暂无专门实现证据 |
| base-youtube | YouTube播放器 | 未实现 | 暂无专门实现证据 |
| sports-schedule | Epl Schedule | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| sports-standings | Epl Standings | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| american-football-games | Cfb Games | 部分实现 | 通用scoreboard未覆盖完整橄榄球合同 |
| location-choice-request | Ask User Location V2 | 未实现 | 暂无专门实现证据 |
| web-link-cards | Web Links Carousel | 未实现 | 暂无专门实现证据 |
| business-gallery | Business Gallery | 未实现 | 暂无专门实现证据 |
| citation | Cite | 未实现 | 暂无专门实现证据 |
| calendar-agenda | Calendar List | 未实现 | 暂无专门实现证据 |
| learning-flashcards | Learning Flashcards | 功能已验 | f372c71已通过完整CI与学习亮暗截图复核 |
| person-profile | Person | 未实现 | 暂无专门实现证据 |
| reddit-thread-card | Reddit | 未实现 | 暂无专门实现证据 |
| restaurant-menu | Restaurant Menu | 未实现 | 暂无专门实现证据 |
| entity-reviews | Entity Reviews | 未实现 | 暂无专门实现证据 |
| restaurant-availability | Reservation Time Pills Ref | 未实现 | 暂无专门实现证据 |
| scheduled-task-suggestion | Offer Scheduled Prompt | 未实现 | 暂无专门实现证据 |
| email-draft | Draft Email | 未实现 | 暂无专门实现证据 |
| task-expansion-card | Task Expansion Card | 未实现 | 暂无专门实现证据 |
| unit-converter | Unit Converter | 未实现 | 暂无专门实现证据 |
| asset-distribution | Ledger Account Breakdown | 未实现 | 暂无专门实现证据 |
| transaction-list | Ledger Recent Transactions | 未实现 | 暂无专门实现证据 |
| onboarding-selection | Onboarding Selection Card | 未实现 | 暂无专门实现证据 |
| entity-overview | Entity Overview | 未实现 | 暂无专门实现证据 |
| entity-card | Entity Card | 未实现 | 暂无专门实现证据 |
| prompt-suggestions | Follow Up | 未实现 | 暂无专门实现证据 |
| conversation-suggestions | Conversational Onboarding Follow Up Pills | 未实现 | 暂无专门实现证据 |
| news-article | News Article | 未实现 | 暂无专门实现证据 |
| flight-option | Flight Card | 未实现 | 暂无专门实现证据 |
| currency-converter | Currency Converter | 未实现 | 暂无专门实现证据 |
| code-block | Code Block | 部分实现 | 无copy/高亮等领域功能 |
| writing-block | Writing Block | 未实现 | 暂无专门实现证据 |
| artist-upcoming-events | Artist Upcoming Events | 未实现 | 暂无专门实现证据 |
| ask-user-details | Ask User Details | 未实现 | 暂无专门实现证据 |
| ask-user-files | Ask User Files | 未实现 | 暂无专门实现证据 |
| ask-user-location | Ask User Location | 未实现 | 暂无专门实现证据 |
| async-image | Async Image | 未实现 | 暂无专门实现证据 |
| async-image-group | Async Image Group | 未实现 | 暂无专门实现证据 |
| async-video-carousel | Async Video Carousel | 未实现 | 暂无专门实现证据 |
| automation-plan-summary | Automation Plan Summary | 未实现 | 暂无专门实现证据 |
| basketball-tournament | Basketball Tournament | 未实现 | 暂无专门实现证据 |
| bento | Bento | 未实现 | 暂无专门实现证据 |
| calculator-abcd2-score-for-transient-ischemic-attack | Calculator Abcd2 Score For Transient Ischemic Attack | 未实现 | 暂无专门实现证据 |
| calculator-apache-ii-score | Calculator Apache Ii Score | 未实现 | 暂无专门实现证据 |
| calculator-apgar-score | Calculator Apgar Score | 未实现 | 暂无专门实现证据 |
| calculator-asa-physical-status-classification | Calculator Asa Physical Status Classification | 未实现 | 暂无专门实现证据 |
| calculator-bilitool | Calculator Bilitool | 未实现 | 暂无专门实现证据 |
| calculator-bisap-score-for-pancreatitis | Calculator Bisap Score For Pancreatitis | 未实现 | 暂无专门实现证据 |
| calculator-bishop-score-for-cervical-ripening | Calculator Bishop Score For Cervical Ripening | 未实现 | 暂无专门实现证据 |
| calculator-canadian-ct-head-rule | Calculator Canadian Ct Head Rule | 未实现 | 暂无专门实现证据 |
| calculator-cha2ds2-vasc-score-for-atrial-fibrillation-stroke-risk | Calculator Cha2ds2 Vasc Score For Atrial Fibrillation Stroke Risk | 未实现 | 暂无专门实现证据 |
| calculator-child-pugh-score-for-cirrhosis | Calculator Child Pugh Score For Cirrhosis | 未实现 | 暂无专门实现证据 |
| calculator-corrected-adjusted-age-of-preterm-infants | Calculator Corrected Adjusted Age Of Preterm Infants | 未实现 | 暂无专门实现证据 |
| calculator-curb65-score-for-pneumonia | Calculator Curb65 Score For Pneumonia | 未实现 | 暂无专门实现证据 |
| calculator-duke-treadmill-score | Calculator Duke Treadmill Score | 未实现 | 暂无专门实现证据 |
| calculator-four-tscore-for-heparin-induced-thrombocytopenia | Calculator Four TScore For Heparin Induced Thrombocytopenia | 未实现 | 暂无专门实现证据 |
| calculator-glasgow-blatchford-score-for-upper-gi-bleeding | Calculator Glasgow Blatchford Score For Upper Gi Bleeding | 未实现 | 暂无专门实现证据 |
| calculator-glasgow-coma-scale-gcs | Calculator Glasgow Coma Scale Gcs | 未实现 | 暂无专门实现证据 |
| calculator-grace-score-for-acute-coronary-syndrome | Calculator Grace Score For Acute Coronary Syndrome | 未实现 | 暂无专门实现证据 |
| calculator-has-bled-score-for-major-bleeding-risk | Calculator Has Bled Score For Major Bleeding Risk | 未实现 | 暂无专门实现证据 |
| calculator-heart-score-for-major-cardiac-events | Calculator Heart Score For Major Cardiac Events | 未实现 | 暂无专门实现证据 |
| calculator-hunt-and-hess-score-for-subarachnoid-hemorrhage | Calculator Hunt And Hess Score For Subarachnoid Hemorrhage | 未实现 | 暂无专门实现证据 |
| calculator-ich-score | Calculator Ich Score | 未实现 | 暂无专门实现证据 |
| calculator-isth-dic-score | Calculator Isth Dic Score | 未实现 | 暂无专门实现证据 |
| calculator-modified-rankin-scale | Calculator Modified Rankin Scale | 未实现 | 暂无专门实现证据 |
| calculator-nexus-cervical-spine-rule | Calculator Nexus Cervical Spine Rule | 未实现 | 暂无专门实现证据 |
| calculator-nih-stroke-scale-nihss | Calculator Nih Stroke Scale Nihss | 未实现 | 暂无专门实现证据 |
| calculator-ottawa-ankle-rule | Calculator Ottawa Ankle Rule | 未实现 | 暂无专门实现证据 |
| calculator-ottawa-knee-rule | Calculator Ottawa Knee Rule | 未实现 | 暂无专门实现证据 |
| calculator-padua-prediction-score-for-venous-thromboembolism-risk | Calculator Padua Prediction Score For Venous Thromboembolism Risk | 未实现 | 暂无专门实现证据 |
| calculator-pecarn-pediatric-head-injury-rule | Calculator Pecarn Pediatric Head Injury Rule | 未实现 | 暂无专门实现证据 |
| calculator-pediatric-early-warning-score-pews | Calculator Pediatric Early Warning Score Pews | 未实现 | 暂无专门实现证据 |
| calculator-perc-rule-for-pulmonary-embolism | Calculator Perc Rule For Pulmonary Embolism | 未实现 | 暂无专门实现证据 |
| calculator-pneumonia-severity-index-psi-port | Calculator Pneumonia Severity Index Psi Port | 未实现 | 暂无专门实现证据 |
| calculator-qsofa-score | Calculator Qsofa Score | 未实现 | 暂无专门实现证据 |
| calculator-ranson-criteria-for-pancreatitis | Calculator Ranson Criteria For Pancreatitis | 未实现 | 暂无专门实现证据 |
| calculator-revised-cardiac-risk-index-rcri | Calculator Revised Cardiac Risk Index Rcri | 未实现 | 暂无专门实现证据 |
| calculator-revised-geneva-score-for-pulmonary-embolism | Calculator Revised Geneva Score For Pulmonary Embolism | 未实现 | 暂无专门实现证据 |
| calculator-rochester-criteria-for-febrile-infants | Calculator Rochester Criteria For Febrile Infants | 未实现 | 暂无专门实现证据 |
| calculator-rockall-score-for-upper-gi-bleeding | Calculator Rockall Score For Upper Gi Bleeding | 未实现 | 暂无专门实现证据 |
| calculator-rox-index-for-high-flow-nasal-cannula | Calculator Rox Index For High Flow Nasal Cannula | 未实现 | 暂无专门实现证据 |
| calculator-sirs-criteria | Calculator Sirs Criteria | 未实现 | 暂无专门实现证据 |
| calculator-sofa-score | Calculator Sofa Score | 未实现 | 暂无专门实现证据 |
| calculator-stop-bang-score-for-obstructive-sleep-apnea | Calculator Stop Bang Score For Obstructive Sleep Apnea | 未实现 | 暂无专门实现证据 |
| calculator-surgical-apgar-score | Calculator Surgical Apgar Score | 未实现 | 暂无专门实现证据 |
| calculator-timi-risk | Calculator Timi Risk | 未实现 | 暂无专门实现证据 |
| calculator-wells-score-for-deep-vein-thrombosis | Calculator Wells Score For Deep Vein Thrombosis | 未实现 | 暂无专门实现证据 |
| calculator-wells-score-for-pulmonary-embolism | Calculator Wells Score For Pulmonary Embolism | 未实现 | 暂无专门实现证据 |
| calculator-westley-croup-severity-score | Calculator Westley Croup Severity Score | 未实现 | 暂无专门实现证据 |
| calculator-years-algorithm-for-pulmonary-embolism | Calculator Years Algorithm For Pulmonary Embolism | 未实现 | 暂无专门实现证据 |
| care-provider-results | Care Provider Results | 未实现 | 暂无专门实现证据 |
| care-provider-sidebar | Care Provider Sidebar | 未实现 | 暂无专门实现证据 |
| checklist | Checklist | 未实现 | 暂无专门实现证据 |
| clock | Clock | 未实现 | 暂无专门实现证据 |
| code-cite | Code Cite | 未实现 | 暂无专门实现证据 |
| conversational-onboarding-advice | Conversational Onboarding Advice | 未实现 | 暂无专门实现证据 |
| conversational-onboarding-search | Conversational Onboarding Search | 未实现 | 暂无专门实现证据 |
| conversational-onboarding-study | Conversational Onboarding Study | 未实现 | 暂无专门实现证据 |
| conversational-onboarding-writing | Conversational Onboarding Writing | 未实现 | 暂无专门实现证据 |
| copy-words | Copy Words | 未实现 | 暂无专门实现证据 |
| create-interactive-poll | Create Interactive Poll | 未实现 | 暂无专门实现证据 |
| cricket-match-boxscore | Cricket Match Boxscore | 未实现 | 暂无专门实现证据 |
| digital-stopwatch | Digital Stopwatch | 未实现 | 暂无专门实现证据 |
| digital-timer | Digital Timer | 未实现 | 暂无专门实现证据 |
| display-automation | Display Automation | 未实现 | 暂无专门实现证据 |
| election-results | Election Results | 未实现 | 暂无专门实现证据 |
| email-preview | Email Preview | 未实现 | 暂无专门实现证据 |
| entity | Entity | 未实现 | 暂无专门实现证据 |
| entity-thumbnail-list | Entity Thumbnail List | 未实现 | 暂无专门实现证据 |
| event-sidebar | Event Sidebar | 未实现 | 暂无专门实现证据 |
| f1-races | F1 Races | 未实现 | 暂无专门实现证据 |
| f1-standings | F1 Standings | 未实现 | 暂无专门实现证据 |
| file-cite | File Cite | 未实现 | 暂无专门实现证据 |
| file-nav-list | File Nav List | 未实现 | 暂无专门实现证据 |
| finance-onboarding-suggestions | Finance Onboarding Suggestions | 未实现 | 暂无专门实现证据 |
| flight-results | Flight Results | 未实现 | 暂无专门实现证据 |
| flight-search-form | Flight Search Form | 未实现 | 暂无专门实现证据 |
| flight-tracker | Flight Tracker | 未实现 | 暂无专门实现证据 |
| follow-up-action-bar | Follow Up Action Bar | 未实现 | 暂无专门实现证据 |
| follow-up-card-group | Follow Up Card Group | 未实现 | 暂无专门实现证据 |
| follow-up-quiz | Follow Up Quiz | 未实现 | 暂无专门实现证据 |
| gen-image | Gen Image | 未实现 | 暂无专门实现证据 |
| homework-helper-v2 | Homework Helper V2 | 未实现 | 暂无专门实现证据 |
| image-gen | Image Gen | 未实现 | 暂无专门实现证据 |
| image-grid | Image Grid | 未实现 | 暂无专门实现证据 |
| instant-suggestions | Instant Suggestions | 未实现 | 暂无专门实现证据 |
| internal-partner-app | Internal Partner App | 未实现 | 暂无专门实现证据 |
| jobs | Jobs | 未实现 | 暂无专门实现证据 |
| learning-audio-label-card | Learning Audio Label Card | 未实现 | 暂无专门实现证据 |
| learning-fill-blank-card | Learning Fill Blank Card | 未实现 | 暂无专门实现证据 |
| learning-image-choice-card | Learning Image Choice Card | 未实现 | 暂无专门实现证据 |
| learning-image-label-card | Learning Image Label Card | 未实现 | 暂无专门实现证据 |
| learning-sentence-builder-card | Learning Sentence Builder Card | 未实现 | 暂无专门实现证据 |
| learning-speak-card | Learning Speak Card | 未实现 | 暂无专门实现证据 |
| learning-viz-dil | Learning Viz Dil | 未实现 | 暂无专门实现证据 |
| learning-vocab-card | Learning Vocab Card | 未实现 | 暂无专门实现证据 |
| learning-voice-mode-launcher-card | Learning Voice Mode Launcher Card | 未实现 | 暂无专门实现证据 |
| ledger-accounts | Ledger Accounts | 未实现 | 暂无专门实现证据 |
| ledger-credit-score-detail | Ledger Credit Score Detail | 未实现 | 暂无专门实现证据 |
| ledger-credit-score | Ledger Credit Score | 未实现 | 暂无专门实现证据 |
| ledger-equity-updates | Ledger Equity Updates | 未实现 | 暂无专门实现证据 |
| ledger-fee-interest-paid | Ledger Fee Interest Paid | 未实现 | 暂无专门实现证据 |
| ledger-finance-onboarding | Ledger Finance Onboarding | 未实现 | 暂无专门实现证据 |
| ledger-finance-status-banner | Ledger Finance Status Banner | 未实现 | 暂无专门实现证据 |
| ledger-income-tracker | Ledger Income Tracker | 未实现 | 暂无专门实现证据 |
| ledger-low-confidence-category-correction | Ledger Low Confidence Category Correction | 未实现 | 暂无专门实现证据 |
| ledger-low-confidence-category-correction-legacy | Ledger Low Confidence Category Correction Legacy | 未实现 | 暂无专门实现证据 |
| ledger-net-worth | Ledger Net Worth | 未实现 | 暂无专门实现证据 |
| ledger-recurring-transactions | Ledger Recurring Transactions | 未实现 | 暂无专门实现证据 |
| ledger-repair-bank-connection | Ledger Repair Bank Connection | 未实现 | 暂无专门实现证据 |
| ledger-spend-by-category-detail | Ledger Spend By Category Detail | 未实现 | 暂无专门实现证据 |
| ledger-spend-by-category-recent-transactions | Ledger Spend By Category Recent Transactions | 未实现 | 暂无专门实现证据 |
| ledger-spend-by-category | Ledger Spend By Category | 未实现 | 暂无专门实现证据 |
| ledger-spend-so-far-this-month | Ledger Spend So Far This Month | 未实现 | 暂无专门实现证据 |
| ledger-transaction-detail | Ledger Transaction Detail | 未实现 | 暂无专门实现证据 |
| ledger-upcoming-activity | Ledger Upcoming Activity | 未实现 | 暂无专门实现证据 |
| ledger-watchlist | Ledger Watchlist | 未实现 | 暂无专门实现证据 |
| link | Link | 未实现 | 暂无专门实现证据 |
| link-card | Link Card | 未实现 | 暂无专门实现证据 |
| list-automations | List Automations | 未实现 | 暂无专门实现证据 |
| local-business | Local Business | 未实现 | 暂无专门实现证据 |
| multiple-choice-block-v2 | Multiple Choice Block V2 | 未实现 | 暂无专门实现证据 |
| nba-game-boxscore | Nba Game Boxscore | 未实现 | 暂无专门实现证据 |
| nba-player-summary | Nba Player Summary | 未实现 | 暂无专门实现证据 |
| nba-scores | Nba Scores | 部分实现 | 通用scoreboard未覆盖完整NBA合同 |
| offer-voice-conversation | Offer Voice Conversation | 未实现 | 暂无专门实现证据 |
| onboarding-feature-card | Onboarding Feature Card | 未实现 | 暂无专门实现证据 |
| onboarding-plugin-suggestions | Onboarding Plugin Suggestions | 未实现 | 暂无专门实现证据 |
| onboarding-starter-tasks | Onboarding Starter Tasks | 未实现 | 暂无专门实现证据 |
| openai | Openai | 未实现 | 暂无专门实现证据 |
| open-detail | Open Detail | 未实现 | 暂无专门实现证据 |
| package-tracker | Package Tracker | 未实现 | 暂无专门实现证据 |
| personality-quiz | Personality Quiz | 未实现 | 暂无专门实现证据 |
| places-metadata-bar | Places Metadata Bar | 未实现 | 暂无专门实现证据 |
| plugin-followup | Plugin Followup | 未实现 | 暂无专门实现证据 |
| product-card | Product Card | 未实现 | 暂无专门实现证据 |
| prompt-checklist | Prompt Checklist | 未实现 | 暂无专门实现证据 |
| push-drip-series-intro | Push Drip Series Intro | 未实现 | 暂无专门实现证据 |
| learning-quiz | Learning Quiz | 功能已验 | f372c71已通过完整CI与学习亮暗截图复核 |
| rating | Rating | 未实现 | 暂无专门实现证据 |
| recommendation-card | Recommendation Card | 未实现 | 暂无专门实现证据 |
| recommendation-link-card | Recommendation Link Card | 未实现 | 暂无专门实现证据 |
| reservation-time-pills-ref-carousel | Reservation Time Pills Ref Carousel | 未实现 | 暂无专门实现证据 |
| restaurant-reviews | Restaurant Reviews | 未实现 | 暂无专门实现证据 |
| shared-activity-planner | Shared Activity Planner | 未实现 | 暂无专门实现证据 |
| sidebar-fact-table | Sidebar Fact Table | 未实现 | 暂无专门实现证据 |
| sidebar-people-also-ask | Sidebar People Also Ask | 未实现 | 暂无专门实现证据 |
| soccer-games | Soccer Games | 部分实现 | 通用scoreboard未覆盖完整足球合同 |
| speech-synthesizer | Speech Synthesizer | 未实现 | 暂无专门实现证据 |
| stock-chart | Stock Chart | 已写待验 | 金融快照/历史/比较源码已整合，等待浏览器CI |
| stock-comparison-chart | Stock Comparison Chart | 已写待验 | 金融快照/历史/比较源码已整合，等待浏览器CI |
| stock-heatmap | Stock Heatmap | 未实现 | 暂无专门实现证据 |
| stop-push-drip-series | Stop Push Drip Series | 未实现 | 暂无专门实现证据 |
| superbowl-riddle | Superbowl Riddle | 未实现 | 暂无专门实现证据 |
| tabbed-section | Tabbed Section | 未实现 | 暂无专门实现证据 |
| tab-group | Tab Group | 未实现 | 暂无专门实现证据 |
| task-autopause-card | Task Autopause Card | 未实现 | 暂无专门实现证据 |
| tennis-player-summary | Tennis Player Summary | 未实现 | 暂无专门实现证据 |
| visual-card-carousel | Visual Card Carousel | 未实现 | 暂无专门实现证据 |
| weather-sidebar-title | Weather Sidebar Title | 部分实现 | 仅weather内标题，非独立组件 |
| weather | Weather | 部分实现 | 旧天气变体行为未完整核对 |
| weather-widget-v3 | Weather Widget V3 | 功能已验 | 功能与现有回归通过；不代表像素级配色复刻通过 |
| whats-new-capability-search | Whats New Capability Search | 未实现 | 暂无专门实现证据 |
| whats-new-capability-welcome | Whats New Capability Welcome | 未实现 | 暂无专门实现证据 |
| word-card | Word Card | 未实现 | 暂无专门实现证据 |

学习验收：[f372c71 CI](https://github.com/Micraow/Intelligent-UI/actions/runs/37868547936)。该矩阵按组件功能合同统计；配色角色来源与像素一致性边界另见design-tokens.md。
