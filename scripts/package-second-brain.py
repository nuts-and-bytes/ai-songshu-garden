"""Build the public starter zip from tracked source inputs (no local runtime files)."""
from pathlib import Path
import zipfile, argparse
root=Path(__file__).resolve().parents[1]
kit=root/'public/downloads/stone-second-brain'
for name in ('test_workflow.py','verify_real_example.py'):
    assert (kit/'tests'/name).read_bytes()==(root/'tests/starter'/name).read_bytes(),f'Outdated packaged test: {name}'
assert (kit/'docs/给AI的搭建提示词.md').read_bytes()==(root/'public/downloads/stone-second-brain-prompt.md').read_bytes()
files={}
for p in sorted(kit.rglob('*')):
    if not p.is_file() or any(part.startswith('.') or part=='__pycache__' for part in p.relative_to(kit).parts):continue
    if p.suffix not in ('.md','.py','.txt','.rst') and p.name!='LICENSE':raise ValueError(f'Unexpected package file: {p}')
    data=p.read_bytes()
    assert b'/Users/ericlu' not in data, f'Local path in {p}'
    files[p.relative_to(kit.parent).as_posix()]=data
out=kit.with_suffix('.zip')
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
if args.check:
    with zipfile.ZipFile(out) as z:assert {n:z.read(n) for n in z.namelist()}==files,'ZIP differs from source'
else:
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for n,data in files.items():
            i=zipfile.ZipInfo(n,(2026,10,28,0,0,0));i.compress_type=zipfile.ZIP_DEFLATED;i.external_attr=0o100644<<16;z.writestr(i,data)
print(f'PASS {len(files)} public files; ZIP matches source')
