# Dashboard Admin

Admin dapat mengelola slot lapangan, melihat semua pesanan, dan mengkonfirmasi pembayaran.

## Spesifikasi

### Tujuan
Admin dapat memantau dan mengelola seluruh aktivitas pemesanan serta ketersediaan lapangan dari satu tempat terpusat, mulai dari mengatur jadwal, memverifikasi pembayaran, hingga memantau ringkasan bisnis.

### Selesai bila
- Admin bisa membuka halaman dashboard yang hanya bisa diakses setelah login dengan akun admin.
- Dashboard menampilkan menu navigasi menuju sub-fitur: Kelola Slot, Verifikasi Pembayaran, Semua Pesanan, dan Laporan Singkat.
- Setiap sub-fitur menampilkan data yang sesuai dan berfungsi penuh (menambah, mengubah, atau mengonfirmasi data) tanpa error.

## Sub-fitur: Kelola Slot

Mengatur jadwal buka-tutup lapangan dan slot waktu yang tersedia.

### Tujuan
Admin dapat dengan mudah mengatur jadwal ketersediaan lapangan, termasuk menutup sementara lapangan atau mengubah slot waktu, sehingga pelanggan hanya melihat jadwal yang akurat.

### Selesai bila
- Admin melihat daftar semua lapangan dan bisa mengganti status aktif/nonaktif (misalnya untuk pemeliharaan) hanya dengan satu klik.
- Admin dapat memilih lapangan tertentu, lalu mengatur jadwal buka dan tutup slot waktu per hari melalui antarmuka yang jelas.

## Sub-fitur: Verifikasi Pembayaran

Melihat bukti bayar yang diunggah dan mengonfirmasi atau menolak pembayaran.

### Tujuan
Admin dapat memproses bukti pembayaran yang diunggah pelanggan untuk mengubah status pemesanan menjadi "Dikonfirmasi" atau "Ditolak" dengan cepat.

### Selesai bila
- Admin melihat daftar pemesanan yang menunggu verifikasi, masing-masing menampilkan nama pemesan dan lapangan yang dipesan.
- Admin dapat melihat bukti bayar (gambar/tangkapan layar) dari setiap pesanan di tampilan yang sama.
- Setelah memeriksa, admin bisa menekan tombol "Konfirmasi" atau "Tolak" dan status pemesanan langsung berubah sesuai tindakan yang dipilih.

## Sub-fitur: Semua Pesanan

Melihat daftar seluruh booking dari semua pengguna.

### Tujuan
Admin dapat mengakses seluruh data pemesanan dari semua pelanggan untuk melacak, memantau, dan mencari pemesanan tertentu tanpa batasan.

### Selesai bila
- Admin melihat daftar lengkap semua pemesanan yang pernah dibuat, diurutkan dari yang terbaru.
- Setiap baris daftar menampilkan informasi ringkas: nama pemesan, nama lapangan, tanggal, jam main, status pembayaran terkini.
- Admin dapat mencari atau menyaring daftar pemesanan berdasarkan nama pemesan atau status tertentu (misalnya, "Menunggu", "Dikonfirmasi", "Dibatalkan").

## Sub-fitur: Laporan Singkat

Melihat ringkasan pemesanan harian/mingguan.

### Tujuan
Admin mendapatkan ringkasan bisnis harian dan mingguan untuk memantau performa pemesanan tanpa perlu menghitung manual.

### Selesai bila
- Admin melihat panel ringkasan yang menampilkan total pemesanan yang sukses untuk hari ini dan minggu ini.
- Ringkasan menampilkan total pendapatan (dalam Rupiah) yang dihasilkan hari ini dan minggu ini dari pemesanan yang sudah dikonfirmasi.

## Task

### 1. Buat layout dan halaman utama Dashboard Admin

Membuat halaman dashboard admin yang hanya dapat diakses setelah login, lengkap dengan kerangka layout, header, sidebar, dan area konten menggunakan data tiruan.

### 2. Buat navigasi menu sub-fitur

Membangun komponen navigasi (sidebar atau tab) yang mengarahkan ke sub-fitur: Kelola Slot, Verifikasi Pembayaran, Semua Pesanan, dan Laporan Singkat dengan tautan yang berfungsi.

### 3. Implementasi halaman Kelola Slot

Menampilkan daftar semua lapangan beserta tombol untuk mengganti status aktif/nonaktif dan antarmuka mengatur jadwal buka-tutup slot waktu per hari, seluruhnya menggunakan data tiruan.

### 4. Implementasi halaman Verifikasi Pembayaran

Menampilkan daftar pemesanan yang menunggu verifikasi, lengkap dengan gambar bukti bayar, serta tombol Konfirmasi dan Tolak untuk mengubah status menggunakan data tiruan.

### 5. Implementasi halaman Semua Pesanan

Menampilkan daftar seluruh pemesanan terurut dari terbaru dengan informasi ringkas dan fitur pencarian/penyaringan berdasarkan nama pemesan atau status, menggunakan data tiruan.

### 6. Implementasi halaman Laporan Singkat

Menampilkan panel ringkasan berisi total pemesanan sukses dan total pendapatan hari ini serta minggu ini yang dihitung dari data tiruan.

### 7. Buat guard rute admin dengan data tiruan

Membuat mekanisme penjagaan rute yang hanya mengizinkan akses ke halaman dashboard jika pengguna memiliki peran admin, menggunakan data tiruan (misalnya token atau status di localStorage).

### 8. Buat skema database untuk lapangan dan slot

Merancang dan membuat skema database untuk entitas lapangan, slot waktu, pemesanan, bukti pembayaran, dan status yang diperlukan oleh fitur admin.

### 9. Buat migrasi database awal

Membuat script migrasi untuk membuat tabel-tabel yang diperlukan sesuai skema yang telah dirancang.

### 10. Implementasi autentikasi dan otorisasi admin

Membangun sistem login untuk admin dengan JWT dan middleware yang membatasi akses ke endpoint dashboard hanya untuk akun admin.

### 11. Buat API kelola slot lapangan

Menyediakan endpoint untuk membaca daftar lapangan, mengubah status aktif/nonaktif lapangan, serta mengatur jadwal buka-tutup slot per hari.

### 12. Buat API verifikasi pembayaran

Menyediakan endpoint untuk mengambil daftar pemesanan yang menunggu verifikasi, melihat bukti bayar, serta mengonfirmasi atau menolak pembayaran dan memperbarui status pemesanan.

### 13. Buat API semua pesanan

Menyediakan endpoint untuk mengambil seluruh data pemesanan dengan dukungan pencarian dan penyaringan berdasarkan nama pemesan atau status, diurutkan dari terbaru.

### 14. Buat API laporan singkat

Menyediakan endpoint yang mengembalikan total pemesanan sukses dan total pendapatan untuk hari ini dan minggu ini dari pemesanan yang sudah dikonfirmasi.
