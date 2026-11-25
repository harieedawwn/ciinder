import type { Issue } from './types'

type Text = (a?: string) => string
const T = (s: string): Text => (a) => s.replace('%', a ?? '')

const TABLE: Record<string, { msg: Text; fix: Text }> = {
  E_NO_BLOCKS: { msg: T('Không tìm thấy câu hỏi nào.'), fix: T('Mỗi câu bắt đầu bằng một dòng như "--- mcq".') },
  E_UNKNOWN_TYPE: { msg: T('Dạng câu hỏi "%" không tồn tại.'), fix: T('Dùng một trong: mcq, tf, short, cloze, match, order, group, essay, flash, note.') },
  E_EMPTY_PROMPT: { msg: T('Câu hỏi chưa có nội dung.'), fix: T('Viết nội dung câu hỏi ngay dưới dòng "---".') },
  E_MCQ_OPTIONS: { msg: T('Câu trắc nghiệm chưa đủ phương án hoặc chưa có phương án đúng.'), fix: T('Cần ít nhất 2 phương án, thêm dấu + trước phương án đúng và dấu - trước phương án sai.') },
  E_TF_ITEMS: { msg: T('Câu đúng/sai cần từ 2 đến 8 mệnh đề.'), fix: T('Mỗi mệnh đề một dòng, bắt đầu bằng + (đúng) hoặc - (sai).') },
  E_SHORT_ANSWER: { msg: T('Câu trả lời ngắn chưa có đáp án.'), fix: T('Thêm dòng "= đáp án".') },
  E_CLOZE_BLANK: { msg: T('Câu điền chỗ trống chưa có ô trống hợp lệ.'), fix: T('Đặt đáp án trong {{ }}, ví dụ {{quang hợp}}; không để ô trống rỗng.') },
  E_MATCH_PAIRS: { msg: T('Câu nối cột cần ít nhất 2 cặp.'), fix: T('Mỗi cặp một dòng: "vế trái :: vế phải".') },
  E_ORDER_ITEMS: { msg: T('Câu sắp xếp cần ít nhất 2 mục.'), fix: T('Liệt kê các mục bằng dòng "-" theo đúng thứ tự.') },
  E_GROUPS: { msg: T('Câu phân loại cần ít nhất 2 nhóm, mỗi nhóm có mục.'), fix: T('Viết tên nhóm trong [ ] rồi các mục bằng dòng "-" bên dưới.') },
  E_SEPARATOR: { msg: T('Thiếu dòng ">>>" hoặc phần sau ">>>" trống.'), fix: T('Đặt ">>>" trên một dòng riêng, nội dung câu trả lời bên dưới.') },
  E_MATH: { msg: T('Công thức toán bị thiếu dấu $ hoặc ngoặc { } không cân.'), fix: T('Kiểm tra lại các cặp $...$ và ngoặc nhọn trong công thức.') },
  W_NO_EXPLAIN: { msg: T('% câu chưa có giải thích (??).'), fix: T('Nên thêm dòng "?? giải thích".') },
  W_DUP_OPTION: { msg: T('Có phương án trùng nhau.'), fix: T('Sửa hoặc xóa phương án trùng.') },
  W_ALL_CORRECT: { msg: T('Tất cả phương án đều đúng.'), fix: T('Thêm phương án sai.') },
  W_MCQ_MANY_OPTIONS: { msg: T('Câu có hơn 6 phương án.'), fix: T('Rút gọn còn tối đa 6 phương án.') },
  W_ESSAY_NO_KEYWORD: { msg: T('Bài tự luận chưa có từ khóa [[ ]].'), fix: T('Bọc các từ khóa quan trọng bằng [[ ]].') },
  W_UNKNOWN_META: { msg: T('Thông tin "@%" không được hỗ trợ.'), fix: T('Dùng: desc, subject, grade, mode, time, shuffle.') },
  W_UNKNOWN_ATTR: { msg: T('Thuộc tính "%" không được hỗ trợ.'), fix: T('Bỏ hoặc sửa thuộc tính này.') },
  W_ALIAS: { msg: T('Tên dạng "%" được hiểu theo tên chuẩn.'), fix: T('Nên dùng tên chuẩn.') },
  W_ITEM_STYLE: { msg: T('Cách ghi phương án không chuẩn, đã tự hiểu.'), fix: T('Nên dùng + và - đầu dòng.') },
  W_FENCE_STRIPPED: { msg: T('Đã bỏ khung code ``` bao quanh.'), fix: T('Không cần bọc kết quả trong khối code.') },
  W_PREAMBLE: { msg: T('Đã bỏ phần lời dẫn trước bộ câu hỏi.'), fix: T('Chỉ xuất nội dung theo định dạng ciinder.') },
}

export function makeIssue(code: string, line: number, arg?: string): Issue {
  const e = TABLE[code]
  return {
    code,
    severity: code.startsWith('E_') ? 'error' : 'warn',
    line,
    message_vi: e.msg(arg),
    fix_vi: e.fix(arg),
  }
}

/** Text the user copies back to their AI (docs/FORMAT.md §5). Only errors are listed. */
export function issuesReport(issues: Issue[], source: string): string {
  const errors = issues.filter((i) => i.severity === 'error')
  if (!errors.length) return ''
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const rows = errors.map((i) => {
    const raw = i.line > 0 ? (lines[i.line - 1] ?? '').trim() : ''
    const where = raw.startsWith('---') ? ` (${raw.slice(0, 40)})` : ''
    const at = i.line > 0 ? `Dòng ${i.line}${where}: ` : ''
    return `- ${at}${i.message_vi} ${i.fix_vi}`
  })
  return (
    'ciinder không đọc được một số chỗ trong bộ câu hỏi. Hãy sửa các lỗi sau rồi xuất lại TOÀN BỘ theo đúng hướng dẫn định dạng ciinder:\n' +
    rows.join('\n')
  )
}
