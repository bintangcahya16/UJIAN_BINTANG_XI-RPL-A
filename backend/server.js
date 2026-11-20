require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();
app.use(cors());
app.use(express.json());

// get data
//semua alat
app.get("/api/alat", async (req, res) => {
    try {
        const data = await pool.query(`
            SELECT a.*, k.nama_kategori
            FROM alat a
            LEFT JOIN kategori_alat k
            ON a.id_kategori = k.id_kategori
            ORDER BY a.id_alat
        `);
        res.json(data.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//semua kategori
app.get("/api/kategori_alat", async (req, res) => {
    try {
        const data = await pool.query(
            "SELECT * FROM kategori_alat ORDER BY id_kategori"
        );
        res.json(data.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//semua peminjaman
app.get("/api/peminjaman", async (req, res) => {
    try {
        const data = await pool.query(`
            SELECT p.*, a.nama_alat
            FROM peminjaman p
            JOIN alat a ON p.id_alat = a.id_alat
            ORDER BY p.id_peminjaman DESC
        `);
        res.json(data.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tambah data
//alat baru
app.post("/api/alat", async (req, res) => {
    const { id_kategori, nama_alat, kondisi, stok, lokasi } = req.body;
    try {
        const data = await pool.query(
            `INSERT INTO alat
            (id_kategori, nama_alat, kondisi, stok, lokasi)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id_kategori, nama_alat, kondisi, stok, lokasi]
        );
        res.status(201).json(data.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//peminjaman baru
app.post("/api/peminjaman", async (req, res) => {
    const { id_alat, nama_peminjam, kelas, jumlah } = req.body;
    try {
        const data = await pool.query(
            `INSERT INTO peminjaman
            (id_alat, nama_peminjam, kelas, jumlah)
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [id_alat, nama_peminjam, kelas, jumlah]
        );
        res.status(201).json(data.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//update data
//alat
app.patch("/api/alat/:id", async (req, res) => {
    const kolom = ["id_kategori", "nama_alat", "kondisi", "stok", "lokasi"];
    const fields = Object.keys(req.body).filter(k => kolom.includes(k));
    if (!fields.length) {
        return res.status(400).json({ error: "Data tidak ditemukan!" });
    }try {
        const values = fields.map(k => req.body[k]);
        const set = fields.map((k, i) => `${k} = $${i + 1}`).join(", ");
        values.push(req.params.id);
        const data = await pool.query(
            `UPDATE alat SET ${set}
            WHERE id_alat = $${values.length} RETURNING *`,
            values
        );
        if (!data.rowCount) {
            return res.status(404).json({ error: "Alat tidak ditemukan!" });
        }
        res.json(data.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//kategori
app.patch("/api/kategori_alat/:id", async (req, res) => {
    try {
        const data = await pool.query(
            `UPDATE kategori_alat
            SET nama_kategori = $1
            WHERE id_kategori = $2 RETURNING *`,
            [req.body.nama_kategori, req.params.id]
        );
        if (!data.rowCount) {
            return res.status(404).json({ error: "Kategori tidak ditemukan!" });
        }
        res.json(data.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//alat
app.patch("/api/peminjaman/:id/kembali", async (req, res) => {
    try {
        const data = await pool.query(
            `UPDATE peminjaman
            SET status = 'Dikembalikan',
                tanggal_kembali = CURRENT_DATE
            WHERE id_peminjaman = $1
            AND status = 'Dipinjam'
            RETURNING *`,
            [req.params.id]
        );
        if (!data.rowCount) {
            return res.status(404).json({
                error: "Data tidak ditemukan atau sudah dikembalikan!"
            });
        }
        res.json(data.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//delete hapus data
//alat
app.delete("/api/alat/:id", async (req, res) => {
    try {
        const data = await pool.query(
            "DELETE FROM alat WHERE id_alat = $1 RETURNING *",
            [req.params.id]
        );
        if (!data.rowCount) {
            return res.status(404).json({ error: "Alat tidak ditemukan!" });
        }
        res.json({ message: "Alat berhasil dihapus!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//kategori
app.delete("/api/kategori_alat/:id", async (req, res) => {
    try {
        const data = await pool.query(
            "DELETE FROM kategori_alat WHERE id_kategori = $1 RETURNING *",
            [req.params.id]
        );
        if (!data.rowCount) {
            return res.status(404).json({ error: "Kategori tidak ditemukan!" });
        }
        res.json({ message: "Kategori berhasil dihapus!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//peminjaman
app.delete("/api/peminjaman/:id", async (req, res) => {
    try {
        const data = await pool.query(
            `DELETE FROM peminjaman
            WHERE id_peminjaman = $1
            AND status = 'Dikembalikan'
            RETURNING *`,
            [req.params.id]
        );
        if (!data.rowCount) {
            return res.status(400).json({
                error: "Data tidak ditemukan atau alat belum dikembalikan!"
            });
        }
        res.json({ message: "Peminjaman berhasil dihapus!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// server
app.get("/", (req, res) => {
    res.send("Server Peminjaman Alat Praktik Berhasil!");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
