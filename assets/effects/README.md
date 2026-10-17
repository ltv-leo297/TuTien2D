# Hiệu ứng dùng lại

`ambient-v1.json` được nhập trực tiếp vào `game/src/engine/renderer.ts`: số gợn nước/tốc độ, lá, bướm, khói/tàn lửa và offset lò rèn. Renderer vẽ theo thời gian xác định, không giữ danh sách particle tích lũy khi đổi map. Giảm chuyển động sẽ đóng băng hiệu ứng môi trường, bỏ lá và bướm. Tab ẩn dừng vòng vẽ và âm thanh. Khi thêm scene, dùng lại preset, thay offset theo prop thực tế, kiểm tra giới hạn hạt và hiệu năng bằng harness.
