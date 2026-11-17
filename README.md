# GomĐơn POS

App quản lý quán ăn: bán tại quầy, gom đơn từ **GrabFood, ShopeeFood, beFood, Xanh Ngon** về một màn hình, quản lý thực đơn và xem báo cáo doanh thu theo từng sàn.

Chạy được trên điện thoại (PWA: thêm vào màn hình chính) và máy tính. Không cần build, không cần server.

## Chạy thử

```bash
python3 -m http.server 8080   # rồi mở http://localhost:8080
```

Hoặc build thành một file HTML duy nhất để gửi cho người khác: `./scripts/build-single.sh` → `dist/gomdon.html`.

## Tính năng

| Màn hình | Làm được gì |
|---|---|
| **Tại quán** | Chọn món theo nhóm, tìm món (gõ không dấu cũng được), giỏ hàng, mang về / tại bàn, hình thức thanh toán, ghi chú cho bếp, gửi đơn xuống bếp |
| **Đơn online** | Đơn từ các sàn + tại quán theo luồng *Mới → Đang làm → Chờ lấy → Hoàn tất*, chuông báo đơn mới, báo trễ sau 15 phút, lọc theo sàn, lịch sử đơn, thực nhận sau phí sàn |
| **Thực đơn** | Thêm/sửa/xóa món và nhóm món, ảnh món, bật/tắt "hết món", giá riêng từng sàn (hoặc tự tính theo % tăng giá), nhắc đồng bộ khi có thay đổi |
| **Báo cáo** | Doanh thu, thực nhận, số đơn, giá trị trung bình (so với kỳ trước), biểu đồ theo giờ/ngày chia theo nguồn, bảng phí sàn, món bán chạy |
| **Kết nối** | Kết nối/ngắt từng sàn, % phí sàn, % tăng giá, tự động nhận đơn, cài đặt quán |

Dữ liệu lưu trong `localStorage` của trình duyệt. Lần đầu mở app sẽ có **dữ liệu mẫu** (thực đơn và 30 ngày đơn). Xóa dữ liệu mẫu ở *Kết nối → Cài đặt*.

## Về kết nối sàn thật

Hiện tại **kết nối sàn là giả lập**: đơn online được sinh ngẫu nhiên, nút "Đồng bộ" không gửi gì ra ngoài. Lý do là các sàn giao đồ ăn không có API công khai, miễn phí cho từng quán. Muốn nhận đơn thật, cần:

1. **Quyền tích hợp từ từng sàn.** Đăng ký làm đối tác tích hợp (POS/API partner) với Grab, ShopeeFood, be, Xanh SM. Mỗi sàn có quy trình xét duyệt riêng.
2. **Một máy chủ (backend).** Máy chủ nhận webhook đơn mới, lưu dữ liệu tập trung để nhiều máy cùng xem, rồi đẩy đơn về app theo thời gian thực. Có thể dùng gói miễn phí của Supabase hoặc Firebase.
3. **Một adapter cho mỗi sàn.** Phần `PlatformAdapter` trong `src/app.js` đã chừa sẵn chỗ cho các thao tác: kết nối, đẩy thực đơn, báo hết món, nhận/từ chối đơn, báo món xong.

## Cấu trúc

```
index.html            app shell
src/styles.css        giao diện (sáng/tối tự động)
src/app.js            toàn bộ logic
sw.js, manifest.webmanifest, icon.svg   PWA (cài lên điện thoại, mở khi mất mạng)
scripts/build-single.sh                 gộp thành 1 file HTML
```
