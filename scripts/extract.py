"""
Word (.docx) sözlük dosyalarından kelimeleri çıkarıp data/vocab.json üretir.

Kullanım:
    pip install python-docx
    python scripts/extract.py

Her .docx dosyası tek bir 4 sütunlu tablo içerir ve iki yan yana
"Türkçe | Özbekçe" kelime çiftinden oluşur. İSİMLER / FİİLLER / KALIP İFADELER
gibi başlık satırları kategori olarak algılanır.
"""

import glob
import json
import os
import re
import unicodedata

import docx  # python-docx

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "vocabulary-source")
OUT = os.path.join(ROOT, "data", "vocab.json")

CATS = {
    "isimler": ("İsimler", "Otlar"),
    "fiiller": ("Fiiller", "Feʼllar"),
    "kalip ifadeler": ("Kalıp İfadeler", "Iboralar"),
    "sifatlar": ("Sıfatlar", "Sifatlar"),
    "zarflar": ("Zarflar", "Ravishlar"),
    "zamirler": ("Zamirler", "Olmoshlar"),
    "edatlar": ("Edatlar", "Koʻmakchilar"),
    "baglaclar": ("Bağlaçlar", "Bogʻlovchilar"),
    "unlemler": ("Ünlemler", "Undovlar"),
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace("İ", "I").replace("ı", "i").replace("I", "i").lower().strip()


def clean(x: str) -> str:
    return re.sub(r"\s+", " ", x.replace("\n", " ").replace("\xa0", " ")).strip()


def meta(fname: str):
    m = re.search(r"[Üü]nite\s*(\d+)", fname)
    num = m.group(1) if m else "?"
    level = "A2" if "yeni" in fname.lower() else "A1"
    return num, level


def parse(path: str):
    doc = docx.Document(path)
    entries = []
    # Her sütun çifti bağımsız bir alfabetik listedir; kategori başlıkları
    # yalnızca kendi sütunları içinde geçerlidir — bu yüzden her sütunda sıfırla.
    for cp in [(0, 1), (2, 3)]:  # iki sütun çifti: önce sol, sonra sağ
        cur = None
        for row in doc.tables[0].rows:
            cells = row.cells
            if len(cells) <= cp[1]:
                continue
            a, b = clean(cells[cp[0]].text), clean(cells[cp[1]].text)
            if not a and not b:
                continue
            na = norm(a)
            if na in CATS and (not b or norm(b) == na):
                cur = na
                continue
            if a and b:
                entries.append((cur, a, b))
    return entries


def main():
    data = {"units": []}
    for f in sorted(glob.glob(os.path.join(SRC, "*.docx"))):
        fname = os.path.basename(f)
        num, level = meta(fname)
        order, cmap = [], {}
        for cur, tr, uz in parse(f):
            k = cur or "_other"
            cmap.setdefault(k, [])
            if k not in order:
                order.append(k)
            cmap[k].append({"tr": tr, "uz": uz})

        cats = []
        for k in order:
            name, name_uz = (
                ("Yeni Kelimeler", "Yangi soʻzlar") if k == "_other" else CATS[k]
            )
            # tekilleştir
            seen, words = set(), []
            for w in cmap[k]:
                key = (w["tr"].lower(), w["uz"].lower())
                if key in seen:
                    continue
                seen.add(key)
                words.append(w)
            cats.append(
                {
                    "key": "kelimeler" if k == "_other" else k,
                    "name": name,
                    "nameUz": name_uz,
                    "words": words,
                }
            )

        data["units"].append(
            {
                "id": f"{level}-u{num}",
                "file": fname,
                "level": level,
                "number": int(num) if num.isdigit() else 0,
                "title": f"Ünite {num}",
                "subtitle": level,
                "categories": cats,
                "total": sum(len(c["words"]) for c in cats),
            }
        )

    data["units"].sort(key=lambda u: (u["level"], u["number"]))
    with open(OUT, "w", encoding="utf-8") as o:
        json.dump(data, o, ensure_ascii=False, indent=1)

    total = sum(u["total"] for u in data["units"])
    print(f"{len(data['units'])} ünite, {total} kelime -> {OUT}")


if __name__ == "__main__":
    main()
