// Small cross-view state: text waiting for the editor, set to open on the library, options chosen before play.
export const draft = $state({ text: '' })
export const library_ui = $state({ openId: null as string | null })
export type EssayMode = 'read' | 'mask' | 'recall'
/** Essay study mode, kept while moving between cards. */
export const essayMode = $state({ mode: 'read' as EssayMode })
/** `fresh` starts a new attempt instead of resuming; `only` limits it to these item ids (Làm lại câu sai); `study` plays only essay + flash, not-yet-mastered first. */
export const startOptions = $state({ mode: 'practice' as 'practice' | 'test', shuffle: true, mixOptions: true, pick: null as string[] | null, fresh: false, only: null as string[] | null, study: false })
