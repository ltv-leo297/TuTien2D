# Bản chơi thử và làm việc từ điện thoại

Repo: https://github.com/ltv-leo297/TuTien2D

GitHub Pages được cấu hình bằng `.github/workflows/deploy-pages.yml`. Khi code
trong `game/`, `assets/`, `tools/` hoặc workflow thay đổi trên `main`, GitHub
chạy test, kiểm tra asset, build và publish `game/dist`. Có thể chạy lại bằng
Actions → Publish game to GitHub Pages → Run workflow.

Chỉ artifact game được publish. Gameplay/save vẫn chạy trên trình duyệt của
từng người; chưa có tài khoản hoặc đồng bộ tiến trình giữa thiết bị.

## Kiểm tra trước khi push

Từ `game/`, dùng Node 24 trở lên:

```sh
npm ci
npm run verify
```

Browser test cần Chrome hoặc Chromium theo `game/README.md`. Để kiểm tra build
với đường dẫn GitHub Pages:

```sh
npm run build -- --base /TuTien2D/
npm run preview -- --port 4181
```

Mở `http://localhost:4181/TuTien2D/`. Đường dẫn asset trong TypeScript đi qua
`assetUrl()`; URL trong CSS được Vite xử lý theo base khi build.

## Giao task từ điện thoại

1. Đăng nhập cùng tài khoản ChatGPT. Chọn môi trường Codex Cloud đã publish
   và repo `ltv-leo297/TuTien2D`, hoặc tiếp tục chat cloud hiện tại.
2. Mô tả thay đổi; yêu cầu đọc `AGENTS.md`, chạy kiểm tra, commit và push.
3. Với thay đổi cần duyệt, yêu cầu push nhánh riêng và tạo pull request.
   Khi merge vào `main`, bản web tự cập nhật nếu test/build thành công.
4. Với bản sửa đã duyệt và muốn lên web ngay, nói rõ cho phép cập nhật `main`.
   Yêu cầu kiểm tra deployment thành công và trả link sau khi push.

Mẫu task:

> Trong repo TuTien2D, đọc AGENTS.md rồi thực hiện [yêu cầu]. Chạy các kiểm tra
> liên quan, commit và push lên nhánh riêng, tạo PR. Trả link PR và kết quả test.

Task mới có workspace riêng: dùng code đã commit/push làm nguồn chung. Tiếp tục
chat cũ nếu còn thay đổi chưa commit. Cloud task không cần giữ máy tính cá nhân
bật. Quyền GitHub phải còn được kết nối trong môi trường.

Hướng dẫn Codex Cloud:
https://help.openai.com/en/articles/20001545-using-codex-cloud
