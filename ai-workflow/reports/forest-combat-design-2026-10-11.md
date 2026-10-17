# Thiết kế combat Rừng Thanh Trúc — 2026-10-11

**Trạng thái: chờ người dùng chọn mockup A–E. Combat/lượt đánh chưa được tích hợp.**

Đã xác minh `forest` trong scene 1 có Mộc Yêu non (`wood-yao`) và Bào Tử Yêu (`spore-yao`); tương tác hiện là `talk.monster`, chưa có battle simulation. Runtime React/TypeScript/Canvas 2D, không dùng Phaser.

## Đã giao ở giai đoạn thiết kế

- `mockups/forest-combat/A.png` đến `E.png`: 5 bố cục cùng Bright Handheld, HUD/nút/chữ thật, kèm thẻ đầy lượt, hết lượt và kết quả/quay về. Nguồn HTML/CSS và renderer offline cùng thư mục.
- Cảnh concept mới bằng built-in ImageGen có B làm style reference; `prompt.json` giữ đầy đủ prompt. Không đưa ảnh concept có hero/quái nhúng vào runtime hoặc đánh dấu production-reviewed.
- `COMBAT_FLOW.md`: yêu cầu 10 lượt, 5 phút sau trận, thao tác real-time ngang, flow đi/về, persistence, kết quả một lần, input/cleanup, đề xuất xử lý biên.
- Skill mới `tien-hiep-combat-flow`; link trong AGENTS, FEATURE_WORKFLOW, hai skill UI/scene. Context được cập nhật theo yêu cầu người dùng, sửa thông tin cũ “chưa có mã nguồn” bằng file đã xác minh. Design system và art bible ghi ngoại lệ góc nhìn ngang cho combat.
- `harness/combat-cases.json`: 19 case kế hoạch, chưa executable/chưa chạy. Bao gồm ranh giới đúng 5 phút, nhiều lượt, reload/offline, double click, về map, input, collision, locale/resize/performance.

## Kiểm tra thực tế

- Render A–E offline Chrome headless 1920×1200: pass; JSON `render-checks.json` ghi kết quả layout (không tràn trang, các trạng thái hiện diện, kích thước nút).
- Đã xem trực tiếp cả 5 ảnh; sửa nhãn số ở HUD gọn B/C và giữ đúng aspect ratio concept art.
- JSON harness parse được, 19 ID không trùng, nguồn spec tồn tại; prompt/reference/output tồn tại.
- `quick_validate.py` không chạy được vì cả Python hệ thống và Python bundled thiếu PyYAML. Không cài thêm package. Thay bằng kiểm tra trực tiếp frontmatter đơn giản, name/description và placeholder của cả 3 skill bằng Node: pass. Đây không phải kết quả pass của validator Python.
- Không chạy build hoặc gameplay tests: lượt này chỉ sửa tài liệu/skill và mã xuất mockup, không thay runtime game. Không tuyên bố combat hoặc hiệu năng đã pass.

## Tiếp tục sau lựa chọn

Ghi lựa chọn vào DESIGN_SYSTEM/COMBAT_FLOW, kiểm tra câu trả lời về hồi độc lập/tuần tự (hiện hồi độc lập và bể riêng từng quái còn là đề xuất). Sau đó tích hợp runtime, asset combat tách lớp, locale, test executable và chạy `npm run verify`, kiểm thử production toàn flow. Không cần yêu cầu lại mockup nếu người dùng đã chọn trong chat mới.
