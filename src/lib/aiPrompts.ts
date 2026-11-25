// Ready-made messages the user sends to their AI together with ciinder-guide.md (shown in the Guide sheet).
// Keep in sync with public/ciinder-guide.md §0 (the AI-side rules for these three ways of working).

export interface AiPrompt { id: 'plan' | 'quick' | 'convert'; name: string; text: string }

export const AI_PROMPTS: AiPrompt[] = [
  {
    id: 'plan',
    name: 'Lên kế hoạch trước',
    text: `Mình gửi kèm file ciinder-guide.md và tài liệu học. Hãy làm theo CHẾ ĐỘ LÊN KẾ HOẠCH trong file hướng dẫn:
chưa tạo câu hỏi vội, trước tiên tóm tắt tài liệu, đề xuất kế hoạch (các phần, dạng câu hỏi, số câu) và hỏi mình những điểm cần duyệt. Mình trả lời xong thì mới tạo bộ câu hỏi.`,
  },
  {
    id: 'quick',
    name: 'Làm ngay',
    text: `Tạo bộ câu hỏi từ tài liệu mình gửi, đúng định dạng trong file ciinder-guide.md. Không cần hỏi lại.`,
  },
  {
    id: 'convert',
    name: 'Chuyển đề có sẵn',
    text: `Chuyển đề / câu hỏi có sẵn mình gửi sang định dạng ciinder theo CHẾ ĐỘ CHUYỂN ĐỔI trong file ciinder-guide.md:
giữ nguyên câu hỏi, phương án, đáp án và thứ tự; không thêm, không bớt câu.`,
  },
]
