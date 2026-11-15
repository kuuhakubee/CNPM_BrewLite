# TÀI LIỆU ĐẶC TẢ & TỐI ƯU HÓA CƠ SỞ DỮ LIỆU QUẢN LÝ QUÁN ĐỒ UỐNG (F&B)

## 1. Bối cảnh & Mục tiêu (Context & Objectives)
- **Hệ thống:** Quản lý bán hàng và tồn kho cho cửa hàng đồ uống (F&B).
- **Cơ chế hoạt động:** Số lượng đồ uống tối đa có thể bán được (Availability) và việc trừ kho tự động (Inventory Deduction) được tính toán dựa trên định lượng nguyên liệu trong bảng công thức (Bill of Materials - BOM).
- **Mục tiêu tài liệu:** Chuẩn hóa cấu trúc dữ liệu, sửa lỗi logic về đơn vị đo lường và thiết lập quy tắc vận hành để các AI Agent/Developer có thể hiểu, tái cấu trúc và tự động hóa hệ thống chính xác.

---

## 2. Phân tích Hiện trạng & Các Vấn đề Cần Khắc phục (Current Issues)

### 2.1. Sai lệch Đơn vị tính (Unit Mismatch) tại bảng `Ingredient`
Hiện tại, cột `unit` đang sử dụng các đơn vị mang tính **định tính**, **dụng cụ đong** hoặc **thành phẩm**, gây khó khăn cho việc nhập kho từ nhà cung cấp và tính toán hao hụt:
- **Sữa tươi (`ly`), Nước (`ly`), Bọt sữa (`ly`):** Sai logic vận hành. Sữa nhập theo hộp/lít; nước là tài nguyên không quản lý tồn kho theo ly; bọt sữa là chế phẩm từ sữa tươi chứ không phải nguyên liệu thô độc lập.
- **Trân châu (`muỗng`), Đường (`thìa cà phê`):** Dùng dụng cụ pha chế làm đơn vị kho khiến việc kiểm kê thực tế (theo kg/gói) không thể thực hiện chính xác.
- **Đào (`miếng`), Cam sả (`cây`):** Dễ gây sai số khi nhập hàng theo quy cách đóng gói (hộp, kg) nếu không có bảng quy đổi.

### 2.2. Rủi ro Đồng bộ Dữ liệu tại bảng `ProductRecipe`
- Kiến trúc bảng `ProductRecipe` (Quan hệ Many-to-Many giữa `Product` và `Ingredient`) đã **đạt chuẩn thiết kế cơ sở dữ liệu**.
- **Rủi ro:** Cột `quantity` chỉ lưu giá trị số (Numeric) và phụ thuộc hoàn toàn vào `unit` của bảng `Ingredient`. Khi `Ingredient.unit` thay đổi (ví dụ: từ `thìa` sang `gram`), toàn bộ giá trị `ProductRecipe.quantity` tương ứng bắt buộc phải được cập nhật lại theo tỷ lệ quy đổi mới.

---

## 3. Hướng dẫn Tái cấu trúc & Chuẩn hóa (Actionable Improvements)

### 3.1. Chuẩn hóa Đơn vị đo lường cơ bản (Base Units)
AI Agent cần thực hiện chuyển đổi toàn bộ `unit` trong bảng `Ingredient` về **Đơn vị đo lường chuẩn nhỏ nhất (Base Unit)** dùng trong lưu trữ kho:

| ID | Tên nguyên liệu (`name`) | Đơn vị cũ (`unit`) | Đơn vị chuẩn đề xuất (`unit`) | Ghi chú xử lý cho AI Agent |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Espresso | `shot` | `shot` (hoặc `gram` hạt cà phê) | Giữ nguyên `shot` (quy ước 1 shot = 30ml hoặc 60ml) hoặc quy về `gram` cà phê bột tiêu hao. |
| 2 | Sữa tươi | `ly` | `ml` | Quy đổi tồn kho sang mililit (VD: 1000ml/hộp). |
| 3 | Nước | `ly` | *Loại bỏ khỏi kho* | Không cần quản lý tồn kho nước lọc trong BOM. |
| 4 | Bọt sữa | `ly` | *Gộp vào Sữa tươi (`ml`)* | Bọt sữa được đánh từ sữa tươi. Tính lượng sữa cần dùng vào thẳng công thức. |
| 5 | Trà | `túi` | `túi` hoặc `gram` | Giữ `túi` nếu dùng trà túi lọc định lượng sẵn; dùng `gram` nếu dùng trà lá. |
| 6 | Đào | `miếng` | `miếng` (kèm quy đổi) | Nếu nhập theo hộp, cần quy tắc: `1 hộp = X miếng` khi nhập kho. |
| 7 | Cam sả | `cây` | `gram` hoặc `cây` | Nên quy về `gram` hoặc giữ `cây` nếu nhập/xuất đồng nhất theo cây. |
| 8 | Trân châu | `muỗng` | `gram` | Chuyển sang `gram` (VD: 1 muỗng công thức = `30` hoặc `50` gram). |
| 9 | Đường | `thìa cà phê` | `gram` (hoặc `ml` nước đường) | Chuyển sang `gram` (VD: 1 thìa cà phê = `5` gram). |
| 10 | Bơ | `quả` | `quả` hoặc `gram` | Có thể giữ `quả` nếu định lượng theo quả (VD: `0.5` quả/ly). |
| 11 | Cam | `quả` | `quả` | Giữ nguyên `quả` (VD: `2` quả/ly nước cam). |

### 3.2. Cập nhật Schema & Ràng buộc Dữ liệu (Database Schema Rules)
Đảm bảo 3 bảng cốt lõi tuân thủ kiểu dữ liệu và ràng buộc sau:

1. **`Product` (Danh mục đồ uống)**
   - `id`: Primary Key (Int/UUID)
   - `name`: String (Tên món)
   - `price`: Decimal/Int (Giá bán)
   - `isAvailable`: Boolean (Tự động tính toán dựa trên tồn kho nguyên liệu)

2. **`Ingredient` (Kho nguyên liệu)**
   - `id`: Primary Key (Int/UUID)
   - `name`: String (Tên nguyên liệu)
   - `unit`: Enum/String (`ml`, `gram`, `shot`, `quả`, `túi`, `miếng`)
   - `stock`: Float/Decimal (Cho phép lưu số thập phân, ví dụ: `1500.5` ml)

3. **`ProductRecipe` (Định lượng công thức)**
   - `id`: Primary Key (Int/UUID)
   - `productId`: Foreign Key -> `Product.id`
   - `ingredientId`: Foreign Key -> `Ingredient.id`
   - `quantity`: Float/Decimal (Số lượng tiêu hao cho **1 đơn vị sản phẩm**, khớp với `Ingredient.unit`)

---

## 4. Logic Nghiệp vụ cho AI Agent (Business Logic & Algorithms)

Khi xây dựng tính năng hoặc truy vấn trên database này, AI Agent cần tuân thủ 2 thuật toán cốt lõi:

### 4.1. Thuật toán Tính số lượng món tối đa có thể bán (`MaxSellableQuantity`)
Với một `Product` bất kỳ ($P$), tìm tất cả các bản ghi $R_i$ trong `ProductRecipe` có `productId == P.id`:
$$\text{MaxSellable}(P) = \min_{i} \left( \left\lfloor \frac{\text{Ingredient}[R_i.\text{ingredientId}].\text{stock}}{R_i.\text{quantity}} \right\rfloor \right)$$
- *Nếu $\text{MaxSellable}(P) == 0$, cập nhật trạng thái món thành Hết hàng (`Out of Stock`).*

### 4.2. Thuật toán Trừ kho khi phát sinh đơn hàng (`OrderDeduction`)
Khi khách hàng mua $N$ ly của sản phẩm $P$:
1. Kiểm tra điều kiện: $\text{MaxSellable}(P) \ge N$.
2. Thực hiện Transaction (đảm bảo tính toàn vẹn dữ liệu):
   - Lặp qua từng dòng $R_i$ của sản phẩm $P$ trong `ProductRecipe`.
   - Cập nhật tồn kho: $\text{Ingredient}[R_i.\text{ingredientId}].\text{stock} -= (R_i.\text{quantity} \times N)$.