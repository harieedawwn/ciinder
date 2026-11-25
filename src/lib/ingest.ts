// Route freshly obtained text (file, drop, clipboard) to the right place: JSON → library, text → editor draft.
import { jsonSources } from '../core/importjson'
import { importBackup } from '../state/backup.svelte'
import { parse } from '../core/parse'
import { hasErrors } from '../core/issues'
import { saveSet } from '../state/library.svelte'
import { go } from '../state/router.svelte'
import { draft } from '../state/session.svelte'
import { toast } from '../ui/toast.svelte'
import { pickFile, readClipboard, readFileText } from './clipboard'

/** Returns the text to place in the editor, or null when the text was JSON and has been saved. */
export async function ingestText(text: string): Promise<string | null> {
  const sources = jsonSources(text)
  if (sources === null) return text
  const merged = await importBackup(text)
  if (merged !== null) {
    toast(merged ? `Đã khôi phục ${merged} bộ câu hỏi` : 'Không có bộ nào mới để khôi phục')
    go('/')
    return null
  }
  const good = sources.filter((s) => !hasErrors(parse(s).issues))
  if (!good.length) {
    toast('Tệp JSON không có bộ câu hỏi đọc được. Hãy dùng tệp nội dung hoặc bản sao lưu của ciinder.')
    return null
  }

  for (const s of good) await saveSet(s)
  toast(good.length === 1 ? 'Đã thêm bộ câu hỏi vào thư viện' : `Đã thêm ${good.length} bộ câu hỏi vào thư viện`)
  go('/')
  return null
}

export async function openFileInto(file: File | null): Promise<string | null> {
  if (!file) return null
  if (file.size > 3_000_000) {
    toast('Tệp quá lớn. Hãy chọn tệp dưới 3 MB.')
    return null
  }
  return ingestText(await readFileText(file))
}

/** From the library: pick a file, then open the editor with it. */
export async function startWithFile(file?: File | null): Promise<void> {
  const text = await openFileInto(file === undefined ? await pickFile() : file)
  if (text !== null) {
    draft.text = text
    go('/new')
  }
}

export async function startWithClipboard(): Promise<void> {
  const text = await readClipboard()
  if (text) {
    const t = await ingestText(text)
    if (t !== null) draft.text = t
    else return
  } else toast('Không đọc được bộ nhớ tạm. Hãy nhấn giữ trong ô rồi chọn Dán.')
  go('/new')
}
