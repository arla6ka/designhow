#!/usr/bin/env bash
# triage.sh [repo] [out-dir]
# Read-only. Prints one "signal<TAB>value" line per check and writes the same lines to
# <out-dir>/signals.tsv, with raw match lists beside it. Needs ripgrep (rg). Reads only
# files git does not ignore, so node_modules and build output stay out.
set -uo pipefail
exec </dev/null   # rg with no path reads stdin; close it so no call can hang

REPO=${1:-.}
OUT=${2:-$REPO/.design-system/boss/triage}
command -v rg >/dev/null || { echo "triage.sh needs ripgrep (rg). Install it or run the commands in references/triage.md by hand." >&2; exit 2; }
cd "$REPO" || exit 2
mkdir -p "$OUT"
: > "$OUT/signals.tsv"

EXCL=(-g '!.design-system/**' -g '!.migration/**' -g '!**/*.min.*' -g '!**/*.svg' -g '!**/*.lock' -g '!package-lock.json')
SRC=(-g '*.{css,scss,sass,less,ts,tsx,js,jsx,vue,svelte,astro,html,mdx}')

put() { printf '%s\t%s\n' "$1" "$2" | tee -a "$OUT/signals.tsv"; }
count() { rg "$@" . </dev/null 2>/dev/null | wc -l | tr -d ' '; }

# Stack
fw=none
if [ -f package.json ]; then
  for f in next nuxt @remix-run/react @sveltejs/kit astro vite react vue svelte; do
    if rg -q "\"$f\"\s*:" package.json; then fw=$f; break; fi
  done
fi
put framework "$fw"
tw=$(rg -o --no-filename '"tailwindcss"\s*:\s*"[^"]*"' package.json 2>/dev/null | sed 's/.*: *//;s/"//g' | head -1)
put tailwind "${tw:-none}"
run=$(rg -o --no-filename '"(dev|start)"\s*:\s*"[^"]*"' package.json 2>/dev/null | head -1)
put run_script "${run:-none}"

# Routes a user can reach
routes=$(rg --files "${EXCL[@]}" -g '**/app/**/page.{tsx,jsx,ts,js,mdx}' -g '**/pages/**/*.{tsx,jsx,vue}' -g '**/routes/**/+page.svelte' -g '!**/pages/_*' -g '!**/pages/api/**' 2>/dev/null | tee "$OUT/routes.txt" | wc -l | tr -d ' ')
put routes "$routes"

# Token sources
rg --files "${EXCL[@]}" -g '*.tokens.json' -g '**/tokens/**/*.json' -g 'tokens.json' -g '**/design-tokens.*' -g 'tailwind.config.*' 2>/dev/null > "$OUT/token-files.txt"
rg -l "${EXCL[@]}" -g '*.{css,scss}' '@theme\b' 2>/dev/null >> "$OUT/token-files.txt"
put token_files "$(sort -u "$OUT/token-files.txt" | wc -l | tr -d ' ')"
put custom_property_defs "$(count -n --no-heading -o "${EXCL[@]}" -g '*.{css,scss}' -e '(^|[{;[:space:]])--[a-zA-Z][a-zA-Z0-9-]*\s*:')"
put token_refs "$(count -n --no-heading -o "${EXCL[@]}" "${SRC[@]}" -e 'var\(--[a-zA-Z][a-zA-Z0-9-]*' -e 'theme\(')"

# Raw values outside token definition lines
# A line that defines a custom property is a token definition, not a raw use, so it is dropped.
rg -n --no-heading "${EXCL[@]}" "${SRC[@]}" \
  -e '#[0-9a-fA-F]{3,8}\b' -e '\b(rgba?|hsla?|oklch|oklab|hwb)\(' . 2>/dev/null \
  | rg -v '^[^:]*:[0-9]+:.*(^|[{;:[:space:]])--[a-zA-Z][a-zA-Z0-9-]*\s*:' > "$OUT/raw-colors.txt"
put raw_color_lines "$(wc -l < "$OUT/raw-colors.txt" | tr -d ' ')"
rg -n --no-heading -o "${EXCL[@]}" -g '*.{tsx,jsx,vue,svelte,astro,html}' -e '\b[a-z-]+-\[[^\]]+\]' . 2>/dev/null > "$OUT/tw-arbitrary.txt"
put tw_arbitrary "$(wc -l < "$OUT/tw-arbitrary.txt" | tr -d ' ')"
rg -n --no-heading -o "${EXCL[@]}" -g '*.{tsx,jsx,vue,svelte,astro,html}' \
  -e '\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|sky|blue|indigo|violet|purple|pink|rose)-[0-9]{2,3}\b' . 2>/dev/null > "$OUT/tw-palette.txt"
put tw_palette "$(wc -l < "$OUT/tw-palette.txt" | tr -d ' ')"
rg -n --no-heading "${EXCL[@]}" -g '*.{tsx,jsx}' -e 'style=\{\{' . 2>/dev/null > "$OUT/inline-styles.txt"
put inline_styles "$(wc -l < "$OUT/inline-styles.txt" | tr -d ' ')"

# Component definitions, folders and families
rg --no-heading -n -o "${EXCL[@]}" -g '*.{tsx,jsx}' -g '!**/*.{test,spec,stories}.*' \
  -e 'export (default )?(function|const|class) [A-Z][A-Za-z0-9]*' . 2>/dev/null \
  | sed -E 's/^([^:]*):[0-9]+:export (default )?(function|const|class) /\1\t/' > "$OUT/components.tsv"
put component_defs "$(wc -l < "$OUT/components.tsv" | tr -d ' ')"
dirs=$(find . \( -name node_modules -o -name .git \) -prune -o -type d \( -path '*/components/ui' -o -path '*/packages/ui' -o -name 'design-system' -o -name 'ui-kit' \) -print 2>/dev/null | tr '\n' ' ')
put shared_ui_dirs "${dirs:-none}"
names=$(cut -f2 "$OUT/components.tsv")
put same_name_defs "$(printf '%s\n' "$names" | sort | uniq -d | wc -l | tr -d ' ')"
: > "$OUT/families.tsv"
for fam in 'Button' 'Input|TextField|Field' 'Select|Dropdown|Combobox' 'Dialog|Modal|Drawer|Sheet' 'Card' 'Badge|Tag|Chip|Pill' 'Toast|Snackbar|Notification' 'Tooltip|Popover' 'Tabs?' 'Link'; do
  n=$(printf '%s\n' "$names" | rg -c "($fam)\$" 2>/dev/null || true)
  printf '%s\t%s\n' "$fam" "${n:-0}" >> "$OUT/families.tsv"
done
put families_with_2plus "$(awk -F'\t' '$2>1' "$OUT/families.tsv" | wc -l | tr -d ' ')"

# Docs and agent-readable surfaces
put storybook "$( [ -d .storybook ] && echo yes || echo no )"
put stories "$(rg --files "${EXCL[@]}" -g '*.stories.*' 2>/dev/null | wc -l | tr -d ' ')"
put llms_txt "$(rg --files "${EXCL[@]}" -g '**/llms.txt' -g '**/llms.txt/**' 2>/dev/null | head -1 | grep -q . && echo yes || echo no)"
put registry_json "$(rg --files "${EXCL[@]}" -g '**/registry.json' 2>/dev/null | head -1 | grep -q . && echo yes || echo no)"
put system_docs_routes "$(rg --files "${EXCL[@]}" -g '**/app/system/**' -g '**/app/design-system/**' -g '**/pages/system/**' 2>/dev/null | wc -l | tr -d ' ')"

# Earlier runs
put build_record "$( [ -f .design-system/run.md ] && echo .design-system/run.md || echo none )"
put migration_runs "$(ls -d .migration/*/ 2>/dev/null | tr '\n' ' ' | sed 's/ $//' | grep . || echo none)"
put boss_state "$( [ -f .design-system/boss/state.md ] && echo .design-system/boss/state.md || echo none )"

# Working tree
if git rev-parse --git-dir >/dev/null 2>&1; then
  put git_branch "$(git symbolic-ref --short -q HEAD || git rev-parse --short HEAD 2>/dev/null || echo detached)"
  put git_uncommitted "$(git status --porcelain | wc -l | tr -d ' ')"
else
  put git_branch none
fi

# Adoption: token references as a share of token references plus raw colors and arbitrary values
awk -F'\t' '{v[$1]=$2} END {
  raw=v["raw_color_lines"]+v["tw_arbitrary"]+v["tw_palette"]; t=v["token_refs"];
  if (t+raw==0) print "adoption_pct\tn/a"; else printf "adoption_pct\t%d\n", 100*t/(t+raw) }' "$OUT/signals.tsv" \
  | tee -a "$OUT/signals.tsv"
