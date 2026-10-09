"""Contact sheet: python contact_sheet.py <out.png> <columns> <cell_px> <images...> (labels = file names)"""
import sys, os
from PIL import Image, ImageDraw
out, cols, cell = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
rows = (len(files)+cols-1)//cols
sheet = Image.new("RGB", (cols*cell, rows*(cell+22)), (245,244,241))
d = ImageDraw.Draw(sheet)
for i,f in enumerate(files):
    im = Image.open(f).convert("RGBA"); im.thumbnail((cell-8,cell-8))
    bg = Image.new("RGBA", im.size, (245,244,241,255)); bg.alpha_composite(im)
    x,y = (i%cols)*cell, (i//cols)*(cell+22)
    sheet.paste(bg.convert("RGB"), (x+(cell-im.width)//2, y+(cell-im.height)//2))
    d.text((x+6,y+cell+4), os.path.basename(f)[:40], fill=(30,30,30))
sheet.save(out)
