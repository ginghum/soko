from pathlib import Path
root = Path(__file__).resolve().parent.parent
game = root / 'docs/game.js'
text = game.read_text()
for name, marker in [('expansion', 'EXPANSION'), ('ascent', 'ASCENT'), ('campaign', 'CAMPAIGN')]:
    start, end = '// ' + marker + ' START', '// ' + marker + ' END'
    block = start + '\n' + (root / ('src/' + name + '.js')).read_text() + '\n' + end
    if start in text:
        text = text[:text.index(start)] + block + text[text.index(end) + len(end):]
    else:
        text = text.replace('function frame(t)', block + '\nfunction frame(t)')
game.write_text(text)
