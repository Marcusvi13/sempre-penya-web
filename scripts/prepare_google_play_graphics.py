#!/usr/bin/env python3
"""Google Play graphics from the already-live web assets. No redrawing/recoloring."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import zipfile, hashlib

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"google-play-assets"
OUT.mkdir(exist_ok=True)
GREEN=(0,84,65)
src=Image.open(ROOT/"cjb_logo.png").convert("RGBA")
bbox=src.getchannel("A").getbbox()
assert bbox is not None, "Production crest is empty"
src=src.crop(bbox)
assert src.height>src.width, "Production shield has unexpected proportions"

def current_brand_icon(size):
    # Same geometry and colors as the existing favicon/Apple touch icon workflow.
    icon=Image.new("RGBA",(size,size),(0,0,0,0))
    draw=ImageDraw.Draw(icon)
    pad=max(1,round(size*.07))
    ring=max(1,round(size*.035))
    draw.ellipse((pad,pad,size-pad-1,size-pad-1), fill="white",outline=GREEN,width=ring)
    max_w,max_h=round(size*.52),round(size*.72)
    scale=min(max_w/src.width,max_h/src.height)
    w,h=round(src.width*scale),round(src.height*scale)
    crest=src.resize((w,h),Image.Resampling.LANCZOS)
    icon.alpha_composite(crest,((size-w)//2,(size-h)//2))
    return icon

# 512px PNG with the EXACT icon geometry already used by the website, rendered
# from the ORIGINAL full-size production crest (no enlargement artifacts).
icon=current_brand_icon(512)
iconfile=OUT/"01-sempre-penya-icona-512.png"
icon.save(iconfile,optimize=True)

# Feature graphic: reuse existing site header gradient, live crest, white circle,
# "Sempre Penya" spelling and bold sans typography; no invented brand artwork.
w,h=1024,500
left=(11,111,89);mid=(0,84,65);right=(0,46,36)
feature=Image.new("RGB",(w,h))
pix=feature.load()
for x in range(w):
    p=x/(w-1)
    if p<=.52: a,b,t=left,mid,p/.52
    else: a,b,t=mid,right,(p-.52)/.48
    color=tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))
    for y in range(h): pix[x,y]=color
draw=ImageDraw.Draw(feature)
# Use actual production crest within exactly the existing website's white disk.
disk=320
disk_img=current_brand_icon(disk)
feature.paste(disk_img,(54,(h-disk)//2),disk_img)

font_path="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
try: f1=ImageFont.truetype(font_path,98);f2=ImageFont.truetype(font_path,104)
except OSError: f1=ImageFont.load_default();f2=f1
x=422
draw.text((x,121),"Sempre",font=f1,fill="white",stroke_width=0)
draw.text((x,242),"Penya",font=f2,fill="white",stroke_width=0)
banner=OUT/"02-sempre-penya-imatge-promocional-1024x500.png"
feature.save(banner,optimize=True)

readme=OUT/"LLEGEIX-ME.txt"
readme.write_text(
    "Sempre Penya — gràfics per a Google Play\n"
    "Origen: recursos ja utilitzats a la web de producció Sempre Penya.\n"
    "Escut: cjb_logo.png de la branca principal del lloc web.\n"
    "Icona: mateix cercle blanc, filet verd i escut que apple-touch-icon.png,\n"
    "        regenerats amb resolució 512 x 512 des de l'escut original.\n"
    "Imatge promocional: mateix escut i colors corporatius de la capçalera\n"
    "        actual del web; composició horitzontal adaptada a 1024 x 500.\n"
    "No s'ha alterat ni redibuixat l'escut ni canviat els seus colors.\n"
    "Cal obtenir captures reals de l'app per completar Google Play.\n",
    encoding="utf-8"
)
for p,dimensions in [(iconfile,(512,512)),(banner,(1024,500))]:
    with Image.open(p) as im:
        assert im.size==dimensions and im.format=="PNG"
    assert p.stat().st_size<=1024*1024, f"{p.name} exceeds 1 MB"
    print(p.name,p.stat().st_size,"SHA-256",hashlib.sha256(p.read_bytes()).hexdigest())

with zipfile.ZipFile(OUT/"sempre-penya-google-play-grafics.zip","w",compression=zipfile.ZIP_DEFLATED) as z:
    for p in [iconfile,banner,readme]: z.write(p,p.name)
print("OK: production-only assets prepared, no app or web source changed.")
