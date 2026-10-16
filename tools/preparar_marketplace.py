"""
Sr. Canalla — prepara una colección para el marketplace.

Uso (desde la carpeta raíz de la web, la que contiene index.html):

    python tools/preparar_marketplace.py RUTA_A_LA_CARPETA_DESCOMPRIMIDA

    p. ej.  python tools/preparar_marketplace.py "C:/Descargas/la-catrina"

La carpeta de origen es la que viene en el ZIP (p. ej. "la-catrina") con los PNG
y productos.csv. El script:
  1. Convierte cada PNG a WebP en  img/marketplace/<coleccion>/
  2. Copia productos.csv a  datos/<coleccion>.csv
  3. Regenera  js/catalogo.js  con TODAS las colecciones de datos/

Si solo has editado un CSV de datos/, regenera el catálogo sin origen:

    python tools/preparar_marketplace.py --solo-catalogo

Requisitos: Python 3 y Pillow  (pip install pillow)
"""
import csv
import json
import os
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, "datos")
IMG_MK = os.path.join(RAIZ, "img", "marketplace")
CATALOGO = os.path.join(RAIZ, "js", "catalogo.js")


def leer_csv(ruta):
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f, delimiter=";"))


def lista(valor):
    return [v.strip() for v in (valor or "").split("|") if v.strip()]


def convertir(origen):
    from PIL import Image

    slug = os.path.basename(os.path.normpath(origen))
    destino = os.path.join(IMG_MK, slug)
    os.makedirs(destino, exist_ok=True)
    n = 0
    for nombre in sorted(os.listdir(origen)):
        ruta = os.path.join(origen, nombre)
        base, ext = os.path.splitext(nombre)
        if ext.lower() == ".png":
            im = Image.open(ruta)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA")
            calidad = 80 if base.endswith("_02") else 86
            im.save(os.path.join(destino, base + ".webp"), "WEBP", quality=calidad, method=6)
            n += 1
        elif nombre.lower() == "productos.csv":
            os.makedirs(DATOS, exist_ok=True)
            shutil.copyfile(ruta, os.path.join(DATOS, slug + ".csv"))
    print(f"{slug}: {n} imágenes convertidas a WebP")
    return slug


def generar_catalogo():
    colecciones = []
    for c in leer_csv(os.path.join(DATOS, "colecciones.csv")):
        slug = c["slug"].strip()
        propio_t = f"img/marketplace/{slug}/{slug}_titulo.webp"
        propio_i = f"img/marketplace/{slug}/{slug}_ilustracion.webp"
        colecciones.append({
            "slug": slug,
            "nombre": c["nombre"].strip(),
            "num": c["num"].strip(),
            "titulo": propio_t if os.path.exists(os.path.join(RAIZ, propio_t)) else f"img/titulo-{slug}.webp",
            "ilustracion": propio_i if os.path.exists(os.path.join(RAIZ, propio_i)) else f"img/ilus-{slug}.webp",
        })

    productos = []
    for c in colecciones:
        ruta = os.path.join(DATOS, c["slug"] + ".csv")
        if not os.path.exists(ruta):
            continue
        for p in leer_csv(ruta):
            productos.append({
                "coleccion": p["coleccion"].strip(),
                "producto": p["producto"].strip(),
                "nombre": p["nombre"].strip(),
                "precio": float((p["precio"] or "0").replace(",", ".")),
                "claim": p["claim"].strip(),
                "materiales": p["materiales"].strip(),
                "colores": lista(p["colores"]) or ["unico"],
                "tallas": lista(p["tallas"]),
                "orden": int(p["orden"] or 99),
                "destacado": p["destacado"].strip().lower() in ("si", "sí", "x", "1"),
                # Columna opcional: cuántas fotos tiene el producto (1, 2 o 3). Vacía = 3.
                "vistas": max(1, min(3, int((p.get("vistas") or "").strip() or 3))),
            })
    productos.sort(key=lambda p: (p["coleccion"], p["orden"]))

    js = ("/* Generado por tools/preparar_marketplace.py — no editar a mano: edita datos/*.csv */\n"
          "window.SRC_CATALOGO = " + json.dumps({"colecciones": colecciones, "productos": productos},
                                                  ensure_ascii=False, indent=1) + ";\n")
    with open(CATALOGO, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"js/catalogo.js: {len(colecciones)} colecciones, {len(productos)} productos")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    if args[0] != "--solo-catalogo":
        convertir(args[0])
    generar_catalogo()
