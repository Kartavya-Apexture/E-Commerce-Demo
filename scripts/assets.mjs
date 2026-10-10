import { mkdirSync, writeFileSync } from "node:fs";
const photos = {
  "look-0.jpg": "1483985988355-763728e1935b",
  "look-1.jpg": "1490481651871-ab68de25d43d",
  "look-3.jpg": "1551488831-00ddcb6c6bd3",
  "look-4.jpg": "1566206091558-7f218b696731",
  "look-5.jpg": "1566174053879-31528523f8ae",
  "look-7.jpg": "1612722432474-b971cdcea546",
  "look-8.jpg": "1515372039744-b8f02a3ae446",
  "look-9.jpg": "1551803091-e20673f15770",
  "look-11.jpg": "1503342217505-b0a15ec3261c",
  "look-12.jpg": "1554568218-0f1715e72254",
  "look-13.jpg": "1583496661160-fb5886a0aaaa",
  "look-15.jpg": "1539008835657-9e8e9680c956",
  "look-17.jpg": "1541099649105-f69ad21f3246",
  "look-18.jpg": "1584370848010-d7fe6bc767ec",
  "look-19.jpg": "1544441893-675973e31985",
  "look-23.jpg": "1469334031218-e382a71b716b",
  "look-24.jpg": "1524504388940-b1c1722653e1",
  "look-25.jpg": "1534528741775-53994a69daeb",
};
mkdirSync("public/images/catalogue", { recursive: true });
mkdirSync("public/fonts", { recursive: true });
for (const [file, id] of Object.entries(photos)) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=85`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    writeFileSync(
      `public/images/catalogue/${file}`,
      Buffer.from(await res.arrayBuffer()),
    );
    console.log(file, id);
  } catch (e) {
    throw new Error(`Could not download ${file}: ${String(e)}`);
  }
}
for (const [family, file] of [
  ["inter", "Inter[opsz,wght].ttf"],
  ["playfairdisplay", "PlayfairDisplay[wght].ttf"],
]) {
  for (const name of [file, "OFL.txt"]) {
    const r = await fetch(
      `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/${encodeURIComponent(name)}`,
    );
    if (!r.ok) throw new Error(`Font ${r.status}`);
    writeFileSync(
      `public/fonts/${family}-${name === "OFL.txt" ? "OFL.txt" : "variable.ttf"}`,
      Buffer.from(await r.arrayBuffer()),
    );
  }
}
writeFileSync(
  "public/images/catalogue/sources.json",
  JSON.stringify(photos, null, 2),
);
