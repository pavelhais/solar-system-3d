"""Discovery One (2001: A Space Odyssey) - proceduralni model.
Prid na +X, Z nahoru, polomer velitelske koule = 1 j., celkova delka ~16.8 j.
"""
import bpy, bmesh, math, random
from mathutils import Vector

COLL = "DiscoveryOne_v2"
OLD = "DiscoveryOne_old"
X = Vector((1, 0, 0)); Y = Vector((0, 1, 0)); Z = Vector((0, 0, 1))
rad = math.radians


def V(*a):
    return Vector(a)


# ---------------------------------------------------------------- materialy
def make_mat(name, color, rough=0.75, metal=0.1, emit=None, emit_strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        for key in ("Emission Color", "Emission"):
            if key in b.inputs:
                b.inputs[key].default_value = (*emit, 1)
                break
        b.inputs["Emission Strength"].default_value = emit_strength
    m.diffuse_color = (*color, 1)
    return m


LIGHT = make_mat("DO_HullLight", (0.80, 0.80, 0.78))
MID = make_mat("DO_HullMid", (0.62, 0.63, 0.64))
GREY = make_mat("DO_HullGrey", (0.40, 0.41, 0.43))
DARK = make_mat("DO_Dark", (0.05, 0.05, 0.06), rough=0.9)
NOZZ = make_mat("DO_Nozzle", (0.10, 0.10, 0.11), rough=0.5, metal=0.8)
GLASS = make_mat("DO_Window", (0.02, 0.04, 0.10), rough=0.2, metal=0.0,
                 emit=(0.25, 0.45, 1.0), emit_strength=2.0)
HULLS = [LIGHT, LIGHT, LIGHT, MID, MID, GREY]


# ---------------------------------------------------------------- stavebnice
class Part:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.mats = []

    def midx(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def face(self, verts, mat, hint, smooth=False):
        vs = []
        for v in verts:
            if v not in vs:
                vs.append(v)
        if len(vs) < 3:
            return None
        try:
            f = self.bm.faces.new(vs)
        except ValueError:
            return None
        f.normal_update()
        if f.normal.dot(hint) < 0:
            f.normal_flip()
        f.material_index = self.midx(mat)
        f.smooth = smooth
        return f

    def poly(self, pts, mat, hint, smooth=False):
        return self.face([self.bm.verts.new(p) for p in pts], mat, hint, smooth)

    def grid(self, fn, ni, nj, mat, hintfn, smooth=False, close_j=False):
        cols = nj if close_j else nj + 1
        vs = [[self.bm.verts.new(fn(i, j)) for j in range(cols)] for i in range(ni + 1)]
        for i in range(ni):
            for j in range(nj):
                j2 = (j + 1) % cols
                q = [vs[i][j], vs[i + 1][j], vs[i + 1][j2], vs[i][j2]]
                c = sum((v.co for v in q), Vector()) / 4
                m = mat(i, j) if callable(mat) else mat
                self.face(q, m, hintfn(i, j, c), smooth)

    def lathe(self, origin, axis, profile, segs, mat, smooth=False, inward=False):
        """profile = [(t, r)], t neklesajici podel osy; vnejsek je 'venku'."""
        a = axis.normalized()
        b = a.orthogonal().normalized()
        c = a.cross(b)

        def radial(j):
            p = 2 * math.pi * j / segs
            return b * math.cos(p) + c * math.sin(p)

        def fn(i, j):
            t, r = profile[i]
            return origin + a * t + radial(j) * max(r, 1e-4)

        def hint(i, j, cen):
            dt = profile[i + 1][0] - profile[i][0]
            dr = profile[i + 1][1] - profile[i][1]
            n = a * (-dr) + radial(j + 0.5) * dt
            return -n if inward else n

        self.grid(fn, len(profile) - 1, segs, mat, hint, smooth, close_j=True)

    def box(self, c, ax, ay, az, mat):
        corners = {}
        for sx in (-1, 1):
            for sy in (-1, 1):
                for sz in (-1, 1):
                    corners[(sx, sy, sz)] = self.bm.verts.new(c + ax * sx + ay * sy + az * sz)
        for axis_i, vec in enumerate((ax, ay, az)):
            for s in (-1, 1):
                keys = []
                for u, w in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                    k = [0, 0, 0]
                    k[axis_i] = s
                    k[(axis_i + 1) % 3] = u
                    k[(axis_i + 2) % 3] = w
                    keys.append(tuple(k))
                self.face([corners[k] for k in keys], mat, vec * s)

    def box_between(self, p, q, th, mat, th2=None):
        d = (q - p)
        b = d.orthogonal().normalized()
        c = d.normalized().cross(b)
        self.box((p + q) / 2, d / 2, b * th, c * (th2 or th), mat)

    def loft(self, rings, mat, hints=None, cap_start=None, cap_end=None):
        n = len(rings[0])
        vr = [[self.bm.verts.new(p) for p in ring] for ring in rings]
        cents = [sum(r, Vector()) / n for r in rings]
        quads = []
        for k in range(len(rings) - 1):
            mid = (cents[k] + cents[k + 1]) / 2
            for j in range(n):
                j2 = (j + 1) % n
                q = [vr[k][j], vr[k + 1][j], vr[k + 1][j2], vr[k][j2]]
                cen = sum((v.co for v in q), Vector()) / 4
                h = hints[k] if hints and hints[k] is not None else cen - mid
                m = mat[k] if isinstance(mat, list) else mat
                self.face(q, m, h)
                quads.append(([v.co.copy() for v in q], h))
        if cap_start is not None:
            self.face(vr[0], cap_start, cents[0] - cents[1] if (cents[0] - cents[1]).length > 1e-6 else -X)
        if cap_end is not None:
            self.face(vr[-1], cap_end, cents[-1] - cents[-2] if (cents[-1] - cents[-2]).length > 1e-6 else -X)
        return quads

    def greeble(self, quad, hint, count, rng, smin=0.03, smax=0.12, hmax=0.035, mats=None):
        p00, p10, p11, p01 = quad
        eu = p10 - p00
        ev = p01 - p00
        n = eu.cross(ev)
        if n.length < 1e-9:
            return
        n.normalize()
        if n.dot(hint) < 0:
            n = -n
        ud = eu.normalized()
        vd = n.cross(ud)
        lu = min(eu.length, (p11 - p01).length)
        lv = min(ev.length, (p11 - p10).length)
        mats = mats or HULLS
        for _ in range(count):
            a = rng.uniform(smin, smax)
            b = rng.uniform(smin, smax) * 0.6
            if rng.random() < 0.3:
                a, b = b, a
            mu = a / lu + 0.03
            mv = b / lv + 0.03
            if mu >= 0.5 or mv >= 0.5:
                continue
            u = rng.uniform(mu, 1 - mu)
            v = rng.uniform(mv, 1 - mv)
            pos = (p00 * (1 - u) + p10 * u) * (1 - v) + (p01 * (1 - u) + p11 * u) * v
            h = rng.uniform(0.008, hmax)
            self.box(pos + n * (h * 0.5), ud * a, vd * b, n * h, rng.choice(mats))

    def finish(self, coll, parent):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me)
        coll.objects.link(ob)
        ob.parent = parent
        return ob


def sph(lon, lat, r=1.0):
    return V(r * math.cos(lat) * math.cos(lon), r * math.cos(lat) * math.sin(lon), r * math.sin(lat))


def patch(P, lon0, lon1, lat0, lat1, r, mat, step=3.0):
    ni = max(1, math.ceil((lat1 - lat0) / step))
    nj = max(1, math.ceil((lon1 - lon0) / (step * 1.3)))
    P.grid(lambda i, j: sph(rad(lon0 + (lon1 - lon0) * j / nj), rad(lat0 + (lat1 - lat0) * i / ni), r),
           ni, nj, mat, lambda i, j, c: c, smooth=True)


def cap(P, d, ang, r, mat, skirt=0.03, rings=4, segs=28):
    d = d.normalized()
    t1 = d.orthogonal().normalized()
    t2 = d.cross(t1)

    def fn(i, j):
        p = 2 * math.pi * j / segs
        if i > rings:
            a, rr = rad(ang), r - skirt
        else:
            a, rr = rad(ang) * max(i / rings, 0.002), r
        return (d * math.cos(a) + (t1 * math.cos(p) + t2 * math.sin(p)) * math.sin(a)) * rr

    P.grid(fn, rings + 1, segs, mat, lambda i, j, c: c, smooth=False, close_j=True)


def oct_ring(x, hw, hh, ch, cy=0.0, cz=0.0):
    pts = [(hw - ch, hh), (hw, hh - ch), (hw, -hh + ch), (hw - ch, -hh),
           (-hw + ch, -hh), (-hw, -hh + ch), (-hw, hh - ch), (-hw + ch, hh)]
    return [V(x, cy + y, cz + z) for y, z in pts]


# ---------------------------------------------------------------- uklid sceny
scene = bpy.context.scene
old = bpy.data.collections.get(OLD)
new = bpy.data.collections.get(COLL)
if new:
    for ob in list(new.objects):
        me = ob.data
        bpy.data.objects.remove(ob)
        if me and me.users == 0:
            bpy.data.meshes.remove(me)
else:
    new = bpy.data.collections.new(COLL)
    scene.collection.children.link(new)
if not old:
    # puvodni pokus se nemaze, jen se schova do vlastni kolekce
    old = bpy.data.collections.new(OLD)
    scene.collection.children.link(old)
    for ob in list(scene.objects):
        if ob.name in new.objects:
            continue
        for c in list(ob.users_collection):
            c.objects.unlink(ob)
        old.objects.link(ob)
lc = bpy.context.view_layer.layer_collection.children.get(OLD)
if lc:
    lc.exclude = True

root = bpy.data.objects.new("DiscoveryOne", None)
root.empty_display_size = 0.5
new.objects.link(root)
rng = random.Random(2001)

# ================================================================ 1) velitelska koule
P = Part("DO_CommandModule")
patch(P, -180, 180, -89.5, 89.5, 0.991, DARK, step=6)
bands = [-90, -76, -56, -36, -13, 11, 34, 55, 76, 90]
divs = [6, 10, 16, 20, 24, 20, 16, 10, 6]
G = 0.32
for bi in range(len(divs)):
    la0, la1 = bands[bi], bands[bi + 1]
    la0g = max(la0 + G, -89.6)
    la1g = min(la1 - G, 89.6)
    n = divs[bi]
    off = rng.uniform(0, 360 / n)
    gl = min(G / max(math.cos(rad((la0 + la1) / 2)), 0.2), 1.5)
    for k in range(n):
        lo0 = -180 + off + k * 360 / n
        patch(P, lo0 + gl, lo0 + 360 / n - gl, la0g, la1g, 1.0, rng.choice([LIGHT, LIGHT, LIGHT, LIGHT, MID]))

# okno mustku
patch(P, -43, 43, 12.0, 26.5, 1.004, GREY)
patch(P, -40, 40, 14.5, 24.0, 1.009, GLASS)
for lo in (-40, -20, 0, 20, 40):
    d = sph(rad(lo), rad(19.25))
    P.box(d * 1.011, d.cross(Z).normalized() * 0.008, Z.cross(d.cross(Z)).normalized() * 0.085 + Z * 0, d * 0.006, GREY)

# troje vrata hangaru pro moduly (pody)
for lo in (-36, 0, 36):
    d = sph(rad(lo), rad(-23))
    cap(P, d, 15.5, 1.004, DARK, skirt=0.02)
    cap(P, d, 13.5, 1.012, MID, skirt=0.02)
    cap(P, d, 3.0, 1.018, GREY, skirt=0.01, rings=1, segs=12)
    th = d.cross(Z).normalized()          # vodorovna tecna
    tv = d.cross(th).normalized()         # svisla tecna
    P.box(d * 1.012, th * 0.225, tv * 0.007, d * 0.006, DARK)
    P.box(d * 1.012 + tv * 0.11 * (1 if tv.z < 0 else -1), th * 0.007, tv * 0.11, d * 0.006, DARK)

# horni poklop + drobne detaily
P.lathe(V(0, 0, 0.955), Z, [(0, 0.26), (0.045, 0.26), (0.045, 0.2), (0.075, 0.18), (0.075, 0.001)], 24, MID)
P.lathe(V(0, 0, -0.955), -Z, [(0, 0.22), (0.045, 0.22), (0.045, 0.001)], 24, MID)
for lo, la in ((62, 40), (-62, 40), (62, -48), (-62, -48), (118, 20), (-118, 20), (118, -30), (-118, -30)):
    d = sph(rad(lo), rad(la))
    cap(P, d, 3.2, 1.008, GREY, skirt=0.015, rings=1, segs=12)
P.finish(new, root)

# ================================================================ 2) krk za kouli
P = Part("DO_Neck")
prof = [(0.74, 0.001), (0.74, 0.66), (0.90, 0.66), (0.90, 0.60), (0.96, 0.60), (0.96, 0.52),
        (1.12, 0.40), (1.12, 0.46), (1.18, 0.46), (1.18, 0.36), (1.36, 0.27),
        (1.36, 0.33), (1.42, 0.33), (1.42, 0.22), (1.50, 0.22), (1.50, 0.001)]
P.lathe(V(0, 0, 0), -X, prof, 32, [LIGHT] and LIGHT)
for k in range(12):
    a = 2 * math.pi * k / 12
    r_ = V(0, math.cos(a), math.sin(a))
    t_ = V(0, -math.sin(a), math.cos(a))
    P.box_between(V(-0.97, 0, 0) + r_ * 0.535, V(-1.12, 0, 0) + r_ * 0.425, 0.03, MID, 0.012)
    P.box(V(-1.27, 0, 0) + r_ * 0.33, X * 0.07, t_ * 0.035, r_ * 0.02, rng.choice(HULLS))
P.finish(new, root)

# ================================================================ 3) pater s kontejnery
P = Part("DO_Spine")
SP0, SP1 = -1.48, -11.86          # zacatek / konec patere
ANT0, ANT1 = -7.17, -7.95         # blok anteny
P.lathe(V(SP0, 0, 0), -X, [(0, 0.055), (SP0 - SP1, 0.055)], 8, GREY)


def spine_module(x_hi, x_lo, idx):
    P.lathe(V(x_hi, 0, 0), -X, [(0, 0.001), (0, 0.125), (0.03, 0.15), (0.06, 0.125), (0.06, 0.001)], 8, GREY)
    seg = (x_hi - 0.08 - x_lo) / 2
    for h in range(2):
        xa = x_hi - 0.08 - h * seg
        xb = xa - seg + 0.035
        cx = (xa + xb) / 2
        hl = (xa - xb) / 2
        P.box(V(cx, 0, 0), X * hl * 0.9, Y * 0.105, Z * 0.105, GREY)
        tilt = rad(7) * (1 if (h + idx) % 2 == 0 else -1)
        for k in range(4):
            a = rad(90 * k)
            r_ = V(0, math.cos(a), math.sin(a))
            t_ = V(0, -math.sin(a), math.cos(a))
            axv = X * math.cos(tilt) + r_ * math.sin(tilt)
            nv = -X * math.sin(tilt) + r_ * math.cos(tilt)
            c = V(cx, 0, 0) + r_ * 0.175
            m = rng.choice([LIGHT, LIGHT, MID])
            P.box(c, axv * hl, t_ * 0.14, nv * 0.035, m)
            top = c + nv * 0.035
            q = [top - axv * hl - t_ * 0.14, top + axv * hl - t_ * 0.14,
                 top + axv * hl + t_ * 0.14, top - axv * hl + t_ * 0.14]
            P.greeble(q, nv, 5, rng, 0.025, 0.09, 0.03)
            # bocni zebra kontejneru
            for s in (-1, 1):
                P.box(c + t_ * 0.145 * s, axv * hl * 0.8, t_ * 0.012, nv * 0.022, GREY)


pitch_f = (SP0 - ANT0) / 6
for i in range(6):
    spine_module(SP0 - i * pitch_f, SP0 - (i + 1) * pitch_f + 0.02, i)
pitch_a = (ANT1 - SP1) / 4
for i in range(4):
    spine_module(ANT1 - i * pitch_a, ANT1 - (i + 1) * pitch_a + 0.02, i)
P.finish(new, root)

# ================================================================ 4) antena
P = Part("DO_Antenna")
AX = (ANT0 + ANT1) / 2
rings = [oct_ring(ANT0 + 0.02, 0.14, 0.14, 0.05), oct_ring(ANT0 - 0.1, 0.27, 0.23, 0.08),
         oct_ring(ANT1 + 0.1, 0.27, 0.23, 0.08), oct_ring(ANT1 - 0.02, 0.14, 0.14, 0.05)]
for q, h in P.loft(rings, LIGHT, cap_start=GREY, cap_end=GREY):
    P.greeble(q, h, 6, rng, 0.03, 0.1, 0.03)
P.lathe(V(AX, 0, 0.2), Z, [(0, 0.17), (0.09, 0.17), (0.09, 0.11), (0.22, 0.09), (0.22, 0.135),
                           (0.29, 0.135), (0.29, 0.06), (0.52, 0.05), (0.52, 0.10), (0.60, 0.10),
                           (0.60, 0.07), (0.70, 0.07), (0.70, 0.001)], 16, MID)
TH = rad(22)
AD = V(math.cos(TH), 0, math.sin(TH))            # smer, kam talire miri (k pridi a mirne vzhuru)
O = V(AX + 0.06, 0, 0.98)


def dish(o, R, depth, hub=True):
    k = depth / (R * R)
    n = 6
    front = [(k * (R * i / n) ** 2, R * i / n) for i in range(n + 1)]
    P.lathe(o, AD, front, 32, LIGHT, smooth=True, inward=True)
    back = [(-0.012 + k * (R * i / n) ** 2, R * i / n) for i in range(n + 1)] + [(depth + 0.004, R + 0.012), (depth + 0.004, R)]
    P.lathe(o, AD, back, 32, MID, smooth=False)
    # zebra na zadni strane
    b = AD.orthogonal().normalized()
    c = AD.cross(b)
    for j in range(8 if R > 0.3 else 4):
        p = 2 * math.pi * j / (8 if R > 0.3 else 4)
        rd = b * math.cos(p) + c * math.sin(p)
        P.box_between(o + AD * (-0.04 + k * (0.15 * R) ** 2) + rd * 0.15 * R, o + AD * (k * (0.9 * R) ** 2 - 0.045) + rd * R * 0.9, 0.007, GREY, 0.007)
    if hub:
        f = o + AD * (depth * 1.9)
        P.lathe(f, -AD, [(0, 0.001), (0, 0.035 * R / 0.5), (0.07 * R / 0.5, 0.035 * R / 0.5), (0.07 * R / 0.5, 0.001)], 10, GREY)
        for j in range(3):
            p = 2 * math.pi * j / 3 + 0.5
            rd = b * math.cos(p) + c * math.sin(p)
            P.box_between(o + AD * (k * (0.7 * R) ** 2) + rd * 0.7 * R, f - AD * 0.03, 0.006, GREY)


dish(O, 0.52, 0.15)
P.lathe(O - AD * 0.14, AD, [(0, 0.001), (0, 0.11), (0.06, 0.11), (0.06, 0.07), (0.135, 0.05)], 16, GREY)
P.box_between(V(AX, 0, 0.88), O - AD * 0.1, 0.045, MID)
for s in (-1, 1):
    os_ = O + Y * 0.74 * s - AD * 0.02
    dish(os_, 0.17, 0.05)
    P.box_between(O - AD * 0.09, os_ - AD * 0.03, 0.02, MID)
    P.lathe(os_ - AD * 0.06, AD, [(0, 0.001), (0, 0.045), (0.05, 0.045)], 10, GREY)
P.finish(new, root)

# ================================================================ 5) pohonna sekce
P = Part("DO_Engine")
E0 = SP1                                         # predni konec (-11.86)
P.lathe(V(E0 + 0.04, 0, 0), -X,
        [(0, 0.001), (0, 0.2), (0.06, 0.2), (0.06, 0.33), (0.11, 0.33), (0.11, 0.27), (0.16, 0.27),
         (0.16, 0.36), (0.21, 0.36), (0.21, 0.30), (0.26, 0.30), (0.26, 0.40), (0.32, 0.40), (0.32, 0.001)], 24, MID)
body = [oct_ring(-12.16, 0.40, 0.32, 0.14), oct_ring(-12.62, 0.80, 0.52, 0.22),
        oct_ring(-13.35, 0.84, 0.54, 0.22), oct_ring(-14.20, 0.80, 0.52, 0.22),
        oct_ring(-14.72, 0.74, 0.30, 0.12)]
quads = P.loft(body, [LIGHT, MID, MID, LIGHT], cap_start=GREY, cap_end=GREY)
for q, h in quads:
    area = ((q[1] - q[0]).length + (q[2] - q[3]).length) / 2 * ((q[3] - q[0]).length + (q[2] - q[1]).length) / 2
    P.greeble(q, h, int(10 + area * 55), rng, 0.03, 0.17, 0.04)
    # dlouhe panelove listy
    P.greeble(q, h, int(2 + area * 6), rng, 0.15, 0.3, 0.02, mats=[GREY, MID])
# pas kolem stredu
for q, h in P.loft([oct_ring(-13.30, 0.87, 0.57, 0.23), oct_ring(-13.40, 0.87, 0.57, 0.23)], GREY, cap_start=GREY, cap_end=GREY):
    pass

HEX = [(0, 0.47), (0.285, 0.27), (0.285, -0.27), (0, -0.47), (-0.285, -0.27), (-0.285, 0.27)]


def hex_ring(x, cy, s):
    return [V(x, cy + y * s, z * s) for y, z in HEX]


for cy in (-0.585, 0.0, 0.585):
    # krk mezi telesem reaktoru a tryskovym blokem
    P.lathe(V(-14.70, cy, 0), -X, [(0, 0.24), (0.08, 0.24), (0.08, 0.19), (0.50, 0.19), (0.50, 0.23), (0.56, 0.23)], 16, MID)
    rings = [hex_ring(-15.24, cy, 0.55), hex_ring(-15.50, cy, 1.0), hex_ring(-15.80, cy, 1.0),
             hex_ring(-15.80, cy, 0.93), hex_ring(-15.755, cy, 0.93)]
    hq = P.loft(rings, [LIGHT, LIGHT, LIGHT, GREY], hints=[None, None, -X, None], cap_start=GREY, cap_end=MID)
    for q, h in hq[:6]:
        P.greeble(q, h, 4, rng, 0.02, 0.07, 0.02)
    for cz in (-0.2, 0.2):
        o = V(-15.755, cy, cz)
        P.lathe(o, -X, [(0, 0.185), (0.075, 0.185), (0.075, 0.16)], 24, LIGHT)
        P.lathe(o + X * 0.20, -X, [(0, 0.001), (0, 0.07), (0.275, 0.16)], 24, NOZZ, smooth=True, inward=True)
        # mrizka v trysce
        for g in range(-3, 4):
            w = math.sqrt(max(0.115 ** 2 - (g * 0.03) ** 2, 0))
            P.box(o + X * 0.09 + Y * g * 0.03, X * 0.004, Y * 0.005, Z * w, DARK)
    # drobne korekcni trysky v rozich
    for sy, sz in ((1, 0), (-1, 0)):
        P.lathe(V(-15.755, cy + sy * 0.215, 0), -X, [(0, 0.03), (0.04, 0.03), (0.04, 0.001)], 10, GREY)
P.finish(new, root)

# ---------------------------------------------------------------- souhrn
tris = 0
for ob in new.objects:
    if ob.type == "MESH":
        ob.data.calc_loop_triangles()
        tris += len(ob.data.loop_triangles)
print("objects:", [o.name for o in new.objects], "tris:", tris)
