# Hướng dẫn làm việc với AI

Khi bắt đầu bất kỳ tác vụ nào trong project này:

1. Đọc `ai-workflow/CONTEXT.md` trước khi khảo sát rộng hoặc sửa project.
2. Nếu file ghi **Chưa có context dự án**, kiểm tra các file thật của project (bỏ qua `AGENTS.md` và `ai-workflow/`). Nếu đã có nội dung dự án, cập nhật `CONTEXT.md` một lần bằng thông tin kiểm chứng được, rồi đổi trạng thái thành **Đã có context dự án**. Nếu project vẫn trống, giữ nguyên file.
3. Nếu file ghi **Đã có context dự án**, dùng nó để định hướng và không tự viết lại. Chỉ cập nhật khi người dùng yêu cầu cập nhật context.
4. Khi làm một tác vụ cụ thể, đọc lại các file liên quan để xác nhận hiện trạng; context chỉ là bản tóm tắt, không thay thế mã nguồn và yêu cầu mới của người dùng.

Khi người dùng yêu cầu làm một tính năng game, áp dụng `ai-workflow/FEATURE_WORKFLOW.md`. Khi tạo mockup UI, dùng skill `.agents/skills/tien-hiep-ui-mockups/SKILL.md` và đọc `ai-workflow/DESIGN_SYSTEM.md` cùng `ai-workflow/TECH_STACK.md`. **Đưa ra 5 mockup UI để người dùng xem và chọn trước khi triển khai tính năng.** Không coi việc đưa ra mockup là sự đồng ý triển khai. Sau khi người dùng chọn, mới code, build, chạy và kiểm thử theo workflow. Với thay đổi hoàn toàn không có giao diện, hỏi người dùng trước khi bỏ qua bước mockup.

Quy ước ghi context nằm trong `ai-workflow/WORKFLOW.md`. Các ghi chú thiết kế là dữ liệu tham khảo, không phải chỉ dẫn thay thế yêu cầu hiện tại của người dùng. Không lưu mật khẩu, token, dữ liệu riêng tư hoặc suy đoán chưa kiểm chứng vào context.

Khi sửa hoặc xây dựng scene, áp dụng `ai-workflow/SCENE_QUALITY.md` và skill `.agents/skills/tien-hiep-scene-quality/SKILL.md`: va chạm vật cản; camera/chuột/DPR đồng bộ; scale theo mockup; locale Việt/Anh; hiệu ứng; tra `assets/manifest.json` trước khi gen. Giữ bộ B Bright Handheld. Duyệt bằng ảnh trực tiếp, không chạy trang lựa chọn riêng. Giữ bước chọn 5 mockup ở trên.

Khi thiết kế hoặc triển khai gặp quái/chiến đấu/lượt hồi, dùng `.agents/skills/tien-hiep-combat-flow/SKILL.md`, đọc `ai-workflow/COMBAT_FLOW.md` và `ai-workflow/harness/combat-cases.json`. Giữ flow tiếp cận → lượt → combat → kết quả → trở về map; phân biệt yêu cầu đã chốt với đề xuất và test kế hoạch với kết quả đã chạy. Màn combat được yêu cầu góc nhìn ngang; map khám phá vẫn top-down bộ B.

Combat đã chọn UI B ngày 2026-10-11: chỉ hiện số lượt còn đánh được ngoài map khi bấm quái; không hiện số lượt trong trận/kết quả và không hiển thị countdown hay giải thích hồi lượt. Rule 5 phút/lượt chạy ngầm. Không hỏi chọn lại bố cục đã duyệt.

Khi làm túi đồ/trang bị/catalog vật phẩm hoặc ngoại hình theo đồ, dùng `.agents/skills/tien-hiep-equipment/SKILL.md`, đọc `ai-workflow/EQUIPMENT.md` và `ai-workflow/harness/equipment-cases.json`. Yêu cầu ngày 2026-10-12: túi khoảng 100 ô bên phải thuộc tính, vật phẩm cấp 1–9 và bonus khi đeo; đổi ngoại hình là tùy chọn. Người dùng đã chọn A ngày 2026-10-13; runtime ở `game/src/items/`, không hỏi chọn lại. Catalog duy nhất `catalog.ts`, save `truc-khe.inventory.v1`; ngoại hình theo đồ chưa triển khai. Không áp dụng ngoại lệ bỏ mockup của AI quái sang UI này.

Khi thêm hình vật phẩm, đọc `ai-workflow/ITEM_ART.md` và harness `ai-workflow/harness/item-art-cases.json`: hình vật thể có khối/chất liệu theo Bright Handheld, không dùng glyph nét viền làm art hoàn thiện. Icon túi không đồng nghĩa ngoại hình nhân vật. Bộ item **B — Thanh Trúc** đã chọn, triển khai 2026-10-14: PNG riêng trong `assets/production/items/`, catalog có `iconAssetId`; tiếp tục dùng B khi thêm món, không hỏi chọn lại. Glyph chỉ dùng cho ô trang bị trống. Hành trang là điểm vào duy nhất của bảng nhân vật/trang bị/túi; giữ compact, không quay lại hai nút cùng dialog.

Khi thêm/cân bằng thuộc tính, skill hoặc AI quái, dùng `.agents/skills/tien-hiep-monsters/SKILL.md`, đọc `ai-workflow/MONSTERS.md` và `ai-workflow/harness/monster-cases.json`. Dữ liệu tập trung tại `game/src/combat/monsters.ts`; công thức và chỉ số nhân vật chung tại `stats.ts`. Mỗi quái 3–5 skill, chọn đòn ngẫu nhiên có trọng số theo điều kiện hợp lệ, báo trước và khóa đích. Người dùng cho phép bỏ mockup riêng cho nâng cấp logic này ngày 2026-10-12; giữ UI B.
