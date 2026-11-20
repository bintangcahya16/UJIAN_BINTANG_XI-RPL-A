const API = "http://localhost:5001/api";
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Terjadi kesalahan");
  }
  return data;
}
function aman(teks) {
  return String(teks ?? "").replace(/[&<>"']/g, karakter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[karakter]);
}

async function loadKategori() {
  const data = await request(`${API}/kategori_alat`);

  document.getElementById("id_kategori").innerHTML =
    '<option value="">Pilih kategori</option>' +
    data.map(k => `
      <option value="${k.id_kategori}">
        ${aman(k.nama_kategori)}
      </option>
    `).join("");
}

async function loadAlat() {
  const data = await request(`${API}/alat`);

  document.getElementById("tabelAlat").innerHTML = data.map(a => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-medium">${aman(a.nama_alat)}</td>
      <td class="p-3">${aman(a.nama_kategori)}</td>
      <td class="p-3">${aman(a.kondisi)}</td>
      <td class="p-3">${aman(a.stok)}</td>
      <td class="p-3">${aman(a.lokasi)}</td>
      <td class="p-3 whitespace-nowrap">
        <button onclick="editAlat(${a.id_alat})"
          class="text-blue-600 hover:underline mr-2">Edit</button>
        <button onclick="hapusAlat(${a.id_alat})"
          class="text-red-600 hover:underline">Hapus</button>
      </td>
    </tr>
  `).join("") || `
    <tr><td colspan="6" class="p-4 text-center text-slate-400">
      Belum ada data alat.
    </td></tr>
  `;

  document.getElementById("pilih_alat").innerHTML =
    '<option value="">Pilih alat</option>' +
    data.map(a => `
      <option value="${a.id_alat}" ${Number(a.stok) <= 0 ? "disabled" : ""}>
        ${aman(a.nama_alat)} (Stok: ${aman(a.stok)})
      </option>
    `).join("");

  document.getElementById("totalAlat").textContent = data.length;
  document.getElementById("totalStok").textContent =
    data.reduce((total, a) => total + Number(a.stok || 0), 0);
}

async function loadPeminjaman() {
  const data = await request(`${API}/peminjaman`);
  document.getElementById("tabelPinjam").innerHTML = data.map(p => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-medium">${aman(p.nama_peminjam)}</td>
      <td class="p-3">${aman(p.kelas)}</td>
      <td class="p-3">${aman(p.nama_alat)}</td>
      <td class="p-3">${aman(p.jumlah)}</td>
      <td class="p-3">${p.tanggal_pinjam ? new Date(p.tanggal_pinjam).toLocaleDateString("id-ID") : "-"}</td>
      <td class="p-3">
        <span class="px-2 py-1 rounded-full text-xs ${
          p.status === "Dikembalikan"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }">
          ${aman(p.status)}
        </span>
      </td>
      <td class="p-3 whitespace-nowrap">
        ${
          p.status === "Dipinjam"
            ? `<button onclick="kembalikan(${p.id_peminjaman})"
                class="text-green-600 hover:underline">Kembalikan</button>`
            : `<button onclick="hapusPeminjaman(${p.id_peminjaman})"
                class="text-red-600 hover:underline">Hapus</button>`
        }
      </td>
    </tr>
  `).join("") || `
    <tr><td colspan="7" class="p-4 text-center text-slate-400">
      Belum ada riwayat peminjaman.
    </td></tr>
  `;
  document.getElementById("totalPinjam").textContent =
    data.filter(p => p.status === "Dipinjam").length;
}
async function loadData() {
  try {
    await Promise.all([
      loadKategori(),
      loadAlat(),
      loadPeminjaman()
    ]);
  } catch (err) {
    tampilPesan(err.message, false);
  }
}
function tampilPesan(teks, berhasil = true) {
  const pesan = document.getElementById("pesan");
  pesan.textContent = teks;
  pesan.className = `text-sm text-center ${
    berhasil ? "text-green-600" : "text-red-600"
  }`;
}

// tambah alat
document.getElementById("formAlat").addEventListener("submit", async function(e) {
  e.preventDefault();
  const data = {
    id_kategori: Number(document.getElementById("id_kategori").value),
    nama_alat: document.getElementById("nama_alat").value,
    kondisi: document.getElementById("kondisi").value,
    stok: Number(document.getElementById("stok").value),
    lokasi: document.getElementById("lokasi").value
  };
  try {
    await request(`${API}/alat`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    this.reset();
    tampilPesan("Data alat berhasil ditambahkan.");
    await loadData();
  } catch (err) {
    tampilPesan(err.message, false);
  }
});

// tambah peminjaman
document.getElementById("formPinjam").addEventListener("submit", async function(e) {
  e.preventDefault();
  const data = {
    id_alat: Number(document.getElementById("pilih_alat").value),
    nama_peminjam: document.getElementById("nama_peminjam").value,
    kelas: document.getElementById("kelas").value,
    jumlah: Number(document.getElementById("jumlah").value)
  };
  try {
    await request(`${API}/peminjaman`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    this.reset();
    tampilPesan("Peminjaman berhasil ditambahkan.");
    await loadData();
  } catch (err) {
    tampilPesan(err.message, false);
  }
});

// edit alat
async function editAlat(id) {
  const nama = prompt("Masukkan nama alat baru:");
  if (nama === null || !nama.trim()) return;
  try {
    await request(`${API}/alat/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ nama_alat: nama.trim() })
    });
    tampilPesan("Data alat berhasil diperbarui.");
    await loadData();
  } catch (err) {
    tampilPesan(err.message, false);
  }
}

// hapus alat
async function hapusAlat(id) {
  if (!confirm("Yakin ingin menghapus alat ini?")) return;

  try {
    await request(`${API}/alat/${id}`, { method: "DELETE" });
    tampilPesan("Data alat berhasil dihapus.");
    await loadData();
  } catch (err) {
    tampilPesan(err.message, false);
  }
}

// PENGEMBALIAN
async function kembalikan(id) {
  if (!confirm("Konfirmasi pengembalian alat?")) return;
  try {
    await request(`${API}/peminjaman/${id}/kembali`, {
      method: "PATCH"
    });
    tampilPesan("Alat berhasil dikembalikan.");
    await loadData();
  } catch (err) {
    tampilPesan(err.message, false);
  }
}

// hapus peminjaman
async function hapusPeminjaman(id) {
  if (!confirm("Yakin ingin menghapus riwayat ini?")) return;
  try {
    await request(`${API}/peminjaman/${id}`, {
      method: "DELETE"
    });
    tampilPesan("Riwayat peminjaman berhasil dihapus.");
    await loadData();
  } catch (err) {
    tampilPesan(err.message, false);
  }
}
loadData();
