const API = 'http://localhost:5001/api';

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
    '<option value="">Pilih alat</option>' +
    data.map(a => `<option value="${a.id_alat}">${a.nama_alat} (stok: ${a.stok})</option>`).join('');
}
