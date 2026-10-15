# Bible sources with clear reuse terms

Shepherd Pro already includes these complete translation datasets. There is no need to download them again, and reference/phrase search works offline. Each neural translation index is built separately.

| Translation | Reuse notice | App JSON |
| --- | --- | --- |
| Berean Standard Bible (BSB) | [Explicit CC0 notice](licenses/BSB-translation-notice.md) | [BSB.json](../data/BSB.json) |
| American Standard Version, 1901 (ASV) | [Explicit public-domain notice](licenses/ASV-translation-notice.md) | [ASV.json](../data/ASV.json) |
| Young’s Literal Translation, 1898 (YLT) | [Explicit public-domain notice](licenses/YLT-translation-notice.md) | [YLT.json](../data/YLT.json) |

For a modern English default, use **BSB**: its explicit CC0 dedication provides clear reuse terms. ASV and YLT offer alternatives with public-domain source notices. This documents the evidence for reuse; it is not a zero-risk guarantee about every upstream transcription or every jurisdiction.

The source is [Scrollmapper bible_databases at revision e1b254c](https://github.com/scrollmapper/bible_databases/tree/e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c). Its [BSB](https://github.com/scrollmapper/bible_databases/blob/e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c/sources/en/BSB/README.md), [ASV](https://github.com/scrollmapper/bible_databases/blob/e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c/sources/en/ASV/README.md) and [YLT](https://github.com/scrollmapper/bible_databases/blob/e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c/sources/en/YLT/README.md) notices state the translation terms separately from the repository's software license. The BSB notice was retained on 15 October 2026; the existing BSB data was reused. ASV/YLT source hashes, normalized hashes and transformations are recorded in [the download manifest](evidence/additional-translations.json).

## The Message and TPT

Neither is bundled or relabelled as public domain. A GitHub JSON copy or a repository-level MIT license does not establish permission for these translation texts. Adding either requires an authorized digital source or API with terms covering the intended application, offline storage and distribution where applicable. A normal reading subscription or purchased ebook does not by itself establish those app permissions. Publisher permissions pages were inaccessible from this environment, so an available commercial license has not been confirmed or ruled out.

## Adding another translation

Retain the translation's own license/permission notice and source revision with the data, validate book/verse references and source integrity, and identify the edition accurately. Use the existing JSON import for data you are authorized to use. Do not treat a format conversion as a change to the translation's copyright status. The app's free feature access does not change third-party text rights.
