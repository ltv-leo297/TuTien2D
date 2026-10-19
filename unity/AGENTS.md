# Làm việc trong bản Unity

Đọc hướng dẫn/context ở gốc repo như quy định. `ai-workflow/CONTEXT.md` mô tả bản web và lịch sử quyết định; yêu cầu chuyển Unity ngày 2026-10-17 được ghi riêng tại `MIGRATION.md`, không tự viết lại context.

- Target hiện tại là Unity 6.3 LTS `6000.3.26f1`; đọc `UNITY6.md` khi sửa cấu hình/package/build. Giữ Built-in renderer và Input Manager hiện có.
- Runtime thư mục này là C#/Unity; không nhúng web view hoặc thêm phụ thuộc Node vào player.
- Giữ bố cục, art và luật chơi đã duyệt khi port/sửa lỗi. UI mới ngoài phạm vi vẫn theo quy trình duyệt ở gốc.
- `Resources/Data/content.json` và `Resources/Art/Baked` là dữ liệu đã xuất. Chỉ chạy lại `../tools/export-unity.mjs` khi chủ động đồng bộ từ web, vì export sẽ ghi đè các chỉnh sửa riêng ở đó.
- Sau sửa core, chạy `dotnet run --project Validation/Validation.csproj -- .` từ thư mục `unity`. Thay đổi adapter/render/input cần kiểm tra bằng Unity Editor và Play Mode, không suy kết quả từ dotnet.
- Dùng `python3 ../tools/unity-project.py --sync-meta --check` để tạo GUID cho asset mới và kiểm tra. Không đổi GUID của asset hiện có.
- Ghi rõ bước Unity chưa chạy trong báo cáo; trạng thái ở `MIGRATION.md` không tự trở thành pass khi mới thêm code hoặc test.
