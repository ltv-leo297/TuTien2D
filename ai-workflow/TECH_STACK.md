# Stack đề xuất nếu phát hành game tiên hiệp 2D hoàn toàn trên web

## Runtime đã kiểm chứng ngày 2026-10-05

`game/` dùng React 19 + TypeScript + Vite, Canvas 2D trong `src/engine/renderer.ts`; chưa dùng Phaser. Scene, navigation, simulation và camera ở `src/engine/`; HUD trong `src/App.tsx`, locale ở `src/locales/{vi,en}.json`. Lệnh thật: `npm run dev`, `npm run build`, `npm run preview`, `npm run verify` (logic, asset/locale, build và Playwright production). Node 24+ và Chrome cho harness. Không tự đổi engine theo phần đề xuất bên dưới. Tiêu chuẩn sửa scene nằm trong `SCENE_QUALITY.md`, thư viện nguồn ở `assets/manifest.json`. Kết quả chạy nằm trong `game/test-results/` và `reports/scene-01-e-2026-10-05.md`.

## Đề xuất kiến trúc ban đầu

**Trạng thái:** Đây là phương án đề xuất cho câu hỏi "chỉ làm full web". Phạm vi đã xác nhận trong `CONTEXT.md` vẫn là web làm nền tảng chính; khi người dùng chốt chỉ phát hành trên web, cập nhật context theo yêu cầu. Thiết kế và kiểm thử trước trên trình duyệt desktop; nếu hỗ trợ mobile web, phải thử riêng thao tác cảm ứng và hiệu năng thiết bị thật.

## Game và giao diện

- **Phaser 4 + TypeScript:** chạy vòng lặp game, vẽ thế giới 2D, map, nhân vật, chiến đấu, camera, particles và hiệu ứng trong canvas WebGL. Dùng scene cho từng khu vực/luồng chơi; không tải toàn bộ thế giới một lúc. Khi bắt đầu code, chọn bản phát hành ổn định đang có và kiểm tra tương thích của plugin cần dùng.
- **React + TypeScript + CSS:** HUD, nhiệm vụ, tu luyện, kỹ năng, túi đồ, hộp thoại và các màn hình nhiều chữ/dữ liệu. Đặt giao diện HTML trong lớp phủ trên canvas game; dùng component dùng chung và CSS custom properties cho màu, chữ, khoảng cách, khung, nút. Trao đổi trạng thái giữa React và Phaser qua cầu nối sự kiện có kiểu dữ liệu; chỉ cập nhật React khi trạng thái đổi, không đẩy mỗi frame vào React.
- **Vite:** dev server và production build. Dùng template Phaser + React + TypeScript + Vite chính thức làm điểm khởi đầu khi bắt đầu triển khai game.
- **Hiệu ứng huyền ảo:** Phaser 4 Filters (glow, blur, vignette...) và particle emitter cho linh quang, sương, bụi sáng; CSS animation/transition cho panel, nút và trạng thái UI. Filter WebGL có thể không chạy trong Canvas fallback, nên cần kiểm tra chế độ này và giữ UI cơ bản vẫn dùng được.

## Dữ liệu và kiểm thử

- **Luật chơi:** đặt công thức tu luyện, sát thương, nhiệm vụ, vật phẩm trong module TypeScript và dữ liệu có cấu trúc; tách khỏi mã vẽ và UI để dễ cân bằng, kiểm thử.
- **Lưu tiến trình:** với bản chơi đơn đầu tiên, dùng IndexedDB trong trình duyệt và có phiên bản dữ liệu lưu để nâng cấp về sau. Dữ liệu này ở thiết bị/trình duyệt của người chơi và có thể bị xóa; tài khoản, đồng bộ nhiều máy hoặc multiplayer sẽ cần backend riêng khi các yêu cầu đó được chốt.
- **Test:** kiểm thử logic quan trọng bằng Vitest; kiểm thử luồng chơi thực tế trên Chromium, Firefox và WebKit bằng Playwright. Build bằng Vite, mở bản production trên trình duyệt thật và kiểm tra console, tải asset, thao tác và hiệu năng.

## Hình ảnh và hiệu năng

- **Krita** cho nền/họa tiết/nhân vật dạng tranh vẽ; **Inkscape/SVG** cho icon và hoa văn nét sắc. Giữ file nguồn. Chữ, số, nút và trạng thái là HTML/CSS thật, không nhúng vào ảnh nền. Font phải hiển thị đầy đủ dấu tiếng Việt.
- Định hướng hình ảnh **đề xuất, chưa duyệt**: thủy mặc, sương mờ, ngọc thạch, ánh kim tiết chế và linh quang. Năm mockup đầu dùng chung một hệ hình ảnh để so sánh bố cục/tương tác.
- Tải asset dùng chung khi mở game; tải asset riêng khi vào khu vực hoặc tính năng tương ứng. Dùng atlas/spritesheet phù hợp, culling cho map, giới hạn particle và filter theo năng lực thiết bị. Đo thời gian tải và FPS trên bản build thật trước khi kết luận hiệu năng.
- Mục tiêu ban đầu: 60 FPS trên máy desktop đích (khoảng 16,7 ms mỗi frame ở màn hình 60 Hz); thử mobile web riêng, có thể đặt mục tiêu thấp hơn theo thiết bị. Đây là **mục tiêu đo**, không phải cam kết từ framework. Đo cả FPS thấp nhất/khung hình giật khi di chuyển map, đánh quái, mở UI và dùng nhiều hiệu ứng; giảm hiệu ứng theo cấu hình thiết bị nếu cần.

## Mockup

- Tạo mockup bằng React/CSS và hình/asset có thể tái sử dụng trong game; vùng game minh hoạ bằng Phaser hoặc canvas/ảnh đại diện khi chưa triển khai gameplay. Năm phương án dùng cùng token và component, khác nhau ở bố cục hoặc tương tác.
- Chỉ sau khi người dùng chọn mới tích hợp tính năng. Preview mockup không được coi là gameplay đã hoàn tất.

## Tài liệu chính thức

- [Phaser dành cho web 2D](https://docs.phaser.io/phaser/getting-started/what-is-phaser), [Phaser 4 releases](https://phaser.io/download/phaser4), [template React + TypeScript + Vite](https://github.com/phaserjs/template-react-ts)
- [Phaser filters](https://docs.phaser.io/api-documentation/class/filters-glow), [tilemap GPU layer](https://docs.phaser.io/api-documentation/class/tilemaps-tilemapgpulayer), [asset loader](https://docs.phaser.io/phaser/concepts/loader)
- [Vite production build](https://vite.dev/guide/build), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [Playwright](https://playwright.dev/docs/intro), [Vitest](https://vitest.dev/guide/), [ngân sách khung hình](https://web.dev/articles/speed-rendering)
