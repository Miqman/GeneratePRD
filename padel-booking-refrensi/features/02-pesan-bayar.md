# Pesan & Bayar

Pengguna dapat memilih slot, mengisi data pemesanan, dan melakukan pembayaran untuk mengamankan booking.

## Spesifikasi

### Tujuan
Memberikan alur lengkap bagi pelanggan untuk memilih slot lapangan, mengisi data diri, mengunggah bukti pembayaran, dan mengamankan pemesanan dengan status menunggu verifikasi admin.

### Selesai bila
- Pelanggan dapat memilih satu lapangan dan satu slot waktu yang tersedia dari kalender ketersediaan.
- Pelanggan dapat mengisi dan mengirimkan formulir pemesanan berisi nama, kontak, dan catatan.
- Pelanggan dapat mengunggah gambar bukti pembayaran dan melihat pratinjau sebelum mengirim.
- Setelah mengirim bukti bayar, sistem menampilkan halaman konfirmasi dengan ringkasan pesanan dan status "Menunggu Verifikasi".

## Sub-fitur: Pilih Slot

Memilih lapangan dan slot waktu yang diinginkan dari kalender ketersediaan.

### Tujuan
Memungkinkan pelanggan melihat ketersediaan slot pada lapangan yang dipilih dan menentukan satu slot waktu untuk dipesan.

### Selesai bila
- Pelanggan dapat melihat daftar lapangan yang tersedia dan memilih salah satu.
- Kalender menampilkan slot waktu kosong (tersedia) dan penuh (tidak bisa dipilih) untuk tanggal tertentu.
- Pelanggan dapat memilih satu slot waktu yang kosong, dan tombol "Pesan Sekarang" muncul aktif.
- Jika slot tidak dipilih, tombol pesan dinonaktifkan.

## Sub-fitur: Form Pemesanan

Mengisi detail pemesan seperti nama, kontak, dan catatan khusus.

### Tujuan
Mengumpulkan informasi kontak pemesan dan catatan khusus sebelum melanjutkan ke pembayaran.

### Selesai bila
- Formulir menampilkan kolom isian: Nama Lengkap, Nomor Telepon/Email, dan Catatan (opsional).
- Validasi sederhana: nama dan kontak wajib diisi, format kontak sesuai (email atau nomor telepon).
- Setelah mengisi dan menekan tombol "Lanjutkan ke Pembayaran", data tersimpan sementara dan halaman pembayaran muncul.
- Jika ada kolom wajib kosong, muncul pesan kesalahan di dekat kolom tersebut.

## Sub-fitur: Upload Bukti Bayar

Mengunggah bukti transfer atau tangkapan layar pembayaran.

### Tujuan
Memungkinkan pelanggan mengunggah bukti transfer pembayaran untuk diverifikasi admin.

### Selesai bila
- Terdapat area unggah dengan tombol "Pilih File" yang hanya menerima gambar (JPG, PNG, maks. 2MB).
- Setelah file dipilih, pratinjau gambar bukti bayar ditampilkan.
- Pelanggan dapat menekan tombol "Kirim Bukti Pembayaran".
- Setelah terkirim, status pemesanan berubah menjadi "Menunggu Verifikasi" dan tidak bisa diubah oleh pelanggan.

## Sub-fitur: Konfirmasi Booking

Menampilkan status pemesanan setelah pembayaran diunggah dan menunggu verifikasi admin.

### Tujuan
Menampilkan ringkasan pemesanan dan status terkini setelah pelanggan berhasil mengirim bukti pembayaran.

### Selesai bila
- Halaman menampilkan rincian: nama lapangan, tanggal, jam mulai – selesai, total harga, dan status "Menunggu Verifikasi".
- Terdapat pesan sukses: "Pemesanan berhasil! Silakan tunggu verifikasi admin."
- Tersedia tombol "Lihat Riwayat Saya" yang mengarah ke daftar riwayat booking.
- Jika halaman ini diakses ulang untuk pemesanan yang sama, tetap menampilkan informasi yang sama tanpa bisa edit.

## Task

### 1. Buat halaman pilih lapangan & slot

Buat halaman utama yang menampilkan daftar lapangan (data tiruan), kalender dengan slot waktu kosong/penuh (data tiruan), dan tombol 'Pesan Sekarang' yang hanya aktif jika slot dipilih.

### 2. Buat halaman form pemesanan

Buat halaman form yang berisi kolom Nama Lengkap, Nomor Telepon/Email, Catatan (opsional), validasi sederhana di sisi klien dengan pesan kesalahan, dan tombol 'Lanjutkan ke Pembayaran' yang menyimpan data ke state tiruan dan navigasi ke halaman upload.

### 3. Buat halaman upload bukti bayar

Buat halaman dengan area unggah file (filter JPG/PNG, maks. 2MB), pratinjau gambar setelah dipilih, tombol 'Kirim Bukti Pembayaran', dan transisi ke status 'Menunggu Verifikasi' di data tiruan.

### 4. Buat halaman konfirmasi booking

Buat halaman yang menampilkan rincian pesanan (lapangan, tanggal, jam, harga) dengan status 'Menunggu Verifikasi', pesan sukses, dan tombol 'Lihat Riwayat Saya' yang navigasi ke halaman riwayat tiruan.

### 5. Buat navigasi alur pemesanan

Integrasikan keempat halaman ke dalam satu alur (pilih slot → form → upload → konfirmasi) menggunakan state terpusat tiruan agar data mengalir antar halaman tanpa API.

### 6. Buat skema database pemesanan

Buat skema tabel pemesanan yang mencakup field: id, lapangan_id, slot_id, nama_pemesan, kontak, catatan, status (menunggu_pembayaran/menunggu_verifikasi), bukti_bayar_path, dan timestamp.

### 7. Buat endpoint daftar lapangan

Buat API GET /lapangan yang mengembalikan daftar lapangan yang tersedia.

### 8. Buat endpoint slot tersedia

Buat API GET /lapangan/:id/slots?tanggal=YYYY-MM-DD yang mengembalikan daftar slot waktu lengkap dengan status tersedia/terisi untuk tanggal tertentu.

### 9. Buat endpoint simpan pemesanan

Buat API POST /pesanan yang menerima data pemesanan (lapangan, slot, nama, kontak, catatan), menyimpan ke database, mengembalikan pesanan_id dengan status 'menunggu_pembayaran', dan menandai slot menjadi terisi.

### 10. Buat endpoint upload bukti bayar

Buat API POST /pesanan/:id/upload-bukti yang menerima file gambar (validasi JPG/PNG, maks. 2MB), menyimpan file, mengupdate status pesanan menjadi 'menunggu_verifikasi', dan mengembalikan data pesanan terbaru.

### 11. Buat endpoint detail pesanan

Buat API GET /pesanan/:id yang mengembalikan rincian lengkap pemesanan termasuk nama lapangan, tanggal, jam, harga, status, dan URL bukti bayar.
