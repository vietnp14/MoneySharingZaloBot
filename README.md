# Bot chia tiền trên Zalo

Bot ghi nhận chi tiêu chung, lưu lịch sử riêng cho từng cuộc trò chuyện, tính nợ và thống kê qua AI. Các lệnh và phản hồi dùng tiếng Việt. Lệnh có dấu và không dấu đều được hỗ trợ.

## Các lệnh

```text
/chi 300k ăn sáng @An @Binh @Cuong

/nợ

/tuần
/tháng

/sửa 12 350k ăn sáng @An @Binh @Cuong

/xóa 12

/trả @Cuong 100k

/trợgiúp
/hỏi Tháng này nhóm chi bao nhiêu tiền cà phê?
```

Người gửi lệnh chi là người trả tiền và luôn được tính vào danh sách chia đều. Chỉ người tạo được sửa hoặc xóa khoản chi của mình, bằng mã do bot trả về. `/trả` ghi nhận trả nợ, không thực hiện chuyển tiền.

Có thể nhắc bot trước lệnh, ví dụ `@Bot Money Sharing /trợgiúp`. Các lệnh tiếng Anh đã được loại bỏ.

## Chạy cục bộ

```bash
npm install
cp .env.example .env
npm run dev
```

Để kiểm thử không dùng Firebase, đặt biến môi trường:

```text
STORAGE_DRIVER=memory
```

## Lưu ý về Zalo

Đăng ký webhook HTTPS tại `/webhook/zalo`, với khóa bí mật khớp `ZALO_WEBHOOK_SECRET`. Kiểm thử trong cuộc trò chuyện riêng trước; kiểm tra `can_join_groups` qua API `getMe` trước khi dùng nhóm.

## Lưu trữ

Bot dùng Firestore. Cần bật API Cloud Firestore và tạo cơ sở dữ liệu `(default)` trong dự án tương ứng với thông tin xác thực.

Hiện tại, tên như `@An` chưa được liên kết với ID Zalo thật. Khi nhiều người ghi chi tiêu, điều này có thể tạo người trùng và làm sai số dư; cần hoàn thiện liên kết thành viên trước khi dùng cho nợ thực tế.
