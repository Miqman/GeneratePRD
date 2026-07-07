# Jelajah Slot

Pengguna dapat melihat daftar lapangan padel beserta jadwal ketersediaan slot waktu secara real-time.

## Spesifikasi

### Tujuan
Menyediakan tampilan real-time bagi pengguna untuk melihat lapangan padel yang tersedia beserta slot waktu kosongnya, sehingga pengguna bisa langsung tahu kapan dan di mana bisa bermain tanpa perlu bertanya ke admin.
### Selesai bila
- Pengguna membuka halaman dan langsung melihat daftar lapangan padel yang aktif.
- Pengguna dapat memilih tanggal dan langsung melihat slot waktu yang masih kosong untuk setiap lapangan di tanggal tersebut.
- Pengguna dapat membuka halaman detail satu lapangan yang menampilkan fasilitas, harga per jam, dan lokasi lapangan.
- Semua informasi slot dan lapangan yang ditampilkan selalu sesuai dengan data pesanan terbaru (real-time).

## Sub-fitur: Daftar Lapangan

Menampilkan semua lapangan padel yang tersedia dengan informasi singkat.

### Tujuan
Menampilkan daftar semua lapangan padel yang tersedia dan aktif agar pengguna bisa dengan mudah melihat dan memilih lapangan yang ingin dipesan.
### Selesai bila
- Halaman menampilkan daftar lapangan dalam bentuk kartu atau daftar yang rapi, masing-masing berisi nama lapangan, harga per jam, dan status "Tersedia".
- Setiap kartu lapangan bisa diklik untuk menuju ke halaman detail lapangan tersebut.

## Sub-fitur: Kalender Slot

Memilih tanggal dan melihat slot waktu yang kosong untuk setiap lapangan.

### Tujuan
Memungkinkan pengguna memilih tanggal tertentu dan langsung melihat slot waktu yang masih kosong untuk setiap lapangan tanpa harus mengecek satu per satu secara manual.
### Selesai bila
- Pengguna dapat memilih tanggal melalui pemilih kalender atau tampilan tanggal yang mudah diakses.
- Setelah tanggal dipilih, daftar slot waktu kosong muncul untuk setiap lapangan (misalnya per jam: 08:00–09:00, 09:00–10:00, dst).
- Slot waktu yang sudah dipesan orang lain tidak muncul atau ditandai dengan jelas sebagai "Sudah Dipesan" dan tidak bisa dipilih.

## Sub-fitur: Detail Lapangan

Menampilkan informasi lengkap lapangan seperti fasilitas, harga per jam, dan lokasi.

### Tujuan
Memberikan informasi lengkap satu lapangan, termasuk fasilitas, harga per jam, dan lokasi, supaya pengguna yakin sebelum memutuskan untuk memesan.
### Selesai bila
- Halaman menampilkan nama lapangan, foto atau ilustrasi lapangan (jika ada), daftar fasilitas, harga per jam, dan lokasi (bisa berupa teks alamat atau peta sederhana).
- Halaman ini bisa diakses langsung dari daftar lapangan atau kalender slot.

## Task

### 1. Buat halaman utama Jelajah Slot dengan data tiruan

Bangun halaman utama yang menampilkan daftar lapangan padel dalam bentuk kartu menggunakan data tiruan, tanpa interaksi slot atau backend.

### 2. Tambahkan pemilih tanggal dan tampilan slot

Implementasikan komponen pemilih tanggal dan tampilkan slot waktu kosong per lapangan berdasarkan tanggal yang dipilih menggunakan data tiruan pemesanan.

### 3. Buat halaman detail lapangan

Buat halaman detail yang menampilkan informasi lengkap lapangan (nama, fasilitas, harga, lokasi) dari data tiruan, dapat diakses dari kartu lapangan.

### 4. Integrasikan navigasi antara daftar dan detail

Atur routing agar pengguna dapat berpindah dari daftar lapangan ke halaman detail dan kembali dengan lancar.

### 5. Poles tampilan dan responsivitas halaman

Perbaiki tata letak, gaya, dan pastikan halaman responsif di berbagai perangkat.

### 6. Rancang skema basis data untuk lapangan dan slot

Buat model database untuk lapangan (nama, harga, fasilitas, lokasi) dan pemesanan/slot untuk melacak ketersediaan waktu.

### 7. Buat API daftar lapangan

Bangun endpoint REST untuk mengembalikan daftar lapangan aktif dengan informasi dasar.

### 8. Buat API ketersediaan slot berdasarkan tanggal

Bangun endpoint yang menerima parameter tanggal dan mengembalikan slot waktu yang masih kosong untuk setiap lapangan.

### 9. Buat API detail lapangan

Bangun endpoint untuk mengembalikan informasi lengkap satu lapangan termasuk fasilitas, harga, dan lokasi.

### 10. Implementasikan mekanisme real-time untuk slot

Tambahkan dukungan pembaruan data slot secara langsung (misalnya dengan polling pendek atau Server-Sent Events) agar tampilan selalu sinkron dengan pesanan terbaru.

### 11. Isi data awal dan seeding

Siapkan seeder untuk mengisi data lapangan contoh dan beberapa slot agar pengujian mudah.
