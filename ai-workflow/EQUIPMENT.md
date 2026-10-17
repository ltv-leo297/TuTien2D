# Trang bị và túi trữ vật

Yêu cầu ngày 2026-10-12; **người dùng chọn A ngày 2026-10-13, đã tích hợp runtime**. Kết quả kiểm thử và giới hạn ở `reports/equipment-A-2026-10-13.md`. Không hỏi chọn lại bố cục.

## Yêu cầu đã nhận

- Túi khoảng 100 ô ở bên phải giao diện thuộc tính nhân vật.
- Có vị trí đeo/tháo vũ khí, quần áo, giày và các loại trang bị được đề xuất sau nghiên cứu.
- Vật phẩm có thông tin, chỉ số cộng khi đeo và cấp 1–9; dữ liệu dễ tìm/thêm trong source, lưu tiến trình offline.
- Nghiên cứu đổi ngoại hình theo đồ đang đeo; người dùng coi đây là phần tùy chọn nếu quá khó/không phù hợp.
- Lưu context, skill và harness để tái sử dụng. A đã chọn; các số cân bằng vẫn là bản đầu, chưa playtest dài hạn.

## Quy tắc triển khai bản đầu

10 slot: `weapon` vũ khí; `head` mũ/khăn; `body` áo/pháp bào; `legs` quần; `feet` giày; `cloak` áo choàng; `wrists` hộ uyển; `waist` đai; `jade` ngọc bội; `artifact` pháp bảo. Mỗi slot nhận một món. Pháp bào là áo thân, không thay đồng thời slot áo choàng/quần. Không tự thêm kỹ năng chủ động từ pháp bảo ở bản đầu.

100 ô chứa đồ chưa đeo. Trang bị không stack; nguyên liệu stack tối đa 99 theo từng loại/cấp. Đồ đang đeo không chiếm ô túi. Có tên, mô tả, loại, cấp, bonus và icon. Cấp là cấp vật phẩm (1–9), chưa phải phẩm chất hiếm, cường hóa hay điều kiện cấp người chơi. Chỉ số mẫu chưa cân bằng. Nguyên liệu có cấp nhưng không cấp chỉ số khi mang trong túi.

Flow (sửa theo yêu cầu 2026-10-13): một nút **Hành trang / Equipment** ngoài map → bảng A compact → chọn món → xem bonus/so sánh → đeo/thay/tháo → tổng chỉ số cập nhật → đóng/Esc về đúng map/vị trí. Chặn input map trong lúc thao tác bảng. Đổi đồ từ túi khi đầy vẫn được: đồ cũ về đúng ô vừa lấy. Tháo đồ khi đầy bị chặn, không xóa/vứt đồ. ID instance chỉ ở một nơi (túi hoặc slot), click nhanh không nhân đôi. Loot đầy không âm thầm mất; chưa triển khai loot quái trong phạm vi này.

Bảng thu gọn, 100 ô cùng lúc ở pane túi. Từ 681px trở lên giữ ba cột A; ≤680px dùng hai tab nội bộ Nhân vật/Túi trữ vật, không xếp cả ba cột thành trang dài. ≤1100px chi tiết là popover trong vùng túi, có nút đóng; vùng dư migration gấp gọn. Không ép toàn dialog cuộn ở các viewport đã test; màn rất thấp/zoom lớn vẫn cho cuộn để không mất thao tác. Chi tiết item dài có vùng cuộn riêng.

Hình vật phẩm: xem `ITEM_ART.md`, harness `harness/item-art-cases.json`. Yêu cầu mới là hình có chất liệu và hình dáng thật trong pixel art B. Bộ B Thanh Trúc đã chọn và thay bằng 19 PNG alpha riêng ngày 2026-10-14 trong túi/slot đang đeo/chi tiết. Glyph chỉ còn cho slot trống; lỗi ảnh hoặc item cũ không nhận diện có dấu ? với nhãn vi/en. Catalog dùng `iconAssetId`, resolver `art.ts`, không đổi `visualId:null`.

## Dữ liệu tập trung và offline

Catalog runtime duy nhất: `game/src/items/catalog.ts` có 13 trang bị và 6 nguyên liệu, tên/mô tả vi/en, cấp, slot, bonus, iconAssetId; `visualId:null` vì chưa có asset đổi ngoại hình. `STARTER_ITEMS` cấp 10 món thử nghiệm cấp 1–4 vào túi đúng một lần khi migration/khởi tạo; kiếm gỗ cấp 1 ở ô vũ khí. Không cấp Huyền Thiết Kiếm cấp 6 hoặc Cửu Vân Pháp Bào cấp 9. Draft `mockups/equipment-inventory/items.preview.json` chỉ lưu lịch sử thiết kế, runtime không import. Không dùng tên bản dịch làm khóa save.

Kiến trúc đã triển khai:

- `game/src/items/catalog.ts`: định nghĩa item và validator (cấp nguyên 1–9, bonus hữu hạn, slot đúng); mở rộng từ draft sau cân bằng.
- `game/src/items/inventory.ts`: 100 ô và equipment, giao dịch equip/swap/unequip thuần, instance ID riêng cho mỗi món trang bị.
- `game/src/items/stats.ts`: tính effective stats từ base cộng bonus; không đặt logic cộng đồ trong JSX/renderer.
- `game/src/items/storage.ts`: save có version, migration và xử lý lỗi. Định nghĩa item đóng gói cùng game; save chỉ lưu sở hữu/vị trí/instance, không biến chỉ số đã cộng thành base mới.

Save mới `truc-khe.inventory.v1`: version, revision, 100 slots, equipment và overflow. Giao dịch dùng Web Locks, đọc save mới nhất dưới khóa rồi commit; thao tác lỗi không sửa save trước đó. Thiếu Web Locks thì báo không lưu được, không dùng fallback ghi thiếu an toàn. `truc-khe.progress` cũ được giữ làm nguồn migration; sau đó cập nhật visited nhưng không viết đè bag cũ. `sim.bag` là projection resource của inventory mới cho scene/debug. Ledger combat độc lập không reset. Migration vượt 100 ô giữ số dư và hiển thị vùng Nhận vào túi; ID không nhận diện được vẫn giữ nhưng chưa nhận/đeo được. Reload phục hồi resource ngay khi tạo Simulation, không đợi effect.

Chỉ đánh dấu đã lưu sau ghi thành công. Save hỏng/ID cũ/quota/blocked storage phải giữ bản gốc và báo lỗi phù hợp, không ghi đè bằng save rỗng. Xử lý nhiều tab không cho snapshot cũ ghi đè trang bị mới. Lưu cục bộ gắn với origin và hồ sơ trình duyệt, có thể mất khi xóa dữ liệu; chưa có đồng bộ máy khác. Offline save không đồng nghĩa game đã có service worker để khởi động không mạng. Export/import là ý tưởng tương lai, chưa nằm trong phạm vi đã duyệt.

## Stats và combat

Dùng đúng 10 field `Stats` tại `game/src/combat/stats.ts`. `effective[stat] = base[stat] + tổng bonus đồ đang đeo`. Không cộng đồ còn trong túi; không cộng hai lần sau reload/đổi đồ. Không áp bonus vào Ngộ tính/Căn cốt/Tâm cảnh khi chưa có yêu cầu.

Ví dụ thực thi: base attack18 + kiếm gỗ3 =21; thay Thanh Trúc Kiếm9 =>27, accuracy17+2=19. Tháo hết =>attack18. Giữ nguyên ba công thức damage; CombatFlow đọc effective stats mới nhất để snapshot vào trận cho cả đánh và chịu đòn. Không tự gán hệ tu luyện, không đổi đồ trong trận. Runtime hiện không lưu HP/stamina/linh lực còn lại ngoài trận: mỗi trận mới bắt đầu đầy theo max (hành vi đã có từ trước). Nếu sau này thêm tài nguyên tồn tại ngoài trận, phải giữ current/clamp theo max khi thay đồ, không hồi miễn phí bằng tháo/đeo; chưa tuyên bố cơ chế đó đã có.

Một số thuộc tính có mapping real-time, một số chưa đủ cơ chế (accuracy người chơi chưa tạo RNG trượt đòn); không quảng cáo hiệu ứng chưa được code. Nếu thêm mapping mới cần nêu rõ và test riêng, không đổi công thức gốc âm thầm.

## Ngoại hình 2D (đề xuất, tùy chọn)

Layer/paper-doll phù hợp Canvas 2D: base body, chân/quần/áo, áo choàng phía sau, vũ khí trước/sau theo hướng và pose. Thiết bị trống dùng fallback thật: không kiếm/không giày; trang phục nền kín đáo. Đề xuất ưu tiên kiếm, áo choàng, giày; món khác ban đầu có thể chỉ đổi chỉ số nhưng phải báo rõ phạm vi.

Hiện `hero-A.png` và các hero/combat sheets là hình đầy đủ, đã vẽ sẵn trang phục/giày/vũ khí. Không thể ẩn giày baked bằng cách bỏ overlay. Cần base sạch và attachment cùng anchor/frame cho bốn hero, bốn hướng/ba frame khám phá, cùng pose chiến đấu. Tra manifest, giữ Bright Handheld, không thay bằng silhouette/procedural placeholder rồi báo xong. Layer chỉ đổi hình, không đổi collider/camera. Catalog mới dùng visualId đã có thì thêm dữ liệu; món có hình mới cần thêm asset+metadata. Mockup hiện dùng sprite cũ, không phải bằng chứng đã đổi ngoại hình.

## Nghiên cứu tham khảo

- [Wuxiaworld glossary, Items & Weapons](https://www.wuxiaworld.com/page/general-glossary-of-terms): pháp bảo gồm vũ khí, phục trang, trang sức/phù; phi kiếm và vật trữ vật. Danh sách 10 slot trên là đề xuất thiết kế riêng, không phải chuẩn bắt buộc từ truyện.
- [I Shall Seal the Heavens, chapter 322](https://lite.wuxiaworld.com/novel/i-shall-seal-the-heavens/issth-book-4-chapter-322): ví dụ túi trữ vật trong truyện. Không sao chép nhân vật/asset.
- [Spine skins](https://esotericsoftware.com/spine-skins): tài liệu chính thức về đổi attachment/skin và dùng lại animation. Dùng để tham khảo kỹ thuật; không yêu cầu mua Spine hay migrate khỏi Canvas.

## Nghiệm thu

Mockup A đã chọn, nguồn tại `mockups/equipment-inventory/`. Test executable: `game/test/equipment.test.mjs`, `game/test/browser/equipment.spec.ts`; tích hợp vào `npm run verify`. Harness `harness/equipment-cases.json` ghi coverage/giới hạn, báo cáo ở `reports/equipment-A-2026-10-13.md`. Ngoại hình vẫn giữ nguyên; chưa có loot quái/cửa hàng/cường hóa, PWA/offline boot hoặc đồng bộ cloud.

## Linh thảo rừng E ngày 2026-10-15

Bổ sung bốn nguyên liệu, không cấp vào starter set: Thanh Linh Thảo/Bạch Lộ Hoa cấp 1 và Tử Vân Chi/Ngọc Tủy Thảo cấp 2. Sáu cụm mới dùng ID vị trí riêng, `Actor.itemId` ánh xạ về catalog; cooldown hái theo cụm, stack theo loại. Khi giao dịch túi lỗi/đầy, bỏ cooldown đúng cụm để người chơi có thể hái lại. Giữ nguyên ba tài nguyên rừng cũ và save inventory v1. Icon PNG alpha riêng 256px được đóng gói từ sprite production qua source rectangles đã đo, giữ sheet nguồn và prompt `assets/prompts/forest-E.json`; không lấy nền mockup làm hình. Tổng catalog hiện 23 món. Xem báo cáo rừng E để biết kiểm thử mới.
