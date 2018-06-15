# PoC: pdf from pdf + html

Creates a (transparent) pdf from given `part.html` and then overlays it on the second page of `base.pdf` to create `complete.pdf`.

Uses puppeteer to create a pdf from the html. Uses hummus to merge the pdfs.

Install needed packages: `npm i`


```
node index.js
```
