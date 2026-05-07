# Template Email Approval PR / PO

Dokumen ini mendefinisikan template email approval untuk `Purchase Request` dan `Purchase Order`.

## Tujuan

Email dipakai untuk:

- meminta approver melakukan review dokumen PR atau PO
- menyediakan tombol `Approve` dan `Reject` langsung dari email
- mengubah status dokumen di sistem saat tombol diklik

## File Template

- HTML preview: [approval-email-template.html](./approval-email-template.html)

## Placeholder Utama

- `{{app_name}}`
- `{{company_name}}`
- `{{document_type}}`
- `{{document_number}}`
- `{{document_status}}`
- `{{requester_name}}`
- `{{requester_department}}`
- `{{vendor_name}}`
- `{{created_at}}`
- `{{approval_deadline}}`
- `{{document_total}}`
- `{{document_summary}}`
- `{{line_items_html}}`
- `{{note_html}}`
- `{{view_document_url}}`
- `{{approve_url}}`
- `{{reject_url}}`
- `{{approval_token}}`

## Mekanisme Approve / Reject

Tombol dalam email harus mengarah ke endpoint backend yang memvalidasi token approver lalu mengubah status dokumen.

Contoh pola URL:

```text
{{app_base_url}}/approval/respond?action=approve&token={{approval_token}}
{{app_base_url}}/approval/respond?action=reject&token={{approval_token}}
```

## Alur yang Disarankan

1. User membuat `PR` atau `PO`
2. Sistem membuat record approval untuk approver terkait
3. Sistem generate `approval_token` unik per approver
4. Email dikirim memakai template ini
5. Approver klik `Approve` atau `Reject`
6. Backend validasi token, approver, status dokumen, dan masa berlaku link
7. Backend update status approval dan status dokumen utama
8. Sistem simpan audit trail: siapa, kapan, dari link mana, aksi apa

## Aturan Backend yang Disarankan

- token approval harus unik per approver
- token harus punya masa berlaku
- token tidak boleh bisa dipakai ulang setelah status final
- approver yang sama tidak boleh approve dua kali
- reject boleh langsung final, atau diarahkan ke halaman konfirmasi bila wajib isi alasan

## Contoh Update Status

### Jika dokumen adalah PR

- klik `Approve`:
  - update approval row menjadi `approved`
  - jika semua approver selesai, update `PR.status = Approved`
- klik `Reject`:
  - update approval row menjadi `rejected`
  - update `PR.status = Rejected`

### Jika dokumen adalah PO

- klik `Approve`:
  - update approval row menjadi `approved`
  - jika semua approver selesai, update `PO.status = Approved`
- klik `Reject`:
  - update approval row menjadi `rejected`
  - update `PO.status = Rejected`

## Catatan MVP Repo Ini

Repo saat ini belum punya backend approval yang nyata, jadi template ini masih berupa:

- desain HTML email siap render
- kontrak placeholder
- rekomendasi endpoint integrasi approval

Langkah implementasi berikutnya yang paling cocok:

1. buat endpoint `/approval/respond`
2. buat tabel `approval_requests`
3. generate token signed untuk setiap approver
4. kirim email dari service backend
