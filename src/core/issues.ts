// Issue codes, Vietnamese messages and the copy-back report (docs/FORMAT.md §5).

export const ISSUE_TEXT = {
  E_NO_BLOCKS: ['Không tìm thấy câu hỏi nào.', 'Mỗi câu hỏi phải bắt đầu bằng dòng "--- dạng", ví dụ "--- mcq".'],
  E_UNKNOWN_TYPE: ['Dạng câu hỏi không hợp lệ.', 'Dùng một trong các dạng: mcq, tf, short, cloze, match, order, group, essay, flash, note.'],
  E_EMPTY_PROMPT: ['Câu hỏi chưa có nội dung.', 'Viết nội dung câu hỏi ngay dưới dòng "---".'],
  E_MCQ_OPTIONS: ['Câu trắc nghiệm cần ít nhất 2 phương án và ít nhất 1 phương án đúng.', 'Thêm dấu + trước phương án đúng, dấu - trước phương án sai.'],
  E_TF_ITEMS: ['Câu đúng/sai cần từ 2 đến 8 mệnh đề.', 'Viết mỗi mệnh đề trên một dòng, bắt đầu bằng + (đúng) hoặc - (sai).'],
  E_SHORT_ANSWER: ['Câu trả lời ngắn chưa có đáp án.', 'Thêm ít nhất một dòng "= đáp án".'],
  E_CLOZE_BLANK: ['Câu điền khuyết chưa có chỗ trống hợp lệ.', 'Đặt đáp án trong {{ }}, ví dụ {{quang hợp}}.'],
  E_MATCH_PAIRS: ['Câu nối cột cần ít nhất 2 cặp.', 'Viết mỗi cặp trên một dòng dạng "vế trái :: vế phải".'],
  E_ORDER_ITEMS: ['Câu sắp xếp cần ít nhất 2 mục.', 'Liệt kê các mục bằng dòng "- " theo đúng thứ tự.'],
  E_GROUPS: ['Câu phân loại cần ít nhất 2 nhóm, mỗi nhóm có ít nhất 1 mục.', 'Viết tên nhóm dạng [Tên nhóm], các mục là dòng "- " bên dưới.'],
  E_SEPARATOR: ['Thiếu dòng >>> hoặc phần dưới >>> đang trống.', 'Đặt dòng >>> giữa câu hỏi và bài làm mẫu (hoặc mặt sau của thẻ).'],
  E_MATH: ['Công thức toán chưa cân bằng dấu $ hoặc ngoặc { }.', 'Kiểm tra mỗi công thức mở và đóng bằng $, ngoặc { } đủ cặp.'],
  W_NO_EXPLAIN: ['Một số câu chưa có giải thích.', 'Thêm dòng "?? giải thích" để người học hiểu vì sao.'],
  W_DUP_OPTION: ['Có phương án bị trùng.', 'Sửa để các phương án khác nhau.'],
  W_ALL_CORRECT: ['Tất cả phương án đều đúng.', 'Thêm phương án sai bằng dấu -.'],
  W_MCQ_MANY_OPTIONS: ['Câu trắc nghiệm có hơn 6 phương án.', 'Giữ 4–6 phương án.'],
  W_ESSAY_NO_KEYWORD: ['Bài làm mẫu chưa có từ khóa.', 'Bọc các từ khóa quan trọng bằng [[ ]].'],
  W_UNKNOWN_META: ['Dòng @ không hợp lệ.', 'Dùng @desc, @subject, @grade, @mode (practice|test), @time (số phút), @shuffle (yes|no).'],
  W_UNKNOWN_ATTR: ['Thuộc tính không hợp lệ trên dòng ---.', 'Dùng shuffle=no, points=2, tol=0.01, loose, bank.'],
  W_FENCE_STRIPPED: ['Đã lấy nội dung trong khối code.', ''],
  W_PREAMBLE: ['Đã bỏ qua lời dẫn ở đầu.', ''],
  W_ALIAS: ['Tên dạng được viết theo cách khác.', 'Dùng tên chuẩn: mcq, tf, short, cloze, match, order, group, essay, flash, note.'],
  W_ITEM_STYLE: ['Phương án được viết theo cách khác.', 'Dùng + cho phương án đúng, - cho phương án sai, không ghi A, B, C.'],
} as const satisfies Record<string, readonly [string, string]>

export type IssueCode = keyof typeof ISSUE_TEXT

export interface Issue {
  code: IssueCode
  /** 1-based line in the original text (0 = whole document). */
  line: number
  message_vi: string
  fix_vi: string
}

export function makeIssue(code: IssueCode, line: number, detail?: string): Issue {
  const [msg, fix] = ISSUE_TEXT[code]
  return { code, line, message_vi: detail ? `${msg} ${detail}` : msg, fix_vi: fix }
}

export const isError = (i: Issue): boolean => i.code.startsWith('E_')
export const hasErrors = (issues: Issue[]): boolean => issues.some(isError)

/** Lenient fixes the app already applied; not worth sending back to the AI. */
const SILENT: IssueCode[] = ['W_FENCE_STRIPPED', 'W_PREAMBLE', 'W_ALIAS', 'W_ITEM_STYLE', 'W_NO_EXPLAIN']

/** Text the user copies back to their AI. Contains errors, or the meaningful warnings when there are no errors. */
export function issuesReport(issues: Issue[], source: string): string {
  const errors = issues.filter(isError)
  const picked = errors.length ? errors : issues.filter((i) => !SILENT.includes(i.code))
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const head =
    'ciinder không đọc được một số chỗ trong bộ câu hỏi. Hãy sửa các lỗi sau rồi xuất lại TOÀN BỘ theo đúng hướng dẫn định dạng ciinder:'
  const body = picked.map((i) => {
    const where = i.line > 0 ? `Dòng ${i.line}` : 'Toàn bộ'
    const text = i.line > 0 ? (lines[i.line - 1] ?? '').trim() : ''
    const ctx = text ? ` (${text.length > 40 ? text.slice(0, 40) + '…' : text})` : ''
    return `- ${where}${ctx}: ${i.message_vi}${i.fix_vi ? ' ' + i.fix_vi : ''}`
  })
  return [head, ...body].join('\n')
}
