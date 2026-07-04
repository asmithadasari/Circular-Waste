"""
Prototype validation script for the AI Waste Scanner.

Usage:
    python -m app.services.validate_classifier /path/to/test_images

Expects a folder structured as:
    test_images/plastic/*.jpg
    test_images/paper/*.jpg
    test_images/cardboard/*.jpg
    test_images/glass/*.jpg
    test_images/metal/*.jpg
    test_images/organic/*.jpg

Prints a table of Actual / Predicted / Correct for every image, plus an
overall accuracy figure. Report this ONLY as "prototype validation
accuracy on N images", never as a general/production accuracy claim -
this is a small, hand-labelled test set, not a benchmark.
"""
import sys
from pathlib import Path

from app.services.classifier import classify_image, WASTE_CLASSES


def main(folder: str):
    root = Path(folder)
    if not root.exists():
        print(f"Folder not found: {folder}")
        sys.exit(1)

    total = 0
    correct = 0
    print(f"{'ACTUAL':<12}{'PREDICTED':<12}{'CONFIDENCE':<12}{'CORRECT'}")
    for waste_class in WASTE_CLASSES:
        class_dir = root / waste_class
        if not class_dir.exists():
            continue
        for img_path in sorted(class_dir.glob("*")):
            if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
                continue
            image_bytes = img_path.read_bytes()
            predicted, confidence = classify_image(image_bytes)
            is_correct = predicted == waste_class
            total += 1
            correct += int(is_correct)
            print(f"{waste_class:<12}{predicted:<12}{confidence:<12.2f}{'YES' if is_correct else 'no'}")

    if total == 0:
        print("No images found. Check your folder structure.")
        return

    accuracy = correct / total * 100
    print("\n----------------------------------------")
    print(f"Prototype validation accuracy on {total} images: {accuracy:.1f}%")
    print("This is a small hand-labelled test set, not a production benchmark.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.services.validate_classifier <folder_of_labelled_images>")
        sys.exit(1)
    main(sys.argv[1])
