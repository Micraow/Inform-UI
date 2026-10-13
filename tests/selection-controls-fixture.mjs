/** Small original fixture shared by native-control presentation checks. */
export const roxInitial = {
  version: 'rox-roca-2016-arithmetic', spo2Percent: 95, fio2: 50,
  fio2Unit: 'percent', respiratoryRate: 20, measuredHours: 2,
  comparisonVersion: 'roca-2019-pneumonia-hfnc', studyContextConfirmed: true
};
export function selectionControlsDocument(theme = 'light') {
  return {
    version: 'iui/1', theme,
    state: { choice: 'one', accepted: false, enabled: true, title: 'Original draft', notes: 'Two lines\nof notes', filter: 'north', locked: false, frozen: false, mode: 'brief', score: 3, volume: 4 },
    body: [
      { type: 'form', label: 'Selection controls', children: [
        { type: 'input', kind: 'text', label: 'Draft title', bind: 'title', required: true, hint: 'A local draft only.' },
        { type: 'textarea', label: 'Draft notes', bind: 'notes' },
        { type: 'radio', label: 'Delivery choice', bind: 'choice', options: [
          { label: 'First choice', value: 'one' }, { label: 'Second choice', value: 'two' },
          { label: 'Unavailable choice', value: 'three', disabled: true }
        ] },
        { type: 'input', kind: 'checkbox', label: 'Accept this local choice', bind: 'accepted', hint: 'Space toggles this choice.' },
        { type: 'field', label: 'Inherited lock', disabled: { $: 'locked' }, children: [
          { type: 'input', kind: 'checkbox', label: 'Inherited checkbox', bind: 'frozen' }
        ] }
      ] },
      { type: 'select', label: 'Region filter', bind: 'filter', options: [
        { label: 'North', value: 'north' }, { label: 'South', value: 'south' }
      ] },
      { type: 'toggle', label: 'Keep local preference', bind: 'enabled' },
      { type: 'onboarding-selection', label: 'Topic choices', options: [
        { id: 'one', label: 'Original topic', description: 'A wrapped description that stays beside its indicator.' },
        { id: 'two', label: 'Another original topic' }
      ] },
      { type: 'calculator-rox-index-for-high-flow-nasal-cannula', label: 'Supplied ratio example', initial: roxInitial },
      { type: 'calculator-glasgow-coma-scale-gcs', label: 'Supplied rating example', resultMode: 'live', initial: { version: 'gcs-six-motor-levels', population: 'adult', eye: 4, verbal: 5, motor: 6 }, fields: { eye: { label: 'Eye rating choices', variant: 'segmented' } } },
      { type: 'segmented', label: 'Separate pill presentation', bind: 'mode', options: [
        { label: 'Brief', value: 'brief' }, { label: 'Detailed', value: 'detailed' }
      ] },
      { type: 'rating', label: 'Separate star presentation', bind: 'score' },
      { type: 'slider', label: 'Separate range presentation', bind: 'volume', min: 0, max: 10, step: 1 }
    ]
  };
}
