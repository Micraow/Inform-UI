// Original fictional compositions, rendered by the unmodified Inform UI runtime.
export const pages = [
  {
    "id": "create",
    "eyebrow": "01 / CONTENT & INTERACTION",
    "title": "Small JSON.\nReal interfaces.",
    "description": "Words, data and little moments\nof interaction. Made to fit together.",
    "color": "lilac",
    "columns": [
      [
        {
          "id": "reading-plan",
          "label": "SLIDER · LIVE STATE",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {
              "pages": 25
            },
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "Make time for a good book."
              },
              {
                "type": "caption",
                "value": "A little reading, every day."
              },
              {
                "type": "slider",
                "label": "Daily pages",
                "bind": "pages",
                "min": 5,
                "max": 60,
                "step": 5
              },
              {
                "type": "metric",
                "label": "Your daily goal",
                "value": {
                  "$": "pages"
                },
                "unit": "pages",
                "hint": "Try the slider. The value updates locally."
              }
            ]
          }
        },
        {
          "id": "quote",
          "label": "BLOCKQUOTE · TYPOGRAPHY",
          "tone": "soft",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "blockquote",
                "children": [
                  {
                    "type": "text",
                    "value": "Good interfaces give an idea room to breathe."
                  }
                ],
                "attribution": "An original thought for the gallery"
              }
            ]
          }
        }
      ],
      [
        {
          "id": "reading-chart",
          "label": "LINE CHART · DATA",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "A week of good ideas."
              },
              {
                "type": "chart",
                "kind": "line",
                "title": "Reading rhythm",
                "xKey": "day",
                "data": [
                  {
                    "day": "Mon",
                    "value": 18
                  },
                  {
                    "day": "Tue",
                    "value": 32
                  },
                  {
                    "day": "Wed",
                    "value": 26
                  },
                  {
                    "day": "Thu",
                    "value": 45
                  },
                  {
                    "day": "Fri",
                    "value": 39
                  },
                  {
                    "day": "Sat",
                    "value": 58
                  }
                ],
                "series": [
                  {
                    "key": "value",
                    "label": "Pages read",
                    "color": "purple"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "word",
          "label": "VOCAB CARD",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "vocab-card",
                "term": "serendipity",
                "languageLabel": "English",
                "pronunciation": "/ˌserənˈdɪpəti/",
                "partOfSpeech": "noun",
                "senses": [
                  {
                    "id": "one",
                    "meaning": "Finding something wonderful when you were looking for something else."
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "callout",
          "label": "CALLOUT",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "callout",
                "tone": "info",
                "value": "Every composition is a complete, editable JSON document."
              }
            ]
          }
        }
      ],
      [
        {
          "id": "mix",
          "label": "DONUT CHART",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "A well-rounded shelf."
              },
              {
                "type": "chart",
                "kind": "donut",
                "xKey": "genre",
                "data": [
                  {
                    "genre": "Design",
                    "books": 12
                  },
                  {
                    "genre": "Science",
                    "books": 8
                  },
                  {
                    "genre": "Stories",
                    "books": 6
                  }
                ],
                "series": [
                  {
                    "key": "books",
                    "label": "Books",
                    "color": "blue"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "preferences",
          "label": "RATING SUMMARY · SEGMENTED CONTROL",
          "tone": "soft",
          "document": {
            "version": "iui/1",
            "state": {
              "mode": "focus",
              "rating": 4
            },
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "Make it feel like you."
              },
              {
                "type": "segmented",
                "label": "Reading mode",
                "bind": "mode",
                "options": [
                  {
                    "label": "Focus",
                    "value": "focus"
                  },
                  {
                    "label": "Explore",
                    "value": "explore"
                  }
                ]
              },
              {
                "type": "rating-summary",
                "ratingLabel": "4.8",
                "reviewCountLabel": "(120 reader reviews)"
              }
            ]
          }
        }
      ],
      [
        {
          "id": "form",
          "label": "FORM · INPUT · TOGGLE",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {
              "name": "Alex",
              "topic": "design",
              "notes": true
            },
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "Your next workshop."
              },
              {
                "type": "form",
                "label": "Workshop preferences",
                "children": [
                  {
                    "type": "input",
                    "kind": "text",
                    "label": "Display name",
                    "bind": "name"
                  },
                  {
                    "type": "select",
                    "label": "Topic",
                    "bind": "topic",
                    "options": [
                      {
                        "label": "Design systems",
                        "value": "design"
                      },
                      {
                        "label": "Creative coding",
                        "value": "code"
                      }
                    ]
                  },
                  {
                    "type": "toggle",
                    "label": "Include practice notes",
                    "bind": "notes"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "table",
          "label": "TABLE · STRUCTURED DATA",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "A lighter reading list."
              },
              {
                "type": "table",
                "columns": [
                  "Book",
                  "Pages",
                  "Status"
                ],
                "rows": [
                  [
                    "Design, Everyday",
                    184,
                    "Reading"
                  ],
                  [
                    "Field Notes",
                    96,
                    "Up next"
                  ],
                  [
                    "Small Wonders",
                    240,
                    "Finished"
                  ]
                ]
              }
            ]
          }
        },
        {
          "id": "badges",
          "label": "BADGE · ROW",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "row",
                "children": [
                  {
                    "type": "badge",
                    "value": "Composable",
                    "color": "success"
                  },
                  {
                    "type": "badge",
                    "value": "Local-first",
                    "color": "info"
                  },
                  {
                    "type": "badge",
                    "value": "MIT licensed",
                    "color": "accent"
                  }
                ]
              }
            ]
          }
        }
      ]
    ]
  },
  {
    "id": "explore",
    "eyebrow": "02 / DATA & EVERYDAY TOOLS",
    "title": "See the signal.\nKeep the context.",
    "description": "Charts and domain cards, built\nfrom the information you supply.",
    "color": "mint",
    "columns": [
      [
        {
          "id": "metrics",
          "label": "METRIC GRID",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "metric-grid",
                "columns": 2,
                "children": [
                  {
                    "type": "metric",
                    "label": "Reading streak",
                    "value": 12,
                    "unit": "days"
                  },
                  {
                    "type": "metric",
                    "label": "This month",
                    "value": 840,
                    "unit": "pages",
                    "color": "success"
                  },
                  {
                    "type": "metric",
                    "label": "On your shelf",
                    "value": 26,
                    "unit": "books"
                  },
                  {
                    "type": "metric",
                    "label": "Next goal",
                    "value": 1000,
                    "unit": "pages"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "forecast",
          "label": "WEATHER",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "weather",
                "location": {
                  "name": "Harbor Bay · fictional",
                  "timezone": "UTC"
                },
                "updatedAt": "2026-10-01T12:00Z",
                "source": {
                  "label": "Original sample data",
                  "synthetic": true
                },
                "units": {
                  "temperature": "celsius"
                },
                "current": {
                  "time": "2026-10-01T12:00Z",
                  "temperature": 23,
                  "feelsLike": 24,
                  "condition": "partly-cloudy",
                  "description": "A fine day to wander."
                },
                "daily": [
                  {
                    "date": "2026-10-01",
                    "label": "Today",
                    "low": 17,
                    "high": 24,
                    "condition": "partly-cloudy",
                    "precipitationProbability": 10
                  },
                  {
                    "date": "2026-10-02",
                    "label": "Fri",
                    "low": 18,
                    "high": 25,
                    "condition": "clear",
                    "precipitationProbability": 5
                  },
                  {
                    "date": "2026-10-03",
                    "label": "Sat",
                    "low": 16,
                    "high": 22,
                    "condition": "rain",
                    "precipitationProbability": 60
                  }
                ],
                "hourly": [],
                "presentation": "compact",
                "useCurrent": true
              }
            ]
          }
        }
      ],
      [
        {
          "id": "market",
          "label": "FINANCE CHART",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "finance-chart",
                "title": "Cedar Studio",
                "source": {
                  "label": "Original sample data",
                  "synthetic": true
                },
                "instrument": {
                  "id": "cedar",
                  "symbol": "CEDR",
                  "name": "Cedar Studio · fictional",
                  "currency": "USD",
                  "timezone": "UTC",
                  "asOf": "2026-10-01T14:00Z",
                  "marketStatus": "closed",
                  "delayMinutes": 15,
                  "price": 128,
                  "previousClose": 125,
                  "history": [
                    {
                      "time": "2026-10-01T09:00Z",
                      "price": 121
                    },
                    {
                      "time": "2026-10-01T10:00Z",
                      "price": 123.2
                    },
                    {
                      "time": "2026-10-01T11:00Z",
                      "price": 122.3
                    },
                    {
                      "time": "2026-10-01T12:00Z",
                      "price": 126.1
                    },
                    {
                      "time": "2026-10-01T13:00Z",
                      "price": 125.7
                    },
                    {
                      "time": "2026-10-01T14:00Z",
                      "price": 128
                    }
                  ]
                },
                "ranges": [
                  {
                    "id": "day",
                    "label": "1D",
                    "from": "2026-10-01T09:00Z",
                    "to": "2026-10-01T14:00Z"
                  }
                ],
                "initialRange": "day"
              }
            ]
          }
        }
      ],
      [
        {
          "id": "converter",
          "label": "UNIT CONVERTER",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "unit-converter",
                "title": "Everyday conversions",
                "category": "length",
                "amount": 5,
                "from": "km",
                "to": "mi",
                "precision": 2
              }
            ]
          }
        }
      ],
      [
        {
          "id": "bars",
          "label": "BAR CHART",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "title",
                "level": 2,
                "value": "Make progress visible."
              },
              {
                "type": "chart",
                "kind": "bar",
                "title": "Weekly focus sessions",
                "xKey": "day",
                "data": [
                  {
                    "day": "Mon",
                    "value": 4
                  },
                  {
                    "day": "Tue",
                    "value": 7
                  },
                  {
                    "day": "Wed",
                    "value": 5
                  },
                  {
                    "day": "Thu",
                    "value": 8
                  },
                  {
                    "day": "Fri",
                    "value": 6
                  },
                  {
                    "day": "Sat",
                    "value": 10
                  }
                ],
                "series": [
                  {
                    "key": "value",
                    "label": "Focus sessions",
                    "color": "green"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "formula",
          "label": "MATH · KATEX",
          "tone": "soft",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "caption",
                "value": "A SIMPLE IDEA, PRECISELY EXPRESSED"
              },
              {
                "type": "math",
                "latex": "e^{i\\pi}+1=0",
                "block": true
              },
              {
                "type": "text",
                "value": "Beautiful typesetting for the details that matter."
              }
            ]
          }
        },
        {
          "id": "checklist",
          "label": "CHECKLIST",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {
              "idea": true,
              "build": true,
              "share": false
            },
            "body": [
              {
                "type": "checklist",
                "label": "A little launch checklist",
                "items": [
                  {
                    "id": "idea",
                    "label": "Shape the idea",
                    "bind": "idea"
                  },
                  {
                    "id": "build",
                    "label": "Build the first version",
                    "bind": "build"
                  },
                  {
                    "id": "share",
                    "label": "Share what you made",
                    "bind": "share"
                  }
                ],
                "filter": false,
                "bulk": false
              }
            ]
          }
        }
      ]
    ]
  },
  {
    "id": "compose",
    "eyebrow": "03 / PLANS & COMPOSITIONS",
    "title": "Build a little\nworld of your own.",
    "description": "Local controls. Useful context.\nCompositions you can make yours.",
    "color": "peach",
    "columns": [
      [
        {
          "id": "agenda",
          "label": "AGENDA",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "agenda",
                "label": "An afternoon of making",
                "events": [
                  {
                    "id": "hello",
                    "date": "2026-10-17",
                    "title": "Coffee & introductions",
                    "start": "13:00",
                    "end": "13:30",
                    "location": "The studio"
                  },
                  {
                    "id": "make",
                    "date": "2026-10-17",
                    "title": "Make something small",
                    "start": "13:30",
                    "end": "15:00",
                    "location": "Workshop tables"
                  },
                  {
                    "id": "share",
                    "date": "2026-10-17",
                    "title": "Show, tell & celebrate",
                    "start": "15:00",
                    "end": "15:30"
                  }
                ]
              }
            ]
          }
        }
      ],
      [
        {
          "id": "flight",
          "label": "FLIGHT OPTION",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "flight-option",
                "id": "gallery-flight",
                "label": "A weekend away",
                "optionId": "harbor",
                "price": {
                  "amount": 168,
                  "currency": "USD"
                },
                "legs": [
                  {
                    "id": "outbound",
                    "carrier": "Example Air",
                    "number": "EX 218",
                    "departure": {
                      "airport": "SFO",
                      "at": "2026-10-17T09:00-07:00",
                      "name": "San Francisco"
                    },
                    "arrival": {
                      "airport": "LAX",
                      "at": "2026-10-17T10:30-07:00",
                      "name": "Los Angeles"
                    },
                    "cabin": "Economy"
                  }
                ],
                "note": "Fictional itinerary. No booking service is connected.",
                "source": {
                  "label": "Original travel sample",
                  "url": "https://example.org/gallery-flight"
                }
              }
            ]
          }
        },
        {
          "id": "steps",
          "label": "STEPS",
          "tone": "soft",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "steps",
                "items": [
                  {
                    "title": "Describe it",
                    "detail": "Start with your content and data."
                  },
                  {
                    "title": "Validate it",
                    "detail": "Check the document against iui/1."
                  },
                  {
                    "title": "Make it real",
                    "detail": "Mount in a browser or export HTML."
                  }
                ]
              }
            ]
          }
        }
      ],
      [
        {
          "id": "tabs",
          "label": "TABS · COMPOSITION",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "tab-group",
                "label": "A creative weekend",
                "initial": "day1",
                "children": [
                  {
                    "type": "tab-panel",
                    "id": "day1",
                    "label": "Saturday",
                    "children": [
                      {
                        "type": "title",
                        "level": 2,
                        "value": "Find a new perspective."
                      },
                      {
                        "type": "text",
                        "value": "Take a notebook, follow an unfamiliar street, and collect three interesting details."
                      },
                      {
                        "type": "badge",
                        "value": "No rush",
                        "color": "success"
                      }
                    ]
                  },
                  {
                    "type": "tab-panel",
                    "id": "day2",
                    "label": "Sunday",
                    "children": [
                      {
                        "type": "title",
                        "level": 2,
                        "value": "Make something from it."
                      },
                      {
                        "type": "text",
                        "value": "Turn one of your observations into a small sketch or story."
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "quiz",
          "label": "QUIZ",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "quiz",
                "title": "A quick design check",
                "questions": [
                  {
                    "id": "one",
                    "kind": "single",
                    "prompt": "What helps readers spot the main idea?",
                    "choices": [
                      {
                        "id": "hierarchy",
                        "label": "A clear visual hierarchy"
                      },
                      {
                        "id": "noise",
                        "label": "More competing details"
                      }
                    ],
                    "correct": [
                      "hierarchy"
                    ],
                    "explanation": "Hierarchy creates a path through the content."
                  }
                ]
              }
            ]
          }
        }
      ],
      [
        {
          "id": "menu",
          "label": "RESTAURANT MENU",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "restaurant-menu",
                "title": "The little studio café",
                "description": "An original, fictional menu.",
                "currency": "USD",
                "sections": [
                  {
                    "id": "morning",
                    "title": "A good start",
                    "items": [
                      {
                        "id": "toast",
                        "name": "Herb & garden toast",
                        "description": "Bright greens, warm sourdough.",
                        "price": 8.5,
                        "tags": [
                          "Plant-based"
                        ],
                        "status": "available"
                      },
                      {
                        "id": "bowl",
                        "name": "Seasonal grain bowl",
                        "description": "Roasted vegetables, lemon dressing.",
                        "price": 12,
                        "tags": [
                          "Seasonal"
                        ],
                        "status": "available"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "code",
          "label": "CODE",
          "tone": "",
          "document": {
            "version": "iui/1",
            "state": {},
            "body": [
              {
                "type": "code",
                "language": "json",
                "value": "{ \"version\": \"iui/1\",\n  \"body\": [{ \"type\": \"text\",\n    \"value\": \"Make it yours.\" }]\n}",
                "copy": true,
                "highlight": true
              }
            ]
          }
        }
      ]
    ]
  }
];
