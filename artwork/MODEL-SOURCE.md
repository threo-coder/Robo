# Unitree Go2 Model Handoff

## Integration Update

The site viewer adds original ivory shell armor, an optical head with subtle pointer tracking, and metallic/graphite finishes to the licensed reference geometry. The requested seated pose is retained. Runtime files remain in `dist/assets/model/go2/`; original downloads and conversion/validation scripts were moved out of the deployment into `artwork/model-source/`. The original source ZIP is retained at `artwork/model-source/original/meshes.zip`. Temporary validator files are in ignored `artifacts/model-validation/`. Paths and total retained file sizes in the original handoff below describe the asset handoff before this cleanup.

## Source And License

- Official source: [unitreerobotics/unitree_ros, pinned commit](https://github.com/unitreerobotics/unitree_ros/tree/5994d4faef0a9cadd3287f8de0199a67eeb2a259/robots/go2_description).
- Commit: `5994d4faef0a9cadd3287f8de0199a67eeb2a259`. Downloaded 2026-10-10.
- The package declares `BSD`; the repository [LICENSE](https://github.com/unitreerobotics/unitree_ros/blob/5994d4faef0a9cadd3287f8de0199a67eeb2a259/LICENSE) specifies BSD-3-Clause, copyright 2016-2022 HangZhou YuShu TECHNOLOGY CO.,LTD. ("Unitree Robotics"). No separate mesh license was found. Preserve the complete notice, conditions, and disclaimer in distribution materials. Do not imply Unitree endorsement or identify this as an original RoboKing mechanical design.
- Unmodified license: `C:/Users/night/Downloads/rk/roboking-studio/dist/assets/model/go2/LICENSE`. Suggested site credit: "Go2 model: Unitree Robotics, BSD-3-Clause", linked to `/assets/model/go2/LICENSE`.

## Files

Asset root: `C:/Users/night/Downloads/rk/roboking-studio/dist/assets/model/go2/`.

| Path Within Asset Root | Use |
| --- | --- |
| `go2-seated.gltf` | Recommended: complete articulated, grounded, seated-alert robot, ready for Three.js GLTFLoader. |
| `meshes/{base,hip,thigh,thigh_mirror,calf,calf_mirror,foot}.gltf` | Seven independent part assets, each with a matching `.bin`. |
| `urdf/go2_description.urdf` | Valid local web URDF with relative `.gltf` paths; use a glTF-capable mesh callback. |
| `pose.json` | Exact seated joint values, body pitch/height, foot clearances, and optional all-folded reference. |
| `source/meshes.zip` | Verbatim original seven DAEs, original URDF, package metadata, and license. SHA-256 values in `manifest.json`. |
| `source/meshes/*.dae` | Uncompressed original downloads also remain; never fetched by the optimized glTF. |
| `source/urdf/go2_description.urdf` | Unmodified upstream URDF for reference only: upstream incorrectly references `dae/` instead of `meshes/`. |
| `source/package.xml` | Original package metadata and BSD declaration. |
| `manifest.json`, `validation.json` | Geometry/source statistics and Khronos validator results. |

No textures are required. Materials and logo geometry are embedded. Keep the complete `meshes/` folder with the assembled glTF: it shares the same seven binary buffers, not duplicate geometry downloads.

## Seated Pose

Latest requested pose: **two front legs extended/upright, two rear legs folded down, chest raised**. These are display-pose values, not hardware commands. Radians, right-handed URDF axes: +X forward, +Y left, +Z up. `FL/FR` = front left/right; `RL/RR` = rear left/right.

| Joint | FL | FR | RL | RR |
| --- | ---: | ---: | ---: | ---: |
| `*_hip_joint` | 0 | 0 | 0 | 0 |
| `*_thigh_joint` | 1.101593208 | 1.101593208 | 1.711593208 | 1.711593208 |
| `*_calf_joint` | -0.84 | -0.84 | -2.45 | -2.45 |

URDF base pitch about +Y: **-0.681593208 rad** (chest raised about 39.05 degrees). Base translation Z: **0.289428976 m**. The assembled glTF already applies these values and floor placement. Front knees cannot become perfectly straight within the source limits (`calf` upper limit = -0.83776); the chosen -0.84 is nearly maximum valid extension. All four foot minima coincide with the floor; the complete model is about 0.665 m long, 0.324 m wide, and 0.544 m high. Self-collision/dynamics have not been tested.

Optional all-folded reference, not the requested seated pose: all hips 0, thighs 1.36, calves -2.65, body pitch 0. Recompute floor height if using it.

## Three.js Assembly

1. **Easiest:** load `/assets/model/go2/go2-seated.gltf` with `GLTFLoader`. It is already Y-up, faces +X, and rests on Y=0. Do not apply another Z-up conversion. Named nodes such as `FL_thigh_joint` retain local joint pivots for animation. `seated_body_pose` holds body pitch/height inside `URDF_Z_UP_TO_GLTF_Y_UP`.
2. **Custom assembly:** load the web URDF using a mesh callback that returns each `GLTFLoader` result's `.scene`, preserving embedded materials. Default URDFLoader only supports STL/DAE; glTF requires this callback. Standalone parts deliberately remain in URDF-local Z-up coordinates. Apply `Rx(-PI/2)` once around the whole robot for Three.js Y-up; apply the body `Ry(-0.681593208)` inside that wrapper, then joint rotations.
3. Joint transform is parent * origin translation * origin `Rz(yaw) Ry(pitch) Rx(roll)` * rotation around joint axis. Hips use local X; thighs/calves use local Y. Preserve visual origins separately, especially the 180-degree rotations of right/rear hip visuals. Do not mirror geometry with a negative scale. Foot fixed offset is `(0,0,-0.213)` from calf; calf offset is `(0,0,-0.213)` from thigh.
4. Original Collada scene matrices were baked into each glTF's vertices/normals once. There is no remaining per-part axis conversion to apply. Keep source colors; use PBR/environment lighting and contact shadows for a realistic finish. Collision, rotor, and sensor-only links intentionally have no visual geometry.

## Size And Checks

- Original DAE geometry: 25,932,493 bytes. Browser binary buffers: **4,392,124 bytes (4.39 MB)**, plus small glTF JSON files. Original source archive: **6,478,874 bytes (6.48 MB)**; do not fetch it at runtime.
- Ready-to-load seated asset including its seven buffers: **4,416,189 bytes (4.42 MB)**. Complete on-disk model folder: **37,427,657 bytes (37.43 MB)**. Shell policy blocked cleanup of duplicate `source/meshes/` originals (25.93 MB) and temporary `.validation/` validator files (0.49 MB); both remain strictly within the asset scope. Neither is needed by the optimized model at runtime.
- All 196,836 unique source triangles retained, 398,632 triangles across the assembled robot, about 33 material draw calls. Identical position/normal pairs are indexed; unused UVs omitted; 17 invalid zero normals repaired; no shape decimation or external decoder dependency.
- Modified web URDF resolves every visual file locally and removes redundant upstream visual material tags, retaining the glTF materials. Original source remains unmodified in the archive.
- All eight glTF files pass Khronos glTF Validator with zero errors/warnings. Informational findings concern retained degenerate source triangles and empty URDF nodes. Source archive hashes, joint limits, all visual geometry bounds, and foot/floor alignment checked. No viewer or browser render was created.
