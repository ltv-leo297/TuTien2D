# UI điện thoại A — triển khai source, 2026-10-19

Người dùng chọn **A — Hai ngón cái** ngày 2026-10-18. Source Unity đã có nhánh UI mobile riêng, tự bật trên Android/iOS. **Chưa chạy bằng Unity Editor hoặc trên điện thoại**; không coi các kiểm tra .NET là nghiệm thu native.

Target hiện tại là **Unity 6.3 LTS (6000.3.26f1)**; xem [`UNITY6.md`](UNITY6.md). Kết quả compiler reference cũ bên dưới là lịch sử, không phải compile bằng Unity 6.

## Phần đã triển khai

- **Layout theo màn hình:** mobile dùng canvas logic theo tỉ lệ vùng an toàn, chiều cao tham chiếu 390; màn hẹp/tablet tăng chiều cao logic để giữ đủ chiều ngang cho nội dung. Desktop giữ layout cũ. Không thu cả UI desktop 1280×720 xuống màn điện thoại. Cutout/home indicator theo `Screen.safeArea`; thêm padding bên trong các nhóm điều khiển.
- **Khám phá:** profile nhỏ góc trái, minimap và tùy chọn góc phải, một nút Hành trang và một nút Nhiệm vụ dưới phải; bỏ hướng dẫn phím desktop. Chạm để đi như trước. Panel NPC có nút đóng và vùng thoại cuộn riêng; thẻ gặp quái có nút Chiến đấu/Đóng lớn.
- **Combat:** hai nút hướng 64 bên trái; nhảy/linh trảm/lướt/giữ đỡ theo cụm cung bên phải, Đánh 76. Nút tròn dùng geometry UI, vùng hit theo hình tròn; icon vector và nhãn Việt/Anh, không nhãn phím. Trạng thái đang giữ, cooldown kỹ năng/lướt và thiếu tài nguyên có phản hồi; pause/mất focus nhả mọi ngón. Quy tắc damage/cost/cooldown vẫn giữ nguyên.
- **Hành trang:** toàn vùng an toàn, hai tab Nhân vật/Túi đồ. Túi dùng 4 hoặc 5 cột theo chiều ngang; đủ 100 slot, search, lọc, nhận overflow và cuộn riêng. Chi tiết bên phải có mô tả/chỉ số cuộn riêng; nút Trang bị/Tháo cố định ở đáy. So sánh tổng chỉ số trước → sau thay/tháo. Giữ vị trí cuộn khi chọn món hoặc đổi đồ, cập nhật selection sau equip/unequip và thông báo sau lưu thành công.
- **Nhân vật:** 10 slot trang bị, tổng 10 thuộc tính, hệ/cấp tu luyện và ba nền tảng hiện có trong vùng cuộn riêng. Không đặt cả nhân vật và 100 ô cạnh nhau ở màn hình thấp.
- **Các màn còn lại:** tạo nhân vật 2×2 lựa chọn, ô tên và xác nhận ở phần trên; tiếng Việt/Anh; tùy chọn/nhiệm vụ có nút cao ít nhất 48 logic và nội dung cuộn; pause/rút lui/kết quả có nút lớn. Không dựng lại InputField đang focus khi bàn phím hệ thống còn mở. Banner lỗi lưu không phủ nút Trang bị để có thể thử lại.

Các số kích thước trên là đơn vị UI logic, chưa phải phép đo dp/độ lớn vật lý đã kiểm chứng trên thiết bị. Hình mockup là tham chiếu bố cục; runtime dùng asset production/catalog hiện có, không thêm món đồ/hệ thống theo chi tiết minh họa ImageGen.

## Xem trong Unity

1. Mở project bằng Unity 6.3 LTS (6000.3.26f1) và scene Main.
2. Bật **Truc Khe → Mobile → Preview Phone UI in Editor**, rồi Play. Có thể bật/tắt trong Play Mode để kiểm tra UI. Lựa chọn được giữ trong phiên Editor qua domain reload khi vào/thoát Play Mode. Preview này không đổi build target và không lưu tùy chọn vào bản player; Android/iOS tự dùng mobile UI.
3. Chọn Game view landscape 844×390, 915×412, 640×360 hoặc Device Simulator để thử cutout/xoay trái-phải. Preview thường không mô phỏng bàn phím hệ thống và kích thước ngón tay thật.
4. Chạy **Test Runner → PlayMode → Run All**. Bộ test hiện có 19 ca (13 cũ + 6 mobile A mới).
5. Build APK hoặc Xcode theo `MOBILE.md`; kiểm tra trên thiết bị thật trước khi xác nhận hình ảnh, cảm ứng, bàn phím và hiệu năng.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả / phạm vi |
|---|---|
| Core .NET 8 | **101 PASS**, gồm replay combat đối chiếu TypeScript, inventory/save và hình học layout A cho điện thoại/cutout/tablet; `Validation/last-run.txt` |
| Core + Runtime compile bổ sung trước nâng cấp Unity 6 | **0 warning / 0 error**; UnityEngine.Modules 2021.3.33, UnityEngine.UI 2018.3.5.1, Newtonsoft AOT package 3.2.1; `Validation/mobile-ui-compile-last-run.txt` |
| Cấu trúc project | **PASS**: 89 hash nguồn, 61 PNG production, 115 GUID, scene/assembly, locale UI cũ và mobile vi/en; `Validation/structure-last-run.txt` |
| Unity Editor / test assembly / 19 Play Mode tests / APK / iOS | **CHƯA CHẠY**; môi trường chưa có Editor/toolchain mobile |

Sáu ca Play Mode mới bao phủ equip/unequip/tab/filter, cuộn tới ô cuối mà nút hành động vẫn cố định, nhiều ngón và pause, resize giữ selection/chặn xuyên chạm, lỗi lưu vẫn retry được, đổi locale giữ tab. Có source test không có nghĩa đã compile hoặc pass trong Unity.

## Còn cần nghiệm thu trực tiếp

Chữ dài tiếng Anh, bàn phím thật và ô tìm kiếm; kích thước chạm vật lý; thao tác giữ/nhả khi ngón trượt khỏi nút; vùng pause/thông báo; raycast/scroll trên mỗi hệ điều hành; camera/telegraph có bị tay hoặc HUD che; tất cả 4 map/4 hero; đi qua đầy đủ thua/thắng/rút lui/lỗi lưu; FPS và bộ nhớ sau nhiều lần mở túi. Các phép kiểm tra hình học/compile không thay cho các bước này.

Tham chiếu thiết kế đã chọn: `Documentation/mobile-ui-A.png` (**mockup**, không phải ảnh runtime). Nguồn UI: `Assets/TrucKhe/Runtime/GameUI.Mobile.cs`; geometry: `Core/MobileUiLayout.cs`; locale riêng: `Resources/Data/mobile-ui.json`.
