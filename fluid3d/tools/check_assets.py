#!/usr/bin/env python3
"""Check the shipped pass graph, reference links and generated artifacts."""
from pathlib import Path
import json
import re
import subprocess
import sys
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'tools/build.py'),'--check'],check=True)
pipeline=json.loads((root/'pipeline.json').read_text())
passes=pipeline['passes'];positions={p['name']:i for i,p in enumerate(passes)}
assert len(passes)==51 and len(positions)==51
for i,p in enumerate(passes):
    assert (root/p['shader']).is_file(),p['shader']
    for variable,ref in p['inputs'].items():
        assert ref['pass'] in positions
        assert ref['frame'] in ('current','previous')
        if ref['frame']=='current': assert positions[ref['pass']]<i,(p['name'],variable)
        else: assert positions[ref['pass']]>=i,(p['name'],variable)
    assert p['format']=='RGBA32F'
for doc in [root/'README.md',root/'VALIDATION.md',root.parent/'README.md',root.parent/'tutorials/09_fluid3d.md']:
    for link in re.findall(r'\]\(([^)]+)\)',doc.read_text()):
        if '://' not in link and not link.startswith('#'):
            assert (doc.parent/link.split('#')[0]).exists(),(doc.name,link)
print('51-pass graph ordering and all local document links verified.')
