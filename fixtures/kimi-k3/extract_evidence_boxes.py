"""Print normalized boxes for exact phrases in the supplied Kimi K3 PDF."""

from __future__ import annotations

import json
from pathlib import Path

import pypdfium2 as pdfium


ROOT = Path(__file__).resolve().parents[2]
PDF_PATH = ROOT / "apps/web/public/papers/kimi-k3-tech-blog.pdf"

EVIDENCE_PHRASES = {
    "evidence-model-scale": (
        1,
        "Kimi K3 is a\r\n"
        "2.8T-parameter model built on our Kimi Delta Attention and Attention\r\n"
        "Residuals, with native vision capabilities and a 1-million-token context\r\n"
        "window.",
    ),
    "evidence-routing": (
        4,
        "Mixture of Experts (MoE) sparsity, effectively activating 16 out of 896 experts\r\n"
        "when paired with a Stable LatentMoE framework. Together with refined\r\n"
        "training and data recipes, these structural changes yield an approximate 2.5×\r\n"
        "improvement in overall scaling efficiency compared to Kimi K2",
    ),
}


def locate_phrase(
    document: pdfium.PdfDocument,
    page_number: int,
    phrase: str,
) -> list[dict[str, float]]:
    page = document[page_number - 1]
    text_page = page.get_textpage()
    text = text_page.get_text_range()
    start = text.index(phrase)
    page_width, page_height = page.get_size()
    boxes = []
    cursor = start
    for line in phrase.split("\r\n"):
        line_start = text.index(line, cursor)
        characters = [
            text_page.get_charbox(index)
            for index in range(line_start, line_start + len(line))
            if not text[index].isspace()
        ]
        left = min(value[0] for value in characters)
        bottom = min(value[1] for value in characters)
        right = max(value[2] for value in characters)
        top = max(value[3] for value in characters)
        boxes.append(
            {
                "x": round(left / page_width, 6),
                "y": round((page_height - top) / page_height, 6),
                "width": round((right - left) / page_width, 6),
                "height": round((top - bottom) / page_height, 6),
            }
        )
        cursor = line_start + len(line)

    text_page.close()
    page.close()
    return boxes


def main() -> None:
    document = pdfium.PdfDocument(PDF_PATH)
    try:
        output = {
            evidence_id: {
                "pageNumber": page_number,
                "exactText": phrase,
                "boxes": locate_phrase(document, page_number, phrase),
            }
            for evidence_id, (page_number, phrase) in EVIDENCE_PHRASES.items()
        }
    finally:
        document.close()

    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
