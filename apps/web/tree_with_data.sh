#!/bin/bash
# Script to generate one file with:
# 1. Tree hierarchy at the top
# 2. File contents of src/app/components/tests
# 3. File contents of selected top-level files

BASE_DIR="/mnt/c/Users/91739/Documents/CD_project/Chitradhara/apps/web"
OUTPUT="$BASE_DIR/all_data.txt"

# Clear output file
> "$OUTPUT"

#################################
# 1. Tree hierarchy at the top
#################################
echo "===== PROJECT TREE =====" >> "$OUTPUT"
tree "$BASE_DIR/src" "$BASE_DIR/app" "$BASE_DIR/components" "$BASE_DIR/tests" >> "$OUTPUT"
echo -e "\n\n" >> "$OUTPUT"

#################################
# 2. Files data from tree hierarchy
#################################
echo "===== FILE DATA FROM TREE HIERARCHY =====" >> "$OUTPUT"
find "$BASE_DIR/src" "$BASE_DIR/app" "$BASE_DIR/components" "$BASE_DIR/tests" -type f | while read file; do
    relpath=$(realpath --relative-to="$BASE_DIR" "$file")
    echo "===== $relpath =====" >> "$OUTPUT"
    cat "$file" >> "$OUTPUT"
    echo -e "\n" >> "$OUTPUT"
done

#################################
# 3. Data of specific top-level files
#################################
echo -e "\n===== SELECTED TOP-LEVEL FILES =====" >> "$OUTPUT"
for file in IdTokenProvider.tsx next.config.ts playwright.config.ts tsconfig.json firebaseConfig.js package.json; do
    filepath="$BASE_DIR/$file"
    if [ -f "$filepath" ]; then
        echo "===== $file =====" >> "$OUTPUT"
        cat "$filepath" >> "$OUTPUT"
        echo -e "\n" >> "$OUTPUT"
    else
        echo ">>> $file not found <<<" >> "$OUTPUT"
    fi
done

echo "✅ Done! Output written to $OUTPUT"

