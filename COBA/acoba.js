const API = 'http://localhost:5001/api';

// ambil data alat
async function loadAlat() {
  const res = await fetch(`${API}/alat`);
  const data = await res.json();

  document.getElementById('tabelAlat').innerHTML = data.map(a => `
    <tr class="border-b">
      <td class="p-2">${a.nama_alat}</td>
      <td class="p-2">${a.nama_kategori}</td>
      <td class="p-2">${a.kondisi}</td>
      <td class="p-2">${a.stok}</td>
      <td class="p-2">${a.lokasi}</td>
    </tr>`).join('');

  document.getElementById('id_alat').innerHTML =
    '<option value=""> Pilih alat </option>' +
    data.map(a => `<option value="${a.id_alat}">${a.nama_alat} (stok: ${a.stok})</option>`).join('');
}

// ambil riwayat peminjaman
async function loadPeminjaman() {
  const res = await fetch(`${API}/peminjaman`);
  const data = await res.json();

  document.getElementById('tabelPinjam').innerHTML = data.map(p => `
    <tr class="border-b">
      <td class="p-2">${p.nama_peminjam}</td>
      <td class="p-2">${p.kelas}</td>
      <td class="p-2">${p.nama_alat}</td>
      <td class="p-2">${p.jumlah}</td>
      <td class="p-2">${new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</td>
      <td class="p-2">${p.status}</td>
      <td class="p-2">
        ${p.status === 'Dipinjam'
          ? `<button onclick="kembalikan(${p.id_peminjaman})" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Kembalikan</button>`
          : '-'}
      </td>
    </tr>`).join('');
}

// kirim form peminjaman
document.getElementById('formPinjam').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pesan = document.getElementById('pesan');
  const body = {
    id_alat: Number(document.getElementById('id_alat').value),
    nama_peminjam: document.getElementById('nama_peminjam').value,
    kelas: document.getElementById('kelas').value,
    jumlah: Number(document.getElementById('jumlah').value),
  };

  try {
    const res = await fetch(`${API}/peminjaman`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      pesan.textContent = 'Peminjaman berhasil!';
      pesan.className = 'mt-3 text-sm text-green-600';
      e.target.reset();
    } else {
      pesan.textContent = data.error;
      pesan.className = 'mt-3 text-sm text-red-600';
    }
  } catch (err) {
    pesan.textContent = 'Gagal terhubung ke server';
    pesan.className = 'mt-3 text-sm text-red-600';
  }
  loadAlat();
  loadPeminjaman();
});

// kembalikan alat
async function kembalikan(id) {
  await fetch(`${API}/peminjaman/${id}/kembali`, { method: 'PUT' });
  loadAlat();
  loadPeminjaman();
}

// jalankan saat halaman dibuka
loadAlat();
loadPeminjaman();