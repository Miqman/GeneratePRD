# Masuk & Daftar

Pengguna dapat membuat akun atau masuk ke akun yang sudah ada untuk mengakses fitur pribadi dan menyimpan data.

## Spesifikasi

### Tujuan
Memberikan cara aman bagi pengguna untuk mengakses akun pribadi mereka, menyimpan data pemesanan, dan membedakan peran Customer atau Admin.
### Selesai bila
- Pengguna dapat mendaftar akun baru dengan email/nomor telepon dan kata sandi, lalu langsung masuk.
- Pengguna terdaftar dapat masuk menggunakan email/nomor telepon dan kata sandi.
- Pengguna yang lupa kata sandi dapat meminta tautan reset untuk membuat kata sandi baru.
- Setelah masuk, sistem menampilkan fitur sesuai peran pengguna (Customer melihat halaman pemesanan, Admin melihat dashboard).

## Sub-fitur: Daftar Akun

Mendaftar sebagai pengguna baru dengan email atau nomor telepon.

### Tujuan
Memungkinkan pengunjung mendaftar sebagai pengguna baru agar dapat memesan lapangan dan menyimpan riwayat.
### Selesai bila
- Terdapat formulir pendaftaran dengan kolom nama, email/nomor telepon, dan kata sandi.
- Setelah mengisi formulir dengan benar, pengguna langsung masuk ke aplikasi.
- Sistem menampilkan pesan sukses dan mengarahkan ke halaman utama yang sesuai peran (Customer/Admin).

## Sub-fitur: Login

Masuk ke aplikasi menggunakan akun yang sudah terdaftar.

### Tujuan
Memungkinkan pengguna terdaftar masuk kembali ke aplikasi untuk mengakses fitur yang membutuhkan akun.
### Selesai bila
- Terdapat formulir masuk dengan kolom email/nomor telepon dan kata sandi.
- Saat data yang dimasukkan benar, pengguna diarahkan ke halaman sesuai perannya.
- Bila data salah, sistem menampilkan pesan kesalahan tanpa membocorkan informasi spesifik (misal "Email atau kata sandi salah").

## Sub-fitur: Lupa Kata Sandi

Mereset kata sandi jika pengguna lupa.

### Tujuan
Membantu pengguna yang lupa kata sandi untuk mengatur ulang kata sandi dengan aman tanpa perlu bantuan admin.
### Selesai bila
- Terdapat halaman atau formulir untuk memasukkan email/nomor telepon terdaftar.
- Setelah dikirim, sistem mengirimkan instruksi reset (misal tautan) ke kontak tersebut.
- Pengguna dapat mengatur kata sandi baru melalui tautan tersebut dan kemudian masuk dengan kata sandi baru.

## Task

### 1. Buat halaman daftar akun statis

Buat halaman pendaftaran dengan formulir berisi kolom nama, email/nomor telepon, dan kata sandi beserta tombol daftar; gunakan data tiruan lokal untuk mensimulasikan submit tanpa backend.

### 2. Buat halaman login statis

Buat halaman masuk dengan formulir berisi kolom email/nomor telepon, kata sandi, dan tombol login; gunakan data tiruan lokal untuk validasi dan mock success/error response.

### 3. Buat halaman lupa kata sandi

Buat halaman yang berisi formulir input email/nomor telepon untuk mengirim tautan reset kata sandi dan tampilkan pesan sukses berdasarkan data tiruan lokal.

### 4. Buat halaman reset kata sandi

Buat halaman yang memungkinkan pengguna memasukkan kata sandi baru melalui tautan reset, lengkap dengan konfirmasi kata sandi, menggunakan data tiruan lokal untuk simulasi proses reset.

### 5. Buat routing antar halaman auth

Hubungkan navigasi antar halaman daftar, login, dan lupa kata sandi serta atur kondisi redirect ke halaman utama sesuai peran dengan data tiruan setelah mock login/daftar berhasil.

### 6. Buat halaman utama customer tiruan

Buat halaman pemesanan lapangan kosong sebagai tampilan yang akan diakses setelah pengguna dengan peran Customer berhasil mock login/daftar.

### 7. Buat halaman dashboard admin tiruan

Buat halaman dashboard admin kosong sebagai tampilan yang akan diakses setelah pengguna dengan peran Admin berhasil mock login/daftar.

### 8. Buat migrasi tabel pengguna

Buat skema tabel pengguna yang menyimpan nama, email/nomor telepon, kata sandi terenkripsi, peran, dan token reset kata sandi beserta waktu kedaluwarsanya.

### 9. Buat endpoint daftar akun

Buat API endpoint untuk menerima data pendaftaran, validasi input, simpan pengguna baru dengan kata sandi terenkripsi, dan langsung mengembalikan sesi login.

### 10. Buat endpoint login

Buat API endpoint untuk verifikasi kredensial pengguna berdasarkan email/nomor telepon dan kata sandi, lalu kembalikan sesi login jika valid atau pesan error generik jika tidak.

### 11. Buat endpoint lupa kata sandi

Buat API endpoint yang menerima email/nomor telepon, menghasilkan token reset jika akun ditemukan, dan mengirimkan instruksi reset melalui email/SMS.

### 12. Buat endpoint reset kata sandi

Buat API endpoint yang menerima token reset dan kata sandi baru, validasi token masih berlaku, lalu perbarui kata sandi pengguna dengan enkripsi baru.

### 13. Buat middleware otentikasi

Buat middleware untuk memverifikasi sesi login pengguna pada setiap request yang membutuhkan akses terproteksi dan menyediakan data peran pengguna.
