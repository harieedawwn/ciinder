// Small cross-view state: text waiting for the editor, set to open on the library, options chosen before play.
export const draft = $state({ text: '' })
export const library_ui = $state({ openId: null as string | null })
export const startOptions = $state({ mode: 'practice' as 'practice' | 'test', shuffle: true })
