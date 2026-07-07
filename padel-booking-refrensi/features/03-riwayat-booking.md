# Riwayat Booking

Pengguna dapat melihat daftar pemesanan yang pernah dilakukan beserta statusnya.

## Spesifikasi

### Tujuan
Pengguna dapat memantau seluruh pemesanan yang pernah dibuat beserta status terkini tanpa harus menghubungi admin.

### Selesai bila
- Daftar seluruh pemesanan pengguna ditampilkan dalam satu halaman, mencakup yang masih aktif maupun yang sudah selesai.
- Setiap pemesanan menampilkan ringkasan: tanggal, nama lapangan, slot jam, dan status (mis: Menunggu Pembayaran, Dikonfirmasi, Dibatalkan).
- Pengguna dapat menekan item mana pun untuk melihat rincian lengkap pemesanan.
- Status setiap pemesanan diperbarui otomatis saat admin mengonfirmasi atau pengguna membatalkan.
- Opsi batalkan pesanan hanya muncul pada pemesanan yang masih bisa dibatalkan.

## Sub-fitur: Daftar Riwayat

Menampilkan semua booking sebelumnya, baik yang sudah selesai maupun yang masih tertunda.

### Tujuan
Menampilkan daftar semua pemesanan yang telah dibuat pengguna agar mudah dipantau.

### Selesai bila
- Daftar menampilkan seluruh booking milik pengguna yang sedang login, tidak ada yang terlewat.
- Setiap item menampilkan: tanggal booking, nama lapangan, jam main, dan status terbaru.
- Status ditampilkan dengan label yang mudah dimengerti, seperti "Menunggu Pembayaran", "Dikonfirmasi", atau "Dibatalkan".

## Sub-fitur: Detail Booking

Melihat rincian pemesanan tertentu termasuk tanggal, lapangan, dan status pembayaran.

### Tujuan
Memberikan informasi lengkap tentang satu pemesanan untuk verifikasi atau referensi pribadi pengguna.

### Selesai bila
- Pengguna dapat membuka halaman detail dari daftar riwayat dengan menekan salah satu item.
- Halaman detail menampilkan: nama lapangan, tanggal, waktu mulai - selesai, total harga, status pembayaran, dan bukti pembayaran jika sudah diunggah.
- Jika status "Menunggu Verifikasi", ditampilkan pesan bahwa admin sedang memeriksa pembayaran.

## Sub-fitur: Batalkan Pesanan

Opsi untuk membatalkan booking yang masih bisa dibatalkan.

### Tujuan
Memberikan kontrol kepada pengguna untuk membatalkan pemesanan yang belum dikonfirmasi atau masih dalam batas kebijakan.

### Selesai bila
- Tombol "Batalkan Pesanan" muncul di halaman detail hanya jika status pemesanan masih memungkinkan (misal: "Pending" atau "Menunggu Pembayaran").
- Setelah pengguna mengonfirmasi pembatalan, status berubah menjadi "Dibatalkan" dan slot waktu tersebut kembali tersedia.
- Pengguna menerima pesan sukses dan daftar riwayat langsung diperbarui tanpa perlu memuat ulang.

## Task

### 1. Buat halaman daftar riwayat booking

Buat halaman yang menampilkan daftar seluruh booking pengguna yang sedang login menggunakan data tiruan, menampilkan tanggal, nama lapangan, slot jam, dan status dengan label yang mudah dimengerti.

### 2. Buat halaman detail booking

Buat halaman untuk menampilkan detail lengkap satu booking menggunakan data tiruan, termasuk nama lapangan, tanggal, waktu mulai-selesai, total harga, status pembayaran, dan bukti pembayaran jika ada.

### 3. Hubungkan daftar riwayat ke detail

Tambahkan navigasi dari item daftar riwayat ke halaman detail booking, sehingga saat pengguna menekan item, aplikasi berpindah ke rute detail dengan data booking yang sesuai.

### 4. Tampilkan pesan status verifikasi

Tambahkan pesan 'Admin sedang memeriksa pembayaran' di halaman detail jika status booking adalah 'Menunggu Verifikasi'.

### 5. Tampilkan tombol batalkan secara kondisional

Tampilkan tombol 'Batalkan Pesanan' di halaman detail hanya jika status booking adalah 'Pending' atau 'Menunggu Pembayaran'.

### 6. Implementasikan konfirmasi dan pembatalan booking

Implementasikan aksi pembatalan dengan konfirmasi pengguna, lalu perbarui status booking menjadi 'Dibatalkan' di data tiruan dan perbarui tampilan halaman detail tanpa memuat ulang.

### 7. Buat skema dan migrasi tabel bookings

Buat skema database dan migrasi untuk tabel bookings yang mencakup kolom id, user_id, nama lapangan, tanggal, slot waktu, status, total_harga, dan bukti_pembayaran.

### 8. Buat endpoint daftar booking user

Buat endpoint API untuk mengambil daftar booking milik pengguna yang sedang login, mengembalikan data ringkasan (tanggal, lapangan, slot, status).

### 9. Buat endpoint detail booking

Buat endpoint API untuk mengambil detail satu booking berdasarkan ID, termasuk informasi lengkap dan status pembayaran, dengan otentikasi dan pengecekan kepemilikan.

### 10. Buat endpoint pembatalan booking

Buat endpoint API untuk membatalkan booking, mengubah status menjadi 'Dibatalkan' dan mengembalikan slot waktu menjadi tersedia, dengan validasi bahwa status saat ini memungkinkan pembatalan.
