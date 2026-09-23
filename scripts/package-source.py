"""Package reusable source without private files, environments or Apple assets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
files = ['index.html', 'main.js', 'ui.js', 'style.css', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'requirements-assets.txt', 'vercel.json', '.gitignore', '.vercelignore']
with ZipFile(root / 'source.zip', 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, f'24th-fold-preview/{name}')
    for directory in ['vendor', 'previews', 'scripts']:
        for path in (root / directory).rglob('*'):
            if path.is_file() and '__pycache__' not in path.parts:
                archive.write(path, f'24th-fold-preview/{path.relative_to(root)}')
print('Created source.zip. Apple assets must be prepared separately.')
