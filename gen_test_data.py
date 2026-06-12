#!/usr/bin/env python3
"""
Genera 288 participantes ficticios (32 por categoría × 9 categorías) en
INSCRITOS_FORM para pruebas del sistema de torneos de capoeira.
"""
import datetime
import random
import openpyxl
from openpyxl import load_workbook

SRC = '/root/.claude/uploads/7b1bf2b6-2090-56ae-98a2-57caa9d1495d/4f7d32f1-Sistema_v2_TEST_con_datos_2025.xlsx'
DST = '/home/user/Jogos-de-Capoeira-Pontos/Sistema_v2_TEST_con_datos_FICTICIOS.xlsx'

random.seed(42)
TODAY = datetime.date(2026, 6, 12)

# ── Pools de datos ────────────────────────────────────────────────────────────

MASC = [
    "Carlos","Rafael","Marcelo","Pedro","André","Diego","Lucas","Fábio","João","Bruno",
    "Matheus","Rodrigo","Andres","Manuel","Roberto","Miguel","Tomás","Alejandro","Santiago","Felipe",
    "Renato","Gustavo","Eduardo","Leandro","Marco","Cristian","Daniel","Vitor","Thiago","Caio",
    "Ivan","Paulo","Jorge","Alberto","Francisco","Sergio","Fernando","Raul","Nicolas","Hugo",
    "Julián","Emilio","Julio","Gabriel","Eric","Olivier","Matteo","Luca","Antoine","Marc",
]
FEM = [
    "Camila","Ana","Beatriz","Sofia","Fernanda","Julia","Lucia","Mariana","Paula","Carla",
    "Valentina","Daniela","Laura","Isabel","Catalina","María","Elena","Sara","Nadia","Viviane",
    "Elisa","Natalia","Andreia","Gisele","Raquel","Tamara","Jéssica","Amaia","Nagore","Miriam",
    "Emilie","Céline","Alice","Manon","Noémie","Luisa","Martina","Rosa","Silvia","Lorena",
    "Carmen","Yolanda","Pilar","Claudia","Aisha","Fátima","Latifa","Aiko","Yuki","Mei",
]
APES = [
    "Mangangá","Coruja","Gavião","Andorinha","Sucuri","Onça","Pantera","Puma","Lobo","Coelho",
    "Tartaruga","Borboleta","Pomba","Tatu","Cobra","Gato","Leão","Tigre","Urubu","Jabuti",
    "Macaco","Falcão","Beija-Flor","Arara","Tucano","Periquito","Papagaio","Jacaré","Golfinho","Baleia",
    "Peixe","Tubarão","Raia","Piranha","Caranguejo","Lagosta","Abelha","Formiga","Louva-Deus","Grilo",
    "Cigarra","Joaninha","Vagalume","Aranha","Escorpião","Centopeia","Besouro","Mosquito","Mariposa","Quati",
    "Gato-Preto","Lobo-Branco","Pato","Ganso","Búfalo","Capivara","Gambá","Teiú","Siriema","Araçari",
    "Sabiá","Bem-te-vi","Suçuarana","Lontra","Irara","Veado","Raposa","Morcego","Tamanduá","Preguiça",
    "Boto","Golfinho-Rosa","Albatroz","Cágado","Iguana","Siri","Lagarto","Camaleão","Salamandra","Rã",
    "Mutum","Jacu","Bicho-Preguiça","Peixe-Espada","Peixe-Lua","Congro","Arraia","Baiacu","Moreia","Camarão",
    "Tatuzinho","Jaguatirica","Cachorro-do-Mato","Gato-Maracajá","Puma-Preto","Onça-Pintada","Arara-Azul","Harpia","Gavião-Real","Urubu-Rei",
]
SURNAMES = [
    "Silva","Santos","Oliveira","Souza","Pereira","Costa","Ferreira","Alves","Ribeiro","Lima",
    "Rodrigues","Martins","Carvalho","Gomes","Nascimento","Araújo","Melo","Barbosa","Cardoso","Machado",
    "García","López","Martínez","Sánchez","González","Fernández","Díaz","Moreno","Jiménez","Ruiz",
    "Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Schulz","Hoffmann","Richter",
    "Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco",
    "Dupont","Martin","Bernard","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau",
    "Fernandes","Mendes","Gonçalves","Sousa","Correia","Neves","Pires","Monteiro","Cruz","Freitas",
]
CITIES = [
    "São Paulo-Brasil","Rio de Janeiro-Brasil","Salvador-Brasil","Belo Horizonte-Brasil","Recife-Brasil",
    "Fortaleza-Brasil","Curitiba-Brasil","Porto Alegre-Brasil","Brasília-Brasil","Manaus-Brasil",
    "Madrid-España","Barcelona-España","Bilbao-España","Valencia-España","Sevilla-España",
    "Lisboa-Portugal","Porto-Portugal","Cascais-Portugal","Coimbra-Portugal",
    "Paris-Francia","Lyon-Francia","Marseille-Francia",
    "Berlín-Alemania","Hamburgo-Alemania","Múnich-Alemania",
    "Roma-Italia","Milán-Italia","Florencia-Italia",
    "Buenos Aires-Argentina","Montevideo-Uruguay","Santiago-Chile","Bogotá-Colombia",
]
PROFS = [
    "Mestre Bimba","Mestre Pastinha","Contra-Mestre Falcão","Professor Leão","Mestre Cobra",
    "Professor Gavião","Contra-Mestre Arara","Mestre Onça","Professor Tigre","Mestre Coruja",
    "Professor Borboleta","Contra-Mestre Jabuti","Mestre Sucuri","Professor Macaco","Mestre Puma",
    "Mestre Tartaruga","Contra-Mestre Pomba","Professor Tatu","Mestre Urso","Professor Lobo",
]
TALLAS = ["XS", "S", "M", "L", "XL", "XXL"]

# ── Helpers ───────────────────────────────────────────────────────────────────

def birth_date(age_min: int, age_max: int) -> datetime.datetime:
    age = random.randint(age_min, age_max)
    year = TODAY.year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return datetime.datetime(year, month, day)


def timestamp() -> str:
    m = random.randint(8, 10)
    d = random.randint(1, 28)
    h, mi, s = random.randint(8, 22), random.randint(0, 59), random.randint(0, 59)
    return f"2025-{m:02d}-{d:02d} {h:02d}:{mi:02d}:{s:02d}"


def phone() -> str:
    return f"+34 6{random.randint(10,99)} {random.randint(100,999)} {random.randint(100,999)}"


# ── Definición de categorías ──────────────────────────────────────────────────

BAOBA_ALU = ["Laranja", "Laranja/Azul"]
BAOBA_GRA = ["Verde", "Azul", "Roxa", "Marrom"]


def baoba_cordas(n: int) -> list:
    half = n // 2
    return [random.choice(BAOBA_ALU) for _ in range(half)] + \
           [random.choice(BAOBA_GRA) for _ in range(n - half)]


CATS = [
    ("A",        lambda n: [random.choice(["Marrom","Marrom/Vermelha"]) for _ in range(n)],          22, 44),
    ("B",        lambda n: [random.choice(["Roxa","Roxa/Marrom"])       for _ in range(n)],          22, 44),
    ("C",        lambda n: [random.choice(["Verde","Verde/Roxa"])        for _ in range(n)],          22, 44),
    ("D",        lambda n: [random.choice(["Azul","Azul/Verde"])         for _ in range(n)],          22, 44),
    ("E",        lambda n: [random.choice(["Laranja","Laranja/Azul"])    for _ in range(n)],          22, 44),
    ("Baobá",    lambda n: baoba_cordas(n),                                                            45, 65),
    ("Juvenil",  lambda n: [random.choice(["Amarela","Laranja"])         for _ in range(n)],          12, 17),
    ("Infantil", lambda n: [random.choice(["Crua","Crua/Amarela","Amarela"]) for _ in range(n)],       5, 11),
    ("General",  lambda n: [random.choice(["Laranja","Azul","Verde","Roxa","Marrom"]) for _ in range(n)], 22, 44),
]

PER_CAT = 32  # 16 M + 16 F


# ── Generar participantes ─────────────────────────────────────────────────────

def build_participants() -> list:
    apes = list(APES)
    random.shuffle(apes)
    ape_idx = 0

    def next_ape():
        nonlocal ape_idx, apes
        if ape_idx >= len(apes):
            ape_idx = 0
            random.shuffle(apes)
        val = apes[ape_idx]
        ape_idx += 1
        return val

    rows = []
    for (label, cordas_fn, age_min, age_max) in CATS:
        cordas_m = cordas_fn(PER_CAT // 2)
        cordas_f = cordas_fn(PER_CAT // 2)
        talla_idx = 0

        for corda in cordas_m:
            rows.append({
                'timestamp':        timestamp(),
                'nombre':           random.choice(MASC),
                'apellido':         random.choice(SURNAMES),
                'apelido':          next_ape(),
                'telefono':         phone(),
                'ciudad_pais':      random.choice(CITIES),
                'profesor':         random.choice(PROFS),
                'corda':            corda,
                'genero':           'Masculino',
                'fecha_nacimiento': birth_date(age_min, age_max),
                'talla_camiseta':   TALLAS[talla_idx % len(TALLAS)],
                'importe_pagado':   35,
                'estado_pago':      'Pagado',
            })
            talla_idx += 1

        for corda in cordas_f:
            rows.append({
                'timestamp':        timestamp(),
                'nombre':           random.choice(FEM),
                'apellido':         random.choice(SURNAMES),
                'apelido':          next_ape(),
                'telefono':         phone(),
                'ciudad_pais':      random.choice(CITIES),
                'profesor':         random.choice(PROFS),
                'corda':            corda,
                'genero':           'Femenino',
                'fecha_nacimiento': birth_date(age_min, age_max),
                'talla_camiseta':   TALLAS[talla_idx % len(TALLAS)],
                'importe_pagado':   35,
                'estado_pago':      'Pagado',
            })
            talla_idx += 1

    return rows


# ── Fórmulas ──────────────────────────────────────────────────────────────────

def formula_G(n):
    return (
        '=IF(F' + str(n) + '<>"",F' + str(n) + ','
        'IF(AND(D' + str(n) + '="",E' + str(n) + '=""),"",TRIM(D' + str(n) + '&" "&E' + str(n) + ')))'
    )

def formula_O(n):
    return '=IF(N' + str(n) + '="","",DATEDIF(N' + str(n) + ',TODAY(),"Y"))'

def formula_P(n):
    return (
        '=IF(O' + str(n) + '="","",IF(O' + str(n) + '<=11,"Infantil",'
        'IF(O' + str(n) + '<=17,"Juvenil",IF(O' + str(n) + '<=44,"Adulto","Baobá"))))'
    )

def formula_Q(n):
    # 7 IF clauses, 6 need explicit closing at end
    s = str(n)
    return (
        '=IF(P' + s + '<>"Adulto","",'
        'IF(OR(L' + s + '="Marrom",L' + s + '="Marrom/Vermelha"),"A",'
        'IF(OR(L' + s + '="Roxa",L' + s + '="Roxa/Marrom"),"B",'
        'IF(OR(L' + s + '="Verde",L' + s + '="Verde/Roxa"),"C",'
        'IF(OR(L' + s + '="Azul",L' + s + '="Azul/Verde"),"D",'
        'IF(OR(L' + s + '="Laranja",L' + s + '="Laranja/Azul"),"E",'
        'IF(Y' + s + '="Sí","E","N/A")))))))'
    )

def formula_R(n):
    s = str(n)
    return (
        '=IF(P' + s + '<>"Baobá","",'
        'IF(OR(L' + s + '="Laranja",L' + s + '="Laranja/Azul"),"Alumnos",'
        'IF(Y' + s + '="Sí","Alumnos","Graduados+")))'
    )

def formula_S(n):
    s = str(n)
    return (
        '=IF(P' + s + '="","",IF(P' + s + '="Adulto",'
        'IF(OR(Q' + s + '="",Q' + s + '="N/A"),"⚠ Corda no compite Adulto",P' + s + '&"-"&Q' + s + '&" · "&M' + s + '),'
        'IF(P' + s + '="Baobá",'
        'IF(R' + s + '="","⚠ Sin clasificar Baobá",P' + s + '&"-"&R' + s + '&" · "&M' + s + '),'
        'IF(P' + s + '="Juvenil",'
        'IF(AND(OR(L' + s + '="Crua",L' + s + '="Crua/Amarela"),Y' + s + '<>"Sí"),"⚠ Juvenil necesita Amarela+",P' + s + '&" · "&M' + s + '),'
        'P' + s + '&" · "&M' + s + '))))'
    )

def formula_AD(n):
    return '=IF(D' + str(n) + '<>"","P"&TEXT(ROW()-4,"0000"),"")'


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    participants = build_participants()
    print(f"Participantes generados: {len(participants)}")

    print("Cargando libro de trabajo...")
    wb = load_workbook(SRC)
    ws = wb['INSCRITOS_FORM']

    # Paso 1: limpiar filas 5-504 (cols A-AD = 1-30)
    print("Limpiando datos existentes (filas 5-504)...")
    for row_idx in range(5, 505):
        for col_idx in range(1, 31):
            ws.cell(row=row_idx, column=col_idx).value = None

    # Pasos 2+3: escribir participantes con fórmulas
    print("Escribiendo participantes...")
    for i, p in enumerate(participants):
        n = i + 5  # fila Excel (datos empiezan en 5)

        # Columnas de entrada
        ws.cell(row=n, column=1).value  = p['timestamp']        # A: timestamp
        ws.cell(row=n, column=4).value  = p['nombre']           # D: nombre
        ws.cell(row=n, column=5).value  = p['apellido']         # E: apellido
        ws.cell(row=n, column=6).value  = p['apelido']          # F: apelido
        ws.cell(row=n, column=9).value  = p['telefono']         # I: telefono
        ws.cell(row=n, column=10).value = p['ciudad_pais']      # J: ciudad_pais
        ws.cell(row=n, column=11).value = p['profesor']         # K: profesor
        ws.cell(row=n, column=12).value = p['corda']            # L: corda
        ws.cell(row=n, column=13).value = p['genero']           # M: genero
        ws.cell(row=n, column=14).value = p['fecha_nacimiento'] # N: fecha_nacimiento
        ws.cell(row=n, column=21).value = 'Sí'            # U: compite_jogo
        ws.cell(row=n, column=25).value = 'No'                  # Y: excepcion_mesa
        ws.cell(row=n, column=26).value = p['talla_camiseta']   # Z: talla_camiseta
        ws.cell(row=n, column=27).value = p['importe_pagado']   # AA: importe_pagado
        ws.cell(row=n, column=28).value = p['estado_pago']      # AB: estado_pago

        # Columnas calculadas (fórmulas)
        ws.cell(row=n, column=7).value  = formula_G(n)   # G: nombre_mostrar
        ws.cell(row=n, column=15).value = formula_O(n)   # O: edad
        ws.cell(row=n, column=16).value = formula_P(n)   # P: categoria_edad
        ws.cell(row=n, column=17).value = formula_Q(n)   # Q: categoria_adulto
        ws.cell(row=n, column=18).value = formula_R(n)   # R: categoria_baoba
        ws.cell(row=n, column=19).value = formula_S(n)   # S: categoria_final
        ws.cell(row=n, column=30).value = formula_AD(n)  # AD: id_participante

    # Paso 4: guardar
    print(f"Guardando en: {DST}")
    wb.save(DST)

    print("=" * 60)
    print(f"Archivo guardado: {DST}")
    print(f"Total participantes escritos: {len(participants)}")
    cats_labels = [c[0] for c in CATS]
    print(f"Categorias ({len(CATS)}): {', '.join(cats_labels)}")
    print(f"Por categoría: {PER_CAT} (16 Masculino + 16 Femenino)")
    print()
    print("Verificar en Excel:")
    print("  1. INSCRITOS_FORM filas 5-292: datos + fórmulas")
    print("  2. PARTICIPANTES: 288 participantes")
    print("  3. LLAVES_INDEX col D: ~32 por bracket")
    print("  4. CLASIF_*: filas 5-36 con nombres")


if __name__ == '__main__':
    main()
