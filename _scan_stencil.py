import re
import pathlib
p = pathlib.Path(r"C:\Users\skous\AppData\Local\Temp\stencil-poster.js").read_text(encoding="utf-8", errors="replace")
for m in set(re.findall(r"[\w./-]+\.wasm", p)):
    print("WASM", m)
for m in set(re.findall(r"https?://[^\"']+", p)):
    print("URL", m[:200])
print("poster count", p.count("poster"))
# print nearby create_stencil
i = p.find("create_stencil")
print(p[max(0,i-200):i+400])
