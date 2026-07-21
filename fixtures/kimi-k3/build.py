# -*- coding: utf-8 -*-
"""Glyph No.1 build script.

Reads source.html (concept cards written as open <div class="gcard"> blocks),
converts the twelve cards to closed <details> elements, runs the validators,
and writes report.html (the publishable file).

Usage:  python build.py   (from this folder)
"""
import io, os, re, sys
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))

html = io.open(os.path.join(HERE, "source.html"), encoding="utf-8").read()

# concept cards: open divs -> closed details with summary
n1 = len(re.findall(r'<div class="gcard"><p class="term">', html))
html = re.sub(r'<div class="gcard"><p class="term">([^<]+)</p>',
              r'<details class="gcard"><summary>\1</summary><div class="gbody">', html)
html, n2 = re.subn(r'(<p class="lnk">(?:(?!</div>).)*?</p>)\s*</div>',
                   r'\1</div></details>', html, flags=re.S)
print("cards converted:", n1, "| closings fixed:", n2)
assert n1 == n2 == 12, "card conversion mismatch"

io.open(os.path.join(HERE, "report.html"), "w", encoding="utf-8").write(html)

# --- validators ---
from html.parser import HTMLParser
VOID = {"br","hr","img","input","meta","link","marker","path","rect","circle","line","defs","use"}
class C(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.errors=[]
    def handle_starttag(self, tag, attrs):
        if tag.lower() not in VOID: self.stack.append((tag, self.getpos()))
    def handle_endtag(self, tag):
        if tag.lower() in VOID: return
        if self.stack and self.stack[-1][0] == tag: self.stack.pop()
        else: self.errors.append((tag, self.getpos()))
c = C(); c.feed(html)
for t, p in c.stack: c.errors.append(("unclosed " + t, p))
print("tag errors:", len(c.errors), c.errors[:8])

prose = re.sub(r"<svg.*?</svg>", "", html, flags=re.S)
prose = re.sub(r"<script>.*?</script>", "", prose, flags=re.S)
print("em-dash in prose:", prose.count("—"), "| en-dash:", prose.count("–"))
for bad in ["PRD", "bakes", "ablation", "rug-pull", "milks"]:
    print("check %r: %d" % (bad, prose.count(bad)))

ids = set(re.findall(r'id="(s[0-9-]+)"', html))
hrefs = set(re.findall(r'href="#(s[0-9-]+)"', html))
print("anchor mismatch:", sorted(hrefs - ids), sorted(ids - hrefs))
print("tabs:", html.count('class="tabpane'), "| plates:", html.count('class="ptitle"'),
      "| closed cards:", html.count('<details class="gcard">'))
print("written report.html:", len(html), "chars")
