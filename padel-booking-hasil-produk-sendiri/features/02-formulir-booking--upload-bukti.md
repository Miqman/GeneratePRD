# Formulir Booking & Upload Bukti

**Fase:** Fase 1 | **Prioritas:** high

## Deskripsi
Alur checkout untuk data pemesan dan upload bukti transfer.

## Tujuan
Pemain memesan slot dan unggah bukti bayar manual.

## Selesai Bila
- Slot terkunci 10 menit via Redis saat checkout
- Form menerima data diri dan gambar
- Data tersimpan dengan status Menunggu Verifikasi

## Sub-fitur
### Form Data Diri
Input nama dan WhatsApp.

### Upload Bukti
Unggah gambar bukti transfer bank.

### Temporary Lock
Kunci slot 10 menit mencegah double-booking.