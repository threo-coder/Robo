"""Convert the pinned Unitree Go2 Collada assets without geometry decimation.

Requires NumPy. Sources are kept verbatim in source/meshes.zip after packaging.
This is an asset conversion/validation utility, not a viewer.
"""

from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import json
import math
import xml.etree.ElementTree as ET
import zipfile

import numpy as np


ROOT = Path(__file__).resolve().parent
NS = {"c": "http://www.collada.org/2005/11/COLLADASchema"}
COMMIT = "5994d4faef0a9cadd3287f8de0199a67eeb2a259"
NAMES = ["base", "hip", "thigh", "thigh_mirror", "calf", "calf_mirror", "foot"]


def numbers(value):
    return np.fromstring(value, sep=" ")


def save_json(path, value):
    path.write_text(json.dumps(value, separators=(",", ":"), ensure_ascii=True) + "\n", encoding="ascii")


def rotation(axis, angle):
    axis = np.asarray(axis, dtype=float)
    axis /= np.linalg.norm(axis)
    x, y, z = axis
    cross = np.array([[0, -z, y], [z, 0, -x], [-y, x, 0]])
    matrix = np.eye(4)
    matrix[:3, :3] = np.eye(3) * math.cos(angle) + (1 - math.cos(angle)) * np.outer(axis, axis) + math.sin(angle) * cross
    return matrix


def origin(element):
    matrix = np.eye(4)
    if element is None:
        return matrix
    r, p, y = numbers(element.get("rpy", "0 0 0"))
    matrix = rotation([0, 0, 1], y) @ rotation([0, 1, 0], p) @ rotation([1, 0, 0], r)
    matrix[:3, 3] = numbers(element.get("xyz", "0 0 0"))
    return matrix


def matrix_list(matrix):
    return matrix.flatten(order="F").tolist()


def transform(points, matrix):
    return points @ matrix[:3, :3].T + matrix[:3, 3]


def source_bytes(name):
    path = ROOT / "source" / "meshes" / f"{name}.dae"
    if path.exists():
        return path.read_bytes()
    with zipfile.ZipFile(ROOT / "source" / "meshes.zip") as archive:
        return archive.read(f"meshes/{name}.dae")


def convert_mesh(name):
    raw = source_bytes(name)
    tree = ET.fromstring(raw)
    assert not tree.findall(".//c:image", NS), "External textures require separate handling"
    assert tree.find("c:asset/c:up_axis", NS).text == "Z_UP"
    assert float(tree.find("c:asset/c:unit", NS).get("meter")) == 1
    nodes = tree.findall("c:library_visual_scenes/c:visual_scene/c:node", NS)
    assert len(nodes) == 1
    node = nodes[0]
    assert not node.findall("c:node", NS)
    matrix = numbers(node.find("c:matrix", NS).text).reshape(4, 4)
    assert np.linalg.det(matrix[:3, :3]) > 0
    instance = node.find("c:instance_geometry", NS)
    geom_id = instance.get("url")[1:]
    geometry = next(g for g in tree.findall("c:library_geometries/c:geometry", NS) if g.get("id") == geom_id)
    mesh = geometry.find("c:mesh", NS)
    arrays = {}
    for source in mesh.findall("c:source", NS):
        accessor = source.find("c:technique_common/c:accessor", NS)
        values = numbers(source.find("c:float_array", NS).text)
        arrays[source.get("id")] = values.reshape(-1, int(accessor.get("stride")))
    vertices = {v.get("id"): v.find("c:input[@semantic='POSITION']", NS).get("source")[1:]
                for v in mesh.findall("c:vertices", NS)}
    effects = {e.get("id"): numbers(e.find(".//c:diffuse/c:color", NS).text).tolist()
               for e in tree.findall("c:library_effects/c:effect", NS)}
    materials = {m.get("id"): m.find("c:instance_effect", NS).get("url")[1:]
                 for m in tree.findall("c:library_materials/c:material", NS)}
    bindings = {m.get("symbol"): m.get("target")[1:]
                for m in instance.findall(".//c:instance_material", NS)}
    asset = {"asset": {"version": "2.0", "generator": "Unitree Go2 lossless topology conversion", "copyright": 'Copyright (c) 2016-2022 HangZhou YuShu TECHNOLOGY CO.,LTD. ("Unitree Robotics"). BSD-3-Clause; see ../LICENSE.'},
             "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"name": name, "mesh": 0}],
             "meshes": [{"name": name, "primitives": []}], "materials": [], "accessors": [], "bufferViews": [], "buffers": []}
    binary = bytearray()
    points = []
    triangles = 0
    repaired_normals = 0

    def add_accessor(values, component, kind, target, bounds=False):
        while len(binary) % 4:
            binary.append(0)
        data = values.tobytes()
        view = len(asset["bufferViews"])
        asset["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(data), "target": target})
        binary.extend(data)
        entry = {"bufferView": view, "componentType": component, "count": len(values), "type": kind}
        if bounds:
            entry["min"] = values.min(axis=0).tolist()
            entry["max"] = values.max(axis=0).tolist()
        asset["accessors"].append(entry)
        return len(asset["accessors"]) - 1

    assert all(e.tag.split("}")[-1] in ("source", "vertices", "triangles") for e in mesh)
    for primitive in mesh.findall("c:triangles", NS):
        inputs = primitive.findall("c:input", NS)
        stride = max(int(i.get("offset")) for i in inputs) + 1
        indices = np.fromstring(primitive.find("c:p", NS).text, sep=" ", dtype=np.int64).reshape(-1, stride)
        count = int(primitive.get("count"))
        assert len(indices) == count * 3
        position_input = next(i for i in inputs if i.get("semantic") == "VERTEX")
        normal_input = next(i for i in inputs if i.get("semantic") == "NORMAL")
        positions = arrays[vertices[position_input.get("source")[1:]]][indices[:, int(position_input.get("offset"))], :3]
        normals = arrays[normal_input.get("source")[1:]][indices[:, int(normal_input.get("offset"))], :3]
        positions = transform(positions, matrix)
        normals = normals @ np.linalg.inv(matrix[:3, :3])
        lengths = np.linalg.norm(normals, axis=1)
        invalid = lengths < 1e-10
        if invalid.any():
            corners = positions.reshape(-1, 3, 3)
            faces = np.cross(corners[:, 1] - corners[:, 0], corners[:, 2] - corners[:, 0])
            degenerate = np.linalg.norm(faces, axis=1) < 1e-12
            faces[degenerate] = [0, 0, 1]
            normals[invalid] = np.repeat(faces, 3, axis=0)[invalid]
            lengths = np.linalg.norm(normals, axis=1)
            repaired_normals += int(invalid.sum())
        normals /= lengths[:, None]
        packed = np.concatenate([positions, normals], axis=1).astype("<f4")
        unique, inverse = np.unique(packed, axis=0, return_inverse=True)
        assert np.array_equal(unique[inverse], packed)
        assert np.isfinite(unique).all()
        position_accessor = add_accessor(unique[:, :3].copy(), 5126, "VEC3", 34962, True)
        normal_accessor = add_accessor(unique[:, 3:].copy(), 5126, "VEC3", 34962)
        short = len(unique) <= 65535
        index_accessor = add_accessor(inverse.astype("<u2" if short else "<u4"), 5123 if short else 5125, "SCALAR", 34963)
        mat_id = bindings[primitive.get("material")]
        color = effects[materials[mat_id]]
        assert len(color) == 4 and all(0 <= c <= 1 for c in color)
        material = {"name": mat_id, "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.08, "roughnessFactor": 0.56}}
        if max(color[:3]) < 0.03:
            material["pbrMetallicRoughness"].update(metallicFactor=0.02, roughnessFactor=0.65)
        mat_index = len(asset["materials"])
        asset["materials"].append(material)
        asset["meshes"][0]["primitives"].append({"attributes": {"POSITION": position_accessor, "NORMAL": normal_accessor}, "indices": index_accessor, "material": mat_index, "mode": 4})
        points.append(unique[:, :3])
        triangles += count
    binary_path = ROOT / "meshes" / f"{name}.bin"
    binary_path.write_bytes(binary)
    asset["buffers"].append({"uri": f"{name}.bin", "byteLength": len(binary)})
    save_json(ROOT / "meshes" / f"{name}.gltf", asset)
    info = {"sourceBytes": len(raw), "sourceSha256": sha256(raw).hexdigest(), "binaryBytes": len(binary), "triangles": triangles,
            "vertices": sum(len(p) for p in points), "embeddedTextures": 0, "repairedZeroNormals": repaired_normals}
    return asset, np.concatenate(points), info


urdf = ET.parse(ROOT / "source" / "urdf" / "go2_description.urdf")
links = {link.get("name"): link for link in urdf.getroot().findall("link")}
joints = urdf.getroot().findall("joint")
mesh_assets, mesh_points, mesh_info = {}, {}, {}
for name in NAMES:
    mesh_assets[name], mesh_points[name], mesh_info[name] = convert_mesh(name)


def joint_values(pitch=0, seated=True):
    return {f"{leg}_{part}_joint": value for leg in ("FL", "FR", "RL", "RR")
            for part, value in zip(("hip", "thigh", "calf"),
                                   (0.0, pitch + 0.42, -0.84) if seated and leg.startswith("F")
                                   else (0.0, pitch + 1.03, -2.45) if seated
                                   else (0.0, 1.36, -2.65))}


def world_matrices(values, pitch):
    worlds = {"base": rotation([0, 1, 0], -pitch)}
    pending = list(joints)
    while pending:
        progress = False
        for joint in pending[:]:
            parent = joint.find("parent").get("link")
            if parent not in worlds:
                continue
            local = origin(joint.find("origin"))
            if joint.get("type") == "revolute":
                value = values[joint.get("name")]
                limit = joint.find("limit")
                assert float(limit.get("lower")) <= value <= float(limit.get("upper"))
                local = local @ rotation(numbers(joint.find("axis").get("xyz")), value)
            worlds[joint.find("child").get("link")] = worlds[parent] @ local
            pending.remove(joint)
            progress = True
        assert progress, "URDF contains a cycle or missing parent"
    return worlds


def visual_points(link_name, world):
    visual = links[link_name].find("visual")
    name = Path(visual.find("geometry/mesh").get("filename")).stem
    return transform(mesh_points[name], world @ origin(visual.find("origin")))


def contact_difference(pitch):
    worlds = world_matrices(joint_values(pitch), pitch)
    return visual_points("FL_foot", worlds["FL_foot"])[:, 2].min() - visual_points("RL_foot", worlds["RL_foot"])[:, 2].min()


low, high = 0.0, 1.1
assert contact_difference(low) < 0 < contact_difference(high)
for _ in range(60):
    mid = (low + high) / 2
    if contact_difference(mid) < 0:
        low = mid
    else:
        high = mid
pitch = (low + high) / 2
values = joint_values(pitch)
worlds = world_matrices(values, pitch)
all_points = np.concatenate([visual_points(name, worlds[name]) for name, link in links.items() if link.find("visual") is not None])
height = float(-all_points[:, 2].min())
contacts = {name: float(visual_points(name, worlds[name])[:, 2].min() + height) for name in ("FL_foot", "FR_foot", "RL_foot", "RR_foot")}
assert max(contacts.values()) < 0.005, f"Foot/floor mismatch: {contacts}"
pose = {"name": "Seated alert: front legs extended, rear legs folded", "units": "meters and radians", "urdfAxes": "+X forward, +Y left, +Z up",
        "rootPitchUrdfRadians": -pitch, "rootHeightMeters": height, "jointValues": values,
        "footClearanceMeters": contacts, "boundsUrdfBeforeGrounding": {"min": all_points.min(axis=0).tolist(), "max": all_points.max(axis=0).tolist()},
        "foldedRestReference": {"rootPitchUrdfRadians": 0, "jointValues": joint_values(seated=False)},
        "note": "Display pose only, not a physical robot command. Front knees respect URDF limits and therefore retain a slight bend. Pitch is solved for matching front/rear sole height; all visual geometry is placed above the floor. No self-collision or dynamics validation."}
save_json(ROOT / "pose.json", pose)

combined = {"asset": {"version": "2.0", "generator": "Unitree Go2 articulated seated asset", "copyright": mesh_assets["base"]["asset"]["copyright"].replace("../LICENSE", "LICENSE")},
            "scene": 0, "scenes": [{"name": "Go2 seated alert", "nodes": [0]}], "nodes": [], "meshes": [], "materials": [], "accessors": [], "bufferViews": [], "buffers": []}
mesh_indices = {}
for name in NAMES:
    part = deepcopy(mesh_assets[name])
    buffer_offset = len(combined["buffers"])
    view_offset = len(combined["bufferViews"])
    accessor_offset = len(combined["accessors"])
    material_offset = len(combined["materials"])
    for buffer in part["buffers"]:
        buffer["uri"] = "meshes/" + buffer["uri"]
    for view in part["bufferViews"]:
        view["buffer"] += buffer_offset
    for accessor in part["accessors"]:
        accessor["bufferView"] += view_offset
    for primitive in part["meshes"][0]["primitives"]:
        primitive["indices"] += accessor_offset
        primitive["material"] += material_offset
        primitive["attributes"] = {key: value + accessor_offset for key, value in primitive["attributes"].items()}
    mesh_indices[name] = len(combined["meshes"])
    for key in ("meshes", "materials", "accessors", "bufferViews", "buffers"):
        combined[key].extend(part[key])

combined["nodes"].append({"name": "URDF_Z_UP_TO_GLTF_Y_UP", "rotation": [-math.sqrt(0.5), 0, 0, math.sqrt(0.5)], "children": [1]})
combined["nodes"].append({"name": "seated_body_pose", "translation": [0, 0, height], "rotation": [0, -math.sin(pitch / 2), 0, math.cos(pitch / 2)], "children": [2]})
link_indices = {}
for name, link in links.items():
    link_indices[name] = len(combined["nodes"])
    combined["nodes"].append({"name": name, "children": []})
for name, link in links.items():
    for visual in link.findall("visual"):
        mesh_name = Path(visual.find("geometry/mesh").get("filename")).stem
        visual_index = len(combined["nodes"])
        combined["nodes"].append({"name": f"{name}_visual", "mesh": mesh_indices[mesh_name], "matrix": matrix_list(origin(visual.find("origin")))})
        combined["nodes"][link_indices[name]]["children"].append(visual_index)
for joint in joints:
    joint_name = joint.get("name")
    matrix = origin(joint.find("origin"))
    node = {"name": joint_name, "translation": matrix[:3, 3].tolist(), "children": [link_indices[joint.find("child").get("link")]]}
    if joint.get("type") == "revolute":
        assert np.allclose(matrix[:3, :3], np.eye(3))
        axis = numbers(joint.find("axis").get("xyz"))
        angle = values[joint_name]
        node["rotation"] = (axis * math.sin(angle / 2)).tolist() + [math.cos(angle / 2)]
        node["extras"] = {"urdfAxis": axis.tolist(), "angleRadians": angle, "limit": {key: float(joint.find("limit").get(key)) for key in ("lower", "upper")}}
    else:
        node.pop("translation")
        node["matrix"] = matrix_list(matrix)
    index = len(combined["nodes"])
    combined["nodes"].append(node)
    combined["nodes"][link_indices[joint.find("parent").get("link")]]["children"].append(index)
for node in combined["nodes"]:
    if node.get("children") == []:
        node.pop("children")


def verify_node(index, parent):
    node = combined["nodes"][index]
    if "matrix" in node:
        local = np.array(node["matrix"]).reshape(4, 4, order="F")
    else:
        local = np.eye(4)
        if "rotation" in node:
            q = np.array(node["rotation"])
            angle = 2 * math.acos(np.clip(q[3], -1, 1))
            if np.linalg.norm(q[:3]) > 1e-12:
                local = rotation(q[:3], angle)
        local[:3, 3] = node.get("translation", [0, 0, 0])
    world = parent @ local
    if "mesh" in node:
        link_name = node["name"].removesuffix("_visual")
        expected = visual_points(link_name, worlds[link_name])
        expected[:, 2] += height
        expected = transform(expected, rotation([1, 0, 0], -math.pi / 2))
        actual = transform(mesh_points[NAMES[node["mesh"]]], world)
        assert np.allclose(actual, expected, atol=1e-7), f"Scene hierarchy mismatch: {link_name}"
    for child in node.get("children", []):
        verify_node(child, world)


verify_node(0, np.eye(4))
save_json(ROOT / "go2-seated.gltf", combined)

for visual in urdf.getroot().findall("link/visual"):
    mesh = visual.find("geometry/mesh")
    mesh.set("filename", "../meshes/" + Path(mesh.get("filename")).stem + ".gltf")
    for material in visual.findall("material"):
        visual.remove(material)
urdf.getroot().insert(0, ET.Comment(" Web derivative: corrected mesh paths; materials are embedded in glTF. Original URDF is in source/urdf. "))
ET.indent(urdf, space="  ")
urdf.write(ROOT / "urdf" / "go2_description.urdf", encoding="utf-8", xml_declaration=True)
for mesh in urdf.getroot().findall("link/visual/geometry/mesh"):
    assert (ROOT / "urdf" / mesh.get("filename")).resolve().is_file()

archive_path = ROOT / "source" / "meshes.zip"
if not archive_path.exists():
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in NAMES:
            archive.writestr(f"meshes/{name}.dae", source_bytes(name))
        archive.write(ROOT / "LICENSE", "LICENSE")
        archive.write(ROOT / "source" / "urdf" / "go2_description.urdf", "urdf/go2_description.urdf")
        archive.write(ROOT / "source" / "package.xml", "package.xml")
with zipfile.ZipFile(archive_path) as archive:
    assert archive.testzip() is None
    for name in NAMES:
        assert sha256(archive.read(f"meshes/{name}.dae")).hexdigest() == mesh_info[name]["sourceSha256"]

manifest = {"repository": "https://github.com/unitreerobotics/unitree_ros", "commit": COMMIT, "license": "BSD-3-Clause", "meshes": mesh_info,
            "uniqueTriangles": sum(item["triangles"] for item in mesh_info.values()),
            "assembledTriangles": sum(mesh_info[Path(link.find("visual/geometry/mesh").get("filename")).stem]["triangles"] for link in links.values() if link.find("visual") is not None),
            "webBufferBytes": sum(item["binaryBytes"] for item in mesh_info.values()), "sourceArchiveBytes": archive_path.stat().st_size,
            "conversions": ["Apply original Collada scene matrices once in URDF local Z-up coordinates", "Retain every source triangle and material assignment", "Retain positions and normals as float32; deduplicate identical position/normal pairs", "Discard unused UVs because the assets contain no textures", "Use glTF PBR roughness 0.56, metallic 0.08; dark materials roughness 0.65, metallic 0.02", "Share seven binary buffers across individual parts and articulated seated scene"]}
save_json(ROOT / "manifest.json", manifest)
print(json.dumps({"manifest": manifest, "pose": pose}, indent=2))
