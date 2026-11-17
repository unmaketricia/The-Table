from pathlib import Path
from io import BytesIO
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'public/fonts/Kalam-Bold.woff')
font.flavor = None
buffer = BytesIO()
font.save(buffer)
font_bytes = buffer.getvalue()
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()

def lettering(text, width, height, top):
    bounds = BoundsPen(glyphs)
    offset = 0
    for char in text:
        name = cmap[ord(char)]
        glyphs[name].draw(TransformPen(bounds, (1, 0, 0, 1, offset, 0)))
        offset += font['hmtx'][name][0]
    x0, y0, x1, y1 = bounds.bounds
    scale = min(width / (x1-x0), height / (y1-y0))
    x = (512-(x1-x0)*scale)/2-x0*scale
    y = top+y1*scale
    pen = SVGPathPen(glyphs)
    offset = 0
    for char in text:
        name = cmap[ord(char)]
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x+offset*scale, y)))
        offset += font['hmtx'][name][0]
    return pen.getCommands()

paths = [lettering('The', 250, 88, 136), lettering('Table', 340, 124, 248)]
compact = lettering('T', 290, 332, 90)

def svg(items):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>The Table</title><rect width="512" height="512" fill="#2F4156"/>' + ''.join('<path fill="#FFFFFF" d="'+p+'"/>' for p in items) + '</svg>'

(root/'public/the-table-kalam.svg').write_text(svg(paths))
(root/'public/favicon-kalam.svg').write_text(svg([compact]))
(root/'lib/table-logo.ts').write_text('const wordmarkPaths='+json.dumps(paths)+';\nconst compactPath='+json.dumps(compact)+';\nexport function tableLogoSvg(background:string,ink:string,compact=true){\n return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${background}"/>${(compact?[compactPath]:wordmarkPaths).map(d=>`<path fill="${ink}" d="${d}"/>`).join(\'\')}</svg>`;\n}\n')

def image(size, tiny=False):
    canvas = Image.new('RGB', (size*4, size*4), '#2F4156')
    draw = ImageDraw.Draw(canvas)
    lines = [('T',290,332,90)] if tiny else [('The',250,88,136),('Table',340,124,248)]
    factor = size*4/512
    for text, width, height, top in lines:
        sample = ImageFont.truetype(BytesIO(font_bytes), 1000)
        box = sample.getbbox(text)
        point_size = int(1000*min(width/(box[2]-box[0]),height/(box[3]-box[1]))*factor)
        actual = ImageFont.truetype(BytesIO(font_bytes), point_size)
        box = actual.getbbox(text)
        x = (size*4-(box[2]-box[0]))/2-box[0]
        draw.text((x,top*factor-box[1]),text,font=actual,fill='#FFFFFF')
    return canvas.resize((size,size),Image.Resampling.LANCZOS)

for size in [180,192,512]:
    image(size).save(root/f'public/the-table-kalam-{size}.png')
image(180).save(root/'public/apple-touch-icon.png')
image(512).save(root/'public/icon.png')
image(32,True).save(root/'public/the-table-kalam-32.png')
image(64,True).save(root/'public/the-table-kalam.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
image(64,True).save(root/'public/favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
(root/'public/favicon.svg').write_text(svg([compact]))
manifest_path=root/'public/manifest.webmanifest'
manifest=json.loads(manifest_path.read_text())
for icon in manifest['icons']:
    size=icon['sizes'].split('x')[0]
    icon['src']=f'/the-table-kalam-{size}.png'
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
