# Data and dependencies

## Berean Standard Bible

`data/BSB.json` derives from the [Scrollmapper BSB JSON](https://github.com/scrollmapper/bible_databases/blob/master/formats/json/BSB.json). The [source translation notice](https://github.com/scrollmapper/bible_databases/blob/master/sources/en/BSB/README.md) declares **Creative Commons CC0**. Berean Standard Bible attribution is retained here and in the app’s translation name.

The source has 31,102 verse slots across 66 books. Sixteen slots contain no text; Shepherd Pro omits these from the searchable dataset instead of supplying invented verses. It contains **31,086 nonempty verses**, preserving original references, book names, and text. The JSON was normalized to `{id,name,verses:[{book,chapter,verse,text}]}`. Existing Roman-numbered book names are supported by the search alias layer.

Scrollmapper’s repository code is MIT-licensed, copyright (c) 2024 Scrollmapper; translation texts have their own notices. No converter source was copied.

## Strong’s dictionaries

`public/lexicon.json` contains 14,197 Greek and Hebrew dictionary entries derived from [Open Scriptures / strongs](https://github.com/openscriptures/strongs). The original Greek file credits James Strong (1890), Ulrik Petersen’s XML text, and the 2009 Open Scriptures JSON conversion, marked **CC-BY-SA**. The Hebrew notice credits the Bible Foundation, Michael Grier, David Troidl, and contributors. Original notices are preserved in [strongs-greek-notice.txt](strongs-greek-notice.txt) and [strongs-hebrew-notice.txt](strongs-hebrew-notice.txt).

The source files are [Greek](https://github.com/openscriptures/strongs/blob/master/greek/strongs-greek-dictionary.js) and [Hebrew](https://github.com/openscriptures/strongs/blob/master/hebrew/strongs-hebrew-dictionary.js). This derived dictionary retains the source CC-BY-SA terms where applicable; the source notice does not specify a license version. Changes: inert JSON extraction, renamed normalized fields, combined language-tagged entries. No original-language-to-BSB word alignment is asserted. Consult the upstream notices before redistributing the data independently.

## Software

The application uses React, Vite, Lucide, JSZip, PDF.js, PptxGenJS, Playwright, and an optional Electron shell. Their licenses are retained in installed packages and resolved versions in lockfiles. No fonts, icons, translations, backgrounds, NDI libraries, binaries or application code from Pewbeam are included in Shepherd Pro’s implementation. Limited user-supplied bundle excerpts are included only in the evidence documentation.
