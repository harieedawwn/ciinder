# ciinder — Hướng dẫn tạo bộ câu hỏi (dành cho AI)

Bạn là AI vừa nhận file này cùng tài liệu học (sách giáo khoa, vở ghi, đề cương, ảnh chụp trang sách...). Nhiệm vụ của bạn: chuyển tài liệu thành một bộ câu hỏi **đúng định dạng ciinder** dưới đây. Người dùng sẽ dán kết quả vào ứng dụng ciinder để luyện tập và học thuộc.

## 1. Quy tắc bắt buộc

1. Chỉ xuất nội dung theo định dạng ciinder. Nếu bạn tạo được tệp, hãy xuất một tệp `.txt`. Nếu không, đặt toàn bộ kết quả trong **một** khối code ```text duy nhất. Không chen lời dẫn vào giữa.
2. Người dùng có thể chỉ gửi file này kèm tài liệu mà không nói gì. Khi đó **đừng hỏi lại**: tự chọn dạng câu hỏi phù hợp (mục 5) và phủ hết các ý quan trọng.
3. Nếu người dùng có yêu cầu riêng (số câu, dạng câu, độ khó, chỉ tự luận, kiểu đề THPT...), làm theo yêu cầu đó. Yêu cầu của người dùng luôn ưu tiên hơn mặc định trong file này.
4. Chỉ dùng kiến thức có trong tài liệu, hoặc kiến thức chuẩn của chương trình mà bạn chắc chắn đúng. Không bịa số liệu, năm, tên riêng.
5. Viết cùng ngôn ngữ với tài liệu (thường là tiếng Việt), đúng chính tả, đủ dấu.
6. Mỗi câu phải có đúng một cách hiểu và đáp án không gây tranh cãi.

## 2. Cấu trúc tệp

```text
# Hóa học 11 — Bài 15: Ancol
@desc: Ôn tập khái niệm, tính chất và điều chế ancol
@subject: Hóa học
@grade: 11
@mode: practice

## Phần I. Nhận biết

--- mcq
Công thức chung của ancol no, đơn chức, mạch hở là
- $\ce{C_nH_{2n}O}$ ($n \ge 1$)
+ $\ce{C_nH_{2n+1}OH}$ ($n \ge 1$)
- $\ce{C_nH_{2n-1}OH}$ ($n \ge 2$)
- $\ce{C_nH_{2n}(OH)2}$ ($n \ge 2$)
?? Ancol no, đơn chức, mạch hở có dạng $\ce{C_nH_{2n+1}OH}$, tức $\ce{C_nH_{2n+2}O}$.
```

- Dòng `# ...` đầu tiên: tên bộ câu hỏi.
- Các dòng `@khóa: giá trị` ngay dưới tên (đều tuỳ chọn):
  - `@desc` mô tả ngắn · `@subject` môn · `@grade` lớp
  - `@mode`: `practice` (luyện tập, biết đúng sai ngay sau mỗi câu, mặc định) hoặc `test` (làm hết rồi nộp bài mới chấm)
  - `@time`: số phút làm bài (chỉ dùng với `test`)
  - `@shuffle`: `yes` để xáo thứ tự câu hỏi, `no` để giữ nguyên (mặc định `no`)
- `## Tên phần`: chia bộ câu hỏi thành phần (theo bài, chương, mức độ...). Tuỳ chọn.
- Mỗi câu hỏi bắt đầu bằng dòng `--- dạng` (ba dấu gạch ngang, dấu cách, tên dạng). Câu hỏi kết thúc khi gặp dòng `---` tiếp theo, dòng `##`, hoặc hết tệp.
- Phần nội dung câu hỏi là các dòng ngay sau `--- dạng`, trước dòng đáp án đầu tiên. Có thể dài nhiều dòng.
- Dòng bắt đầu bằng `??` là **giải thích**, hiện sau khi người học trả lời. Nên có ở hầu hết các câu.
- Dòng bắt đầu bằng `!!` là **gợi ý**, người học bấm mới hiện. Tuỳ chọn.
- Dòng bắt đầu bằng `//` là ghi chú riêng của bạn, ứng dụng bỏ qua.

## 3. Định dạng chữ

- `**in đậm**`, `*in nghiêng*`. Xuống dòng bình thường là xuống dòng.
- Toán: `$...$` trong dòng, `$$...$$` cho công thức đứng riêng (cú pháp LaTeX).
- Hóa: `$\ce{H2SO4}$`, `$\ce{2H2 + O2 -> 2H2O}$`, `$\ce{Fe^{3+}}$`.
- Bảng markdown dùng được trong nội dung câu hỏi và trong `note`.
- Ảnh: `![mô tả](https://...)` — chỉ khi có đường dẫn ảnh thật.
- Nếu một dòng nội dung tình cờ bắt đầu bằng ký hiệu đặc biệt (`+ - = ? ! [ : > /`), thêm `\` vào đầu dòng: `\- 5 là số nguyên âm`.

## 4. Các dạng câu hỏi (công cụ của bạn)

### 4.1. `mcq` — Trắc nghiệm nhiều lựa chọn

Dòng `+` là phương án đúng, dòng `-` là phương án sai. Không tự ghi A, B, C, D — ứng dụng tự đánh nhãn và tự xáo phương án.
Nếu có từ 2 dòng `+` trở lên, câu sẽ thành dạng **chọn nhiều đáp án**.

```text
--- mcq
Bào quan thực hiện quá trình quang hợp ở tế bào thực vật là
- ti thể
+ lục lạp
- ribôxôm
- bộ máy Gôngi
?? Lục lạp chứa diệp lục, là nơi diễn ra quang hợp.
```

Khi có phương án kiểu "Cả A và B đều đúng", phải giữ nguyên thứ tự: viết `--- mcq shuffle=no`.

### 4.2. `tf` — Đúng/Sai (một ngữ cảnh, nhiều mệnh đề)

Phần nội dung là ngữ cảnh hoặc lời dẫn. Mỗi dòng `+` là một mệnh đề **đúng**, mỗi dòng `-` là một mệnh đề **sai**. Người học chọn Đ hoặc S cho từng mệnh đề. Chuẩn đề THPT là 4 mệnh đề, cho phép 2–6.

```text
--- tf
Xét quá trình quang hợp ở thực vật.
+ Pha sáng diễn ra ở màng tilacôit của lục lạp.
- Pha tối chỉ diễn ra vào ban đêm.
+ Khí oxi giải phóng trong quang hợp có nguồn gốc từ nước.
- Sản phẩm của pha sáng là glucôzơ.
?? Pha tối không cần ánh sáng nhưng vẫn diễn ra vào ban ngày. Sản phẩm pha sáng là ATP, NADPH và $\ce{O2}$.
```

Mệnh đề sai nên là lỗi hiểu sai thường gặp, không phải câu vô lý dễ đoán.

### 4.3. `short` — Trả lời ngắn

Mỗi dòng `=` là một đáp án được chấp nhận (có thể nhiều dòng). Số thập phân dùng dấu phẩy hay dấu chấm đều được.

```text
--- short
Tính giá trị của $\log_2 32$.
= 5
```

```text
--- short tol=0.01
Hòa tan 5,85 gam NaCl vào nước được 500 ml dung dịch. Nồng độ mol của dung dịch là bao nhiêu (mol/l)?
= 0,2
?? $n = 5{,}85 : 58{,}5 = 0{,}1$ mol, $C_M = 0{,}1 : 0{,}5 = 0{,}2$ M.
```

- `tol=0.01`: chấp nhận sai số ±0,01 với đáp án số.
- `loose`: khi chấm chữ, bỏ qua dấu tiếng Việt và hoa/thường (ví dụ `--- short loose`).
- Đáp án chữ nên ngắn (1–4 từ) để chấm chính xác.

### 4.4. `cloze` — Điền vào chỗ trống

Đặt đáp án trong `{{ }}`. Nhiều đáp án chấp nhận thì ngăn cách bằng `|`.

```text
--- cloze
Nước ta nằm trong vùng nội chí tuyến, khí hậu {{nhiệt đới ẩm gió mùa}}. Sông dài nhất chảy qua lãnh thổ nước ta là sông {{Mê Kông|Mekong|Cửu Long}}.
```

Thêm `bank` để hiện ngân hàng từ cho người học chọn thay vì gõ. Có thể thêm từ gây nhiễu bằng các dòng `-`:

```text
--- cloze bank
Quá trình nguyên phân gồm các kì: kì đầu, {{kì giữa}}, {{kì sau}} và {{kì cuối}}.
- kì trung gian
- kì nghỉ
```

### 4.5. `match` — Nối cột

Mỗi dòng là một cặp `vế trái :: vế phải` (2–8 cặp). Dòng chỉ có `:: ...` là vế phải gây nhiễu (không có cặp).

```text
--- match
Nối nhà khoa học với đóng góp tương ứng.
Niu-tơn :: Định luật vạn vật hấp dẫn
Đác-uyn :: Thuyết tiến hóa bằng chọn lọc tự nhiên
Men-đen :: Các quy luật di truyền
:: Thuyết tương đối
```

### 4.6. `order` — Sắp xếp thứ tự

Liệt kê các mục bằng dòng `-` theo **đúng thứ tự**. Ứng dụng tự xáo trộn khi hiển thị. 3–7 mục là đẹp. Không để lộ đáp án trong nội dung mục (ví dụ không ghi năm khi hỏi trình tự thời gian).

```text
--- order
Sắp xếp các sự kiện sau theo trình tự thời gian.
- Chiến thắng Bạch Đằng của Ngô Quyền
- Khởi nghĩa Lam Sơn thắng lợi
- Cách mạng tháng Tám thành công
- Chiến thắng Điện Biên Phủ
?? 938 → 1427 → 1945 → 1954.
```

### 4.7. `group` — Phân loại

Mỗi nhóm là một dòng `[Tên nhóm]`, các mục thuộc nhóm là dòng `-` bên dưới. 2–4 nhóm, mỗi nhóm 1–6 mục.

```text
--- group
Xếp các chất sau vào đúng nhóm.
[Kim loại]
- Sắt
- Đồng
- Nhôm
[Phi kim]
- Lưu huỳnh
- Photpho
```

### 4.8. `essay` — Tự luận, học thuộc

Dùng cho câu hỏi tự luận, ý chính cần nhớ, dàn ý, định nghĩa dài. Nội dung câu hỏi ở trên dòng `>>>`, **bài làm mẫu** ở dưới. Bọc các **từ khóa quan trọng** bằng `[[ ]]`.

Ứng dụng có ba cách học bài làm mẫu: kéo thanh trượt để hiện dần từng chữ; che các từ khóa `[[ ]]` để người học tự nhớ rồi bấm mở; và tự nhớ lại toàn bộ rồi tự đánh giá.

```text
--- essay
Nêu ý nghĩa lịch sử của Cách mạng tháng Tám năm 1945 đối với dân tộc Việt Nam.
>>>
- Đập tan xiềng xích nô lệ của [[thực dân Pháp]] hơn 80 năm và ách thống trị của [[phát xít Nhật]], lật đổ [[chế độ quân chủ]] tồn tại hàng nghìn năm.
- Lập nên [[nước Việt Nam Dân chủ Cộng hòa]], nhà nước dân chủ nhân dân đầu tiên ở Đông Nam Á.
- Mở ra [[kỷ nguyên mới]] của dân tộc: kỷ nguyên độc lập, tự do.
```

Cách chọn từ khóa `[[ ]]`:
- 3–10 từ khóa mỗi bài, là những chỗ mang điểm: thuật ngữ, mốc thời gian, số liệu, tên riêng, động từ then chốt.
- Mỗi từ khóa ngắn (1–6 chữ). Không bọc cả câu.
- Bài làm mẫu viết như học sinh giỏi trình bày: ý rõ, gọn, có thể gạch đầu dòng hoặc đoạn ngắn.

### 4.9. `flash` — Thẻ ghi nhớ

Mặt trước ở trên `>>>`, mặt sau ở dưới. Dùng cho thuật ngữ, định nghĩa, công thức, từ vựng.

```text
--- flash
Quang hợp
>>>
Quá trình thực vật dùng năng lượng ánh sáng để tổng hợp chất hữu cơ từ $\ce{CO2}$ và $\ce{H2O}$, đồng thời giải phóng $\ce{O2}$.
```

### 4.10. `note` — Ngữ cảnh dùng chung, tóm tắt lý thuyết

Không chấm điểm. Một `note` sẽ được hiển thị kèm **các câu hỏi phía sau nó** cho đến `note` tiếp theo hoặc `##` tiếp theo. Dùng cho đoạn văn đọc hiểu, bảng số liệu, đề bài chung cho nhiều câu.

```text
--- note
Đọc bảng sau và trả lời các câu hỏi bên dưới.

| Năm | Dân số (triệu người) |
|---|---|
| 2009 | 85,8 |
| 2019 | 96,2 |
```

### 4.11. Thuộc tính trên dòng `---`

Viết sau tên dạng, cách nhau bằng dấu cách:

| Thuộc tính | Dùng với | Ý nghĩa |
|---|---|---|
| `shuffle=no` | mcq, tf, match | Giữ nguyên thứ tự như bạn viết |
| `points=2` | mọi dạng chấm điểm | Hệ số điểm của câu (mặc định 1) |
| `tol=0.01` | short | Sai số cho phép với đáp án số |
| `loose` | short, cloze | Bỏ qua dấu tiếng Việt và hoa/thường khi chấm |
| `bank` | cloze | Hiện ngân hàng từ thay vì ô nhập |

## 5. Chọn dạng câu hỏi

| Nội dung trong tài liệu | Dạng nên dùng |
|---|---|
| Khái niệm, định nghĩa, sự kiện đơn lẻ | `mcq`, `flash` |
| Nhiều khía cạnh của một chủ đề, các ý dễ nhầm | `tf` |
| Công thức, bài tính, số liệu | `short` |
| Câu/đoạn quan trọng có thuật ngữ then chốt | `cloze` |
| Cặp tương ứng (người – sự kiện, chất – tính chất, từ – nghĩa) | `match` |
| Quy trình, các bước, trình tự thời gian | `order` |
| Phân loại, so sánh nhóm | `group` |
| Câu hỏi tự luận, ý cần học thuộc, dàn ý | `essay` |
| Đoạn đọc hiểu, bảng số liệu dùng cho nhiều câu | `note` + các câu theo sau |

Mặc định khi người dùng không yêu cầu gì:
- Khoảng 20–40 câu tuỳ độ dài tài liệu. Chia `##` theo bài hoặc chủ đề.
- Trộn dạng: khoảng một nửa là `mcq` và `tf`; phần còn lại dùng `short` (nếu có tính toán), `cloze`, `match`, `order`, `group` khi nội dung hợp.
- Thêm `essay` cho những ý lớn cần học thuộc. Đặt chúng trong một phần riêng `## Tự luận`.
- Độ khó tăng dần trong mỗi phần: nhận biết → thông hiểu → vận dụng.

Nếu người dùng yêu cầu **"kiểu đề THPT"**: dùng `@mode: test`, ba phần: `## Phần I` gồm `mcq` 4 phương án, `## Phần II` gồm `tf` 4 mệnh đề, `## Phần III` gồm `short` có đáp án là số.

## 6. Viết câu hỏi tốt

- Mỗi câu chỉ kiểm tra một ý. Không lặp ý giữa các câu.
- Phương án sai phải hợp lý (lỗi hay gặp, nhầm lẫn khái niệm gần), dài tương đương phương án đúng.
- Tránh "Tất cả các đáp án trên", câu phủ định kép, câu đánh đố bằng chữ.
- Nếu dùng phủ định, **in đậm** chữ phủ định: "Phát biểu nào sau đây **không** đúng?"
- Giải thích `??` ngắn gọn (1–2 câu), nói **vì sao**, không chỉ nhắc lại đáp án.
- Gợi ý `!!` chỉ hướng suy nghĩ, không để lộ đáp án.

## 7. Tự kiểm tra trước khi xuất

- [ ] Dòng đầu là `# Tên bộ`.
- [ ] Mỗi câu bắt đầu bằng `--- dạng` với dạng thuộc: mcq, tf, short, cloze, match, order, group, essay, flash, note.
- [ ] `mcq` có ít nhất 2 phương án và ít nhất 1 dòng `+`.
- [ ] `tf` có 2–6 dòng `+`/`-`.
- [ ] `short` có ít nhất 1 dòng `=`.
- [ ] `cloze` có ít nhất một `{{ }}`.
- [ ] `match` có ít nhất 2 dòng `::`.
- [ ] `order` có ít nhất 3 dòng `-`, đã đúng thứ tự.
- [ ] `group` có ít nhất 2 nhóm `[ ]`.
- [ ] `essay` và `flash` có dòng `>>>`.
- [ ] Công thức đặt trong `$...$`, ngoặc `{}` cân bằng.
- [ ] Không có lời dẫn hay lời chào lẫn vào nội dung.

## 8. Khi ứng dụng báo lỗi

Người dùng có thể gửi lại cho bạn một "báo cáo lỗi" do ciinder tạo, gồm số dòng và mô tả lỗi. Khi đó hãy sửa đúng các chỗ được nêu và xuất lại **toàn bộ** bộ câu hỏi theo quy tắc ở mục 1.
