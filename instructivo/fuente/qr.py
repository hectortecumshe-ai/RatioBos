"""Generador de códigos QR (modo byte, versiones 1–10) sin dependencias, para el instructivo.
Sigue la norma ISO/IEC 18004 (corrección de errores Reed–Solomon en GF(256)).
Uso: python qr.py "https://..." salida.svg [L|M|Q|H] [máscara 0-7]"""
import sys

ECC_CW = {'L': [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18], 'M': [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
          'Q': [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24], 'H': [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28]}
ECC_BL = {'L': [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4], 'M': [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
          'Q': [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8], 'H': [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8]}
FMT = {'L': 1, 'M': 0, 'Q': 3, 'H': 2}


def gmul(x, y):
    z = 0
    for i in range(7, -1, -1):
        z = (z << 1) ^ ((z >> 7) * 0x11D)
        z ^= ((y >> i) & 1) * x
    return z


def rs_divisor(n):
    r = [0] * (n - 1) + [1]
    root = 1
    for _ in range(n):
        for j in range(n):
            r[j] = gmul(r[j], root)
            if j + 1 < n:
                r[j] ^= r[j + 1]
        root = gmul(root, 2)
    return r


def rs_remainder(data, div):
    r = [0] * len(div)
    for b in data:
        f = b ^ r.pop(0)
        r.append(0)
        for i, c in enumerate(div):
            r[i] ^= gmul(c, f)
    return r


def raw_modules(v):
    r = (16 * v + 128) * v + 64
    if v >= 2:
        na = v // 7 + 2
        r -= (25 * na - 10) * na - 55
        if v >= 7:
            r -= 36
    return r


def data_cw(v, e):
    return raw_modules(v) // 8 - ECC_CW[e][v] * ECC_BL[e][v]


def align_pos(v):
    if v == 1:
        return []
    na = v // 7 + 2
    size = v * 4 + 17
    step = (v * 4 + na * 2 + 1) // (na * 2 - 2) * 2
    res = [6]
    pos = size - 7
    for _ in range(na - 1):
        res.insert(1, pos)
        pos -= step
    return res


def encode(text, ecl='M', mask=None, version=None):
    data = text.encode('utf-8')
    v = version
    if v is None:
        for v in range(1, 11):
            if 4 + 8 + 8 * len(data) <= data_cw(v, ecl) * 8:
                break
        else:
            raise ValueError('texto demasiado largo')
    cap = data_cw(v, ecl) * 8
    bits = []
    def add(val, n):
        bits.extend((val >> i) & 1 for i in range(n - 1, -1, -1))
    add(4, 4); add(len(data), 8)
    for b in data:
        add(b, 8)
    add(0, min(4, cap - len(bits)))
    add(0, (-len(bits)) % 8)
    pad = 0xEC
    while len(bits) < cap:
        add(pad, 8); pad ^= 0xEC ^ 0x11
    cws = [int(''.join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]
    # bloques e intercalado
    nb, ecn = ECC_BL[ecl][v], ECC_CW[ecl][v]
    raw = raw_modules(v) // 8
    nshort = nb - raw % nb
    slen = raw // nb
    div = rs_divisor(ecn)
    blocks, k = [], 0
    for i in range(nb):
        dl = slen - ecn + (0 if i < nshort else 1)
        d = cws[k:k + dl]; k += dl
        ec = rs_remainder(d, div)
        if i < nshort:
            d = d + [None]
        blocks.append(d + ec)
    final = []
    for i in range(len(blocks[0])):
        for b in blocks:
            if b[i] is not None:
                final.append(b[i])
    assert len(final) == raw
    size = v * 4 + 17
    M = [[False] * size for _ in range(size)]
    F = [[False] * size for _ in range(size)]
    def setf(x, y, d):
        M[y][x] = d; F[y][x] = True
    for i in range(size):
        setf(6, i, i % 2 == 0); setf(i, 6, i % 2 == 0)
    def finder(cx, cy):
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                x, y = cx + dx, cy + dy
                if 0 <= x < size and 0 <= y < size:
                    dist = max(abs(dx), abs(dy))
                    setf(x, y, dist not in (2, 4))
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4)
    ap = align_pos(v)
    for i, a in enumerate(ap):
        for j, b in enumerate(ap):
            if (i == 0 and j == 0) or (i == 0 and j == len(ap) - 1) or (i == len(ap) - 1 and j == 0):
                continue
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    setf(a + dx, b + dy, max(abs(dx), abs(dy)) != 1)
    def draw_format(mk):
        d = FMT[ecl] << 3 | mk
        rem = d
        for _ in range(10):
            rem = (rem << 1) ^ ((rem >> 9) * 0x537)
        bitsf = (d << 10 | rem) ^ 0x5412
        g = lambda i: (bitsf >> i) & 1 == 1
        for i in range(6):
            setf(8, i, g(i))
        setf(8, 7, g(6)); setf(8, 8, g(7)); setf(7, 8, g(8))
        for i in range(9, 15):
            setf(14 - i, 8, g(i))
        for i in range(8):
            setf(size - 1 - i, 8, g(i))
        for i in range(8, 15):
            setf(8, size - 15 + i, g(i))
        setf(8, size - 8, True)
    draw_format(0)
    if v >= 7:
        rem = v
        for _ in range(12):
            rem = (rem << 1) ^ ((rem >> 11) * 0x1F25)
        vb = v << 12 | rem
        for i in range(18):
            bt = (vb >> i) & 1 == 1
            a, b = size - 11 + i % 3, i // 3
            setf(a, b, bt); setf(b, a, bt)
    # datos en zigzag
    i = 0
    right = size - 1
    while right >= 1:
        if right == 6:
            right = 5
        for vert in range(size):
            for j in range(2):
                x = right - j
                up = ((right + 1) & 2) == 0
                y = size - 1 - vert if up else vert
                if not F[y][x] and i < len(final) * 8:
                    M[y][x] = (final[i >> 3] >> (7 - (i & 7))) & 1 == 1
                    i += 1
        right -= 2
    MASKS = [lambda x, y: (x + y) % 2 == 0, lambda x, y: y % 2 == 0, lambda x, y: x % 3 == 0,
             lambda x, y: (x + y) % 3 == 0, lambda x, y: (x // 3 + y // 2) % 2 == 0,
             lambda x, y: x * y % 2 + x * y % 3 == 0, lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0,
             lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0]
    def aplicar(mk):
        for y in range(size):
            for x in range(size):
                if not F[y][x] and MASKS[mk](x, y):
                    M[y][x] = not M[y][x]
    def penal():
        p = 0
        for linea in [M[y] for y in range(size)] + [[M[y][x] for y in range(size)] for x in range(size)]:
            run, prev = 0, None
            for c in linea:
                if c == prev:
                    run += 1
                else:
                    if run >= 5: p += run - 2
                    run, prev = 1, c
            if run >= 5: p += run - 2
            s = ''.join('1' if c else '0' for c in linea)
            p += 40 * (s.count('10111010000') + s.count('00001011101'))
        for y in range(size - 1):
            for x in range(size - 1):
                if M[y][x] == M[y][x + 1] == M[y + 1][x] == M[y + 1][x + 1]:
                    p += 3
        dark = sum(map(sum, M))
        p += abs(dark * 20 - size * size * 10) // (size * size) * 10
        return p
    if mask is None:
        best = None
        for mk in range(8):
            aplicar(mk); draw_format(mk)
            pe = penal()
            if best is None or pe < best[0]:
                best = (pe, mk)
            aplicar(mk)
        mask = best[1]
    aplicar(mask); draw_format(mask)
    return M, v, mask


def svg(M, borde=4, color='#1d2420'):
    n = len(M) + 2 * borde
    p = []
    for y, fila in enumerate(M):
        x = 0
        while x < len(fila):
            if fila[x]:
                x0 = x
                while x < len(fila) and fila[x]:
                    x += 1
                p.append(f'M{x0 + borde} {y + borde}h{x - x0}v1h-{x - x0}z')
            else:
                x += 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
            f'<rect width="{n}" height="{n}" fill="#fff"/><path d="{"".join(p)}" fill="{color}"/></svg>')


if __name__ == '__main__':
    txt, out = sys.argv[1], sys.argv[2]
    e = sys.argv[3] if len(sys.argv) > 3 else 'M'
    mk = int(sys.argv[4]) if len(sys.argv) > 4 else None
    M, v, mk = encode(txt, e, mk)
    open(out, 'w', encoding='utf-8').write(svg(M))
    print(f'versión {v}, nivel {e}, máscara {mk}, {len(M)}×{len(M)} módulos')
