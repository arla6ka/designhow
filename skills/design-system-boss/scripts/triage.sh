#!/usr/bin/env bash
# triage.sh [repo] [out-dir]
# Read-only. Prints one "signal<TAB>value" line per check and writes the same lines to
# <out-dir>/signals.tsv, with raw match lists beside it. Needs ripgrep (rg). Reads only
# files git does not ignore, so node_modules and build output stay out.
# Set TRIAGE_SHADCN_INFO=0 to skip `shadcn info --json` (it runs only from node_modules/.bin,
# or through npx when TRIAGE_SHADCN_INFO=npx, since npx may download).
# Two units. A *_lines signal counts source lines, so a line with three hex values counts once.
# The occurrence signals (token_refs, tw_semantic, tw_arbitrary, tw_palette, raw_color_occurrences)
# count each match. token-mapping counts occurrences, so compare it with raw_color_occurrences.
set -uo pipefail
exec </dev/null   # rg with no path reads stdin; close it so no call can hang
case "${1:-}" in -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0;; esac

REPO=${1:-.}
OUT=${2:-$REPO/.design-system/boss/triage}
command -v rg >/dev/null || { echo "triage.sh needs ripgrep (rg). Install it or run the commands in references/triage.md by hand." >&2; exit 2; }
cd "$REPO" || exit 2
mkdir -p "$OUT"
: > "$OUT/signals.tsv"

# Scaffolding is never the app, and is left out of every count: run folders, skill folders (any
# folder holding a SKILL.md), check scripts and their fixtures (`scripts/`, `fixtures/`, `*.fixture`),
# and generated twins and indexes (`public/system/`, `static/system/`). Presence checks such as
# llms_txt still read public/llms.txt.
EXCL=(-g '!**/.design-system/**' -g '!**/.migration/**' -g '!**/.agents/**' -g '!**/.claude/**'
  -g '!**/scripts/**' -g '!**/fixtures/**' -g '!**/__fixtures__/**' -g '!**/*.fixture' -g '!**/*.fixture.*'
  -g '!**/public/system/**' -g '!**/static/system/**'
  -g '!**/*.min.*' -g '!**/*.svg' -g '!**/*.lock' -g '!package-lock.json')
SKILLDIRS=$(rg --files --hidden -g '**/SKILL.md' -g '!**/node_modules/**' -g '!.git/**' . 2>/dev/null | sed 's#^\./##' | xargs -n1 dirname 2>/dev/null | sort -u)
while read -r d; do [ -n "$d" ] && [ "$d" != . ] && EXCL+=(-g "!$d/**"); done <<< "$SKILLDIRS"
SRC=(-g '*.{css,scss,sass,less,ts,tsx,js,jsx,vue,svelte,astro,html,mdx}')
MARKUP=(-g '*.{tsx,jsx,vue,svelte,astro,html}')
# Not product components: check fixtures, examples, docs, generated twins and check folders.
NONPROD=(-g '!**/fixtures/**' -g '!**/__fixtures__/**' -g '!**/*.examples/**' -g '!**/examples/**' -g '!docs/**' -g '!**/app/system/**' -g '!**/app/design-system/**' -g '!**/public/system/**' -g '!**/static/system/**' -g '!**/checks/**' -g '!**/__checks__/**')
# Raw colors. No \b before a function name or after a hex, so Tailwind arbitrary values such as
# shadow-[0_1px_rgba(0,0,0,.1)] and ring-[0_0_0_1px_#e5e5e5_inset] still match.
# Component families, matched on name suffix
FAMS=('Button' 'Input|TextField|Field' 'Select|Dropdown|Combobox' 'Dialog|Modal|Drawer|Sheet' 'Card' 'Badge|Tag|Chip|Pill' 'Toast|Snackbar|Notification' 'Tooltip|Popover' 'Tabs?' 'Link')
RAWHEX='#[0-9a-fA-F]{3,8}([^0-9A-Za-z-]|$)'
RAWFN='(^|[^A-Za-z0-9-])(rgba?|hsla?|oklch|oklab|hwb)\('

put() { printf '%s\t%s\n' "$1" "$2" | tee -a "$OUT/signals.tsv"; }
count() { rg "$@" . </dev/null 2>/dev/null | wc -l | tr -d ' '; }
# json <file> <dotted.path>: prints a value from a JSON file, or nothing
json() { node -e 'try{let v=require(require("path").resolve(process.argv[1]));for(const k of process.argv[2].split("."))v=v?.[k];if(v!==undefined)console.log(typeof v==="object"?JSON.stringify(v):v)}catch{}' "$1" "$2" 2>/dev/null; }
has_dep() { [ -f package.json ] && rg -q "\"$1\"\s*:" package.json; }

# Stack
fw=none
if [ -f package.json ]; then
  for f in next nuxt @remix-run/react @sveltejs/kit astro vite react vue svelte; do
    if has_dep "$f"; then fw=$f; break; fi
  done
fi
put framework "$fw"
tw=$(rg -o --no-filename '"tailwindcss"\s*:\s*"[^"]*"' package.json 2>/dev/null | sed 's/.*: *//;s/"//g' | head -1)
put tailwind "${tw:-none}"
run=$(rg -o --no-filename '"(dev|start)"\s*:\s*"[^"]*"' package.json 2>/dev/null | head -1)
put run_script "${run:-none}"

# Foundation: shadcn (components.json), a package library, the team's own package, or raw
UI_DIR=""; TW_CSS=""; shadcn=no
if [ -f components.json ]; then
  shadcn=yes
  if [ "${TRIAGE_SHADCN_INFO:-1}" != 0 ]; then
    if [ -x node_modules/.bin/shadcn ]; then node_modules/.bin/shadcn info --json > "$OUT/shadcn-info.json" 2>/dev/null
    elif [ "${TRIAGE_SHADCN_INFO:-1}" = npx ]; then npx -y shadcn@latest info --json > "$OUT/shadcn-info.json" 2>/dev/null
    fi
  fi
  [ -s "$OUT/shadcn-info.json" ] || rm -f "$OUT/shadcn-info.json"
  if [ -f "$OUT/shadcn-info.json" ]; then
    put shadcn_info "$OUT/shadcn-info.json"
    base=$(json "$OUT/shadcn-info.json" config.base); style=$(json "$OUT/shadcn-info.json" config.style)
    TW_CSS=$(json "$OUT/shadcn-info.json" project.tailwindCss)
    UI_DIR=$(json "$OUT/shadcn-info.json" config.resolvedPaths.ui | sed "s#^$PWD/##")
  else
    put shadcn_info "not run (skipped, or no local shadcn binary; TRIAGE_SHADCN_INFO=npx allows npx)"
    style=$(json components.json style); TW_CSS=$(json components.json tailwind.css)
    base=$(printf '%s' "$style" | sed -nE 's/^(base|radix)-.*/\1/p')
  fi
  if [ -z "$UI_DIR" ]; then
    ui_alias=$(json components.json aliases.ui); [ -n "$ui_alias" ] || ui_alias="$(json components.json aliases.components)/ui"
    UI_DIR=$(printf '%s' "$ui_alias" | sed -E 's#^[@~]/##')
    [ -d "$UI_DIR" ] || { [ -d "src/$UI_DIR" ] && UI_DIR="src/$UI_DIR"; }
  fi
  put shadcn_base "${base:-unknown}"
  put shadcn_style "${style:-unknown}"
  put tailwind_css_file "${TW_CSS:-unknown}"
  put shadcn_ui_dir "${UI_DIR:-unknown}"
  regs=$(json components.json registries | rg -o '"@[a-zA-Z0-9_-]+"' | tr -d '"' | rg -v '^@shadcn$' | tr '\n' ' ' | sed 's/ $//')
  put shadcn_registries "${regs:-none}"
fi
lib=none
for l in @mui/material @chakra-ui/react @mantine/core antd @radix-ui/themes react-aria-components @headlessui/react @ark-ui/react primereact vuetify @nuxt/ui; do
  if has_dep "$l"; then lib=$l; break; fi
done
put ui_library "$lib"
own=$(rg -o --no-filename '"@[a-z0-9-]+/(ui|design-system|components|ds)"\s*:' package.json 2>/dev/null | sed 's/"//g;s/ *://' | head -1)
[ -z "$own" ] && [ -f packages/ui/package.json ] && own=$(json packages/ui/package.json name)
put own_package "${own:-none}"
foundation=raw
if [ "$shadcn" = yes ]; then foundation=shadcn; [ "${regs:-none}" != none ] && foundation=shadcn+registry
elif [ "$lib" != none ]; then foundation="library:$lib"
elif [ -n "$own" ]; then foundation="package:$own"; fi
# An empty app (2 or fewer routes, 5 or fewer product components) has no foundation yet. Printed
# once product_component_defs is known, as "none (default: shadcn)", the Seed route's default.

# Routes a user can reach. Next.js private folders (app/**/_name) are not routes.
routes=$(rg --files -g '**/app/**/page.{tsx,jsx,ts,js,mdx}' -g '**/pages/**/*.{tsx,jsx,vue}' -g '**/routes/**/+page.svelte' -g '!**/pages/_*' -g '!**/pages/api/**' -g '!**/app/**/_*/**' "${EXCL[@]}" 2>/dev/null | tee "$OUT/routes.txt" | wc -l | tr -d ' ')
put routes "$routes"
# Size, for the budget: lines in source files git tracks or would track
put source_lines "$(rg -c '' "${SRC[@]}" "${EXCL[@]}" . 2>/dev/null | awk -F: '{n+=$NF} END {print n+0}')"
# How much scaffolding the counts skipped, so a before/after reader can see it was left out
all_src=$(rg --files --hidden "${SRC[@]}" -g '!**/node_modules/**' -g '!.git/**' . 2>/dev/null | wc -l | tr -d ' ')
prod_src=$(rg --files "${SRC[@]}" "${EXCL[@]}" . 2>/dev/null | wc -l | tr -d ' ')
put scaffold_files_skipped "$(( all_src - prod_src ))"

# Component definitions: exported inline, or declared and then listed in an export { } block
rg -l -g '*.{tsx,jsx}' -g '!**/*.{test,spec,stories}.*' "${EXCL[@]}" "${NONPROD[@]}" -e '^\s*(export\s+)?(default\s+)?(function|const|class)\s+[A-Z]' . 2>/dev/null \
  | while read -r f; do
      perl -0777 -ne '
        my %ex; while (/export\s*\{([^}]*)\}/g) { $ex{$_}=1 for ($1 =~ /\b([A-Z][A-Za-z0-9]*)\b/g) }
        while (/^[ \t]*(export[ \t]+)?(default[ \t]+)?(?:async[ \t]+)?(?:function|const|class)[ \t]+([A-Z][A-Za-z0-9]*)/mg) {
          print "$ARGV\t$3\n" if $1 || $ex{$3} }' "$f"
    done | sed 's#^\./##' | sort -u > "$OUT/components.tsv"
put component_defs "$(wc -l < "$OUT/components.tsv" | tr -d ' ')"
# The component layer: folders by name, folders a barrel (index.ts) re-exports 3+ components from,
# and folders outside the route tree holding components that 3 or more route files import. Reasons go to layer-dirs.tsv.
: > "$OUT/layer-dirs.tsv"; : > "$OUT/harden-dirs.tsv"
find . \( -name node_modules -o -name .git -o -name .agents -o -name .claude -o -name .design-system -o -name .migration -o -name scripts -o -name fixtures -o -name __fixtures__ -o -path '*/public/system' -o -path '*/static/system' \) -prune -o -type d \( -path '*/components/ui' -o -path '*/packages/ui' -o -path './ui' -o -path './src/ui' -o -path './src/components' -o -path './packages/*/src' -o -name 'design-system' -o -name 'ui-kit' \) -print 2>/dev/null \
  | sed 's#^\./##' | awk '{print $0 "\tname"}' >> "$OUT/layer-dirs.tsv"
rg --files -g '**/index.{ts,tsx,js,jsx}' "${EXCL[@]}" "${NONPROD[@]}" 2>/dev/null | while read -r f; do
  n=$(rg -c "^\s*export\s+(\{[^}]*\b[A-Z]|\*|default\s+[A-Z]).*from\s+['\"]\./" "$f" 2>/dev/null || echo 0)
  [ "${n:-0}" -ge 3 ] && printf '%s\tbarrel %s exports\n' "$(dirname "$f" | sed 's#^\./##')" "$n"
done >> "$OUT/layer-dirs.tsv"
if command -v node >/dev/null; then
  node -e '
    const fs=require("fs"),path=require("path");
    const [routes,comps]=process.argv.slice(1,3).map(f=>fs.readFileSync(f,"utf8").split("\n").filter(Boolean));
    const compDirs=new Set(comps.map(l=>path.dirname(l.split("\t")[0])));
    const isDir=p=>{try{return fs.statSync(p).isDirectory()}catch{return false}};
    const isFile=p=>{try{return fs.statSync(p).isFile()}catch{return false}};
    const exts=["",".tsx",".ts",".jsx",".js",".vue",".svelte"];
    const hits=new Map();
    for (const r of routes) {
      let src; try{src=fs.readFileSync(r,"utf8")}catch{continue}
      const seen=new Set();
      for (const m of src.matchAll(/(?:from|import)\s*[\x27"]([^\x27"]+)[\x27"]/g)) {
        const s=m[1]; let bases=[];
        if (s.startsWith(".")) bases=[path.join(path.dirname(r),s)];
        else { const a=s.match(/^[@~#]\/(.*)$/); if (!a) continue; bases=["src/"+a[1],a[1]]; }
        for (const b of bases) {
          let dir=null;
          if (isDir(b)) dir=b; else if (exts.some(e=>isFile(b+e))) dir=path.dirname(b);
          if (dir) { dir=path.normalize(dir); if (compDirs.has(dir)) seen.add(dir); break; }
        }
      }
      for (const d of seen) hits.set(d,(hits.get(d)||0)+1);
    }
    const routeTree=/^(src\/)?(app|pages|routes)(\/|$)/;   // route-local _components folders are not the layer
    const nComp=d=>new Set(comps.filter(l=>path.dirname(l.split("\t")[0])===d).map(l=>l.split("\t")[1])).size;
    for (const [d,n] of hits) if (n>=3 && !routeTree.test(d)) {
      console.log(d+"\timported by "+n+" routes");
      // Harden needs a layer worth hardening: 5 or more components that 3 or more routes import.
      if (nComp(d)>=5) fs.appendFileSync(process.argv[3],d+"\t"+nComp(d)+" components, imported by "+n+" routes\n");
    }
  ' "$OUT/routes.txt" "$OUT/components.tsv" "$OUT/harden-dirs.tsv" >> "$OUT/layer-dirs.tsv" 2>/dev/null
fi
LAYER=$(cut -f1 "$OUT/layer-dirs.tsv" | sort -u)
[ -n "$UI_DIR" ] && [ "$UI_DIR" != unknown ] && LAYER=$(printf '%s\n%s\n' "$LAYER" "$UI_DIR" | sed '/^$/d' | sort -u)
# A stray is a layer folder, not itself a harden dir or the shadcn ui folder, holding a family the
# harden dir already has (components/custom/Button beside components/ui/button). It is a duplicate,
# not the layer, so it leaves the layer and its raw values count as product code.
HARD=$(cut -f1 "$OUT/harden-dirs.tsv" | sort -u)
: > "$OUT/stray-dirs.tsv"
if [ -n "$HARD" ]; then
  while read -r d; do
    [ -z "$d" ] || [ "$d" = "$UI_DIR" ] || printf '%s\n' "$HARD" | grep -qxF "$d" && continue
    awk -F'\t' -v d="$d" -v hard="$HARD" -v fams="$(IFS=';'; echo "${FAMS[*]}")" '
      BEGIN { nf=split(fams, fam, ";"); nh=split(hard, h, "\n"); for (i=1;i<=nh;i++) hs[h[i]]=1 }
      { p=$1; if (p !~ /\//) next; sub(/\/[^\/]*$/, "", p)
        for (i=1;i<=nf;i++) if ($2 ~ "(" fam[i] ")$") { if (p==d) mine[i]=$2; if ((p in hs) && (!(i in tn) || length($2) < length(tn[i]))) { tn[i]=$2; theirs[i]=$2 " in " p } } }
      END { for (i=1;i<=nf;i++) if ((i in mine) && (i in theirs)) { print d "\t" mine[i] " duplicates " theirs[i]; exit } }
    ' "$OUT/components.tsv"
  done <<< "$LAYER" >> "$OUT/stray-dirs.tsv"
fi
STRAY=$(cut -f1 "$OUT/stray-dirs.tsv" | sort -u)
[ -n "$STRAY" ] && LAYER=$(printf '%s\n' "$LAYER" | grep -vxF -f <(printf '%s\n' "$STRAY"))
put stray_dirs "$(printf '%s' "$STRAY" | tr '\n' ' ' | sed 's/ $//' | grep . || echo none)"
put shared_ui_dirs "$(printf '%s' "$LAYER" | tr '\n' ' ' | sed 's/ $//' | grep . || echo none)"
put harden_dirs "$(cut -f1 "$OUT/harden-dirs.tsv" | sort -u | tr '\n' ' ' | sed 's/ $//' | grep . || echo none)"
put same_name_defs "$(cut -f2 "$OUT/components.tsv" | sort | uniq -d | wc -l | tr -d ' ')"


# Token sources
rg --files -g '*.tokens.json' -g '**/tokens/**/*.json' -g 'tokens.json' -g '**/design-tokens.*' -g 'tailwind.config.*' "${EXCL[@]}" 2>/dev/null > "$OUT/token-files.txt"
rg -l -g '*.{css,scss}' "${EXCL[@]}" '@theme\b' 2>/dev/null >> "$OUT/token-files.txt"
put token_files "$(sort -u "$OUT/token-files.txt" | wc -l | tr -d ' ')"
# Adoption counts product files only. The system's own files (the component layer and the token
# source), examples, docs, fixtures, tests and stories are left out. Raw values inside the layer are
# counted apart, as ui_raw_lines: on shadcn they are upstream's, elsewhere they are the harden's work.
# ripgrep gives later globs precedence, so UIX always goes after the file-type globs.
UIX=(-g '!**/*.examples/**' -g '!**/examples/**' -g '!docs/**' -g '!**/app/system/**' -g '!**/app/design-system/**' -g '!**/fixtures/**' -g '!**/__fixtures__/**' -g '!**/*.{test,spec,stories}.*')
# Leave a layer folder out, but carve out any stray inside it (components/ui inside components),
# so the stray's files still count as product code.
layer_out() {
  local d=$1 s f sub inner=() hit
  for s in $STRAY; do case "$s" in "$d"/*) inner+=("$s");; esac; done
  if [ ${#inner[@]} -eq 0 ]; then UIX+=(-g "!$d/**"); return; fi
  for f in "$d"/*; do [ -f "$f" ] && UIX+=(-g "!$f"); done
  for sub in "$d"/*/; do
    sub=${sub%/}; hit=out
    for s in "${inner[@]}"; do [ "$s" = "$sub" ] && hit=stray; case "$s" in "$sub"/*) [ $hit = out ] && hit=inside;; esac; done
    case $hit in out) UIX+=(-g "!$sub/**");; inside) layer_out "$sub";; esac
  done
}
while read -r d; do [ -n "$d" ] && layer_out "$d"; done <<< "$LAYER"
while read -r f; do [ -n "$f" ] && UIX+=(-g "!$f"); done < <(sort -u "$OUT/token-files.txt")
put custom_property_defs "$(count -n --no-heading -o -g '*.{css,scss}' "${EXCL[@]}" -e '(^|[{;[:space:]])--[a-zA-Z][a-zA-Z0-9-]*\s*:')"
# A var() on a line that defines a custom property is aliasing inside the token source, not a use.
DEF='^[^:]*:[0-9]+:.*(^|[{;:[:space:]])--[a-zA-Z][a-zA-Z0-9-]*\s*:'
put token_refs "$(rg -n --no-heading "${SRC[@]}" "${EXCL[@]}" ${UIX[@]+"${UIX[@]}"} -e 'var\(--' -e 'theme\(' . 2>/dev/null | rg -v "$DEF" | rg -o 'var\(--[a-zA-Z][a-zA-Z0-9-]*|theme\(' | wc -l | tr -d ' ')"

# Tailwind utilities built from the project's own @theme color names (bg-primary, text-muted-foreground)
PAL='slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
names=$(sort -u "$OUT/token-files.txt" | rg '\.(css|scss)$' | xargs rg -o --no-filename -N '^\s*--color-([a-z0-9-]+)\s*:' -r '$1' 2>/dev/null \
  | rg -v "^($PAL)-[0-9]+$|^(white|black|transparent|current|inherit)$|-\*$" | sort -u | awk '{print length, $0}' | sort -rn | cut -d' ' -f2- | paste -sd'|' -)
if [ -n "$names" ]; then
  rg -n --no-heading -o -P "${MARKUP[@]}" -g '*.{ts,js}' "${EXCL[@]}" ${UIX[@]+"${UIX[@]}"} \
    -e "(?<![\w-])(bg|text|border(-[trblxyse])?|ring|ring-offset|outline|fill|stroke|divide|from|via|to|placeholder|caret|accent|decoration|shadow)-($names)(/[0-9]+)?(?![\w-])" . 2>/dev/null > "$OUT/tw-semantic.txt"
else : > "$OUT/tw-semantic.txt"; fi
put tw_semantic "$(wc -l < "$OUT/tw-semantic.txt" | tr -d ' ')"

# Raw values outside token definition lines
# A line that defines a custom property is a token definition, not a raw use, so it is dropped.
rg -n --no-heading "${SRC[@]}" "${EXCL[@]}" ${UIX[@]+"${UIX[@]}"} \
  -e "$RAWHEX" -e "$RAWFN" . 2>/dev/null \
  | rg -v "$DEF" > "$OUT/raw-colors.txt"
put raw_color_lines "$(wc -l < "$OUT/raw-colors.txt" | tr -d ' ')"
put raw_color_occurrences "$(cut -d: -f3- "$OUT/raw-colors.txt" | rg -o -e "$RAWHEX" -e "$RAWFN" 2>/dev/null | wc -l | tr -d ' ')"
# Arbitrary values only. A class whose bracket is followed later by ":" is a variant
# (data-[state=open]:, group-data-[size=sm]/card:), not a value.
ARB='(?<![\w-])[a-z][a-z0-9-]*-\[[^\]\s]+\](?![^\s"'"'"'`]*:)'
rg -n --no-heading -o -P "${MARKUP[@]}" "${EXCL[@]}" ${UIX[@]+"${UIX[@]}"} -e "$ARB" . 2>/dev/null > "$OUT/tw-arbitrary.txt"
put tw_arbitrary "$(wc -l < "$OUT/tw-arbitrary.txt" | tr -d ' ')"
rg -n --no-heading -o "${MARKUP[@]}" "${EXCL[@]}" ${UIX[@]+"${UIX[@]}"} \
  -e "\b(bg|text|border|ring|fill|stroke)-($PAL)-[0-9]{2,3}\b" . 2>/dev/null > "$OUT/tw-palette.txt"
put tw_palette "$(wc -l < "$OUT/tw-palette.txt" | tr -d ' ')"
rg -n --no-heading -g '*.{tsx,jsx}' "${EXCL[@]}" ${UIX[@]+"${UIX[@]}"} -e 'style=\{\{' . 2>/dev/null > "$OUT/inline-styles.txt"
put inline_styles "$(wc -l < "$OUT/inline-styles.txt" | tr -d ' ')"
LDIRS=(); while read -r d; do [ -n "$d" ] && [ -d "$d" ] && LDIRS+=("$d"); done <<< "$LAYER"
if [ ${#LDIRS[@]} -gt 0 ]; then
  SX=(); for d in $STRAY; do SX+=(-g "!$d/**"); done
  put ui_raw_lines "$(rg -n --no-heading "${SRC[@]}" "${EXCL[@]}" ${SX[@]+"${SX[@]}"} -e "$RAWHEX" -e "$RAWFN" -e "\b(bg|text|border)-($PAL)-[0-9]{2,3}\b" "${LDIRS[@]}" 2>/dev/null | rg -v "$DEF" | wc -l | tr -d ' ')"
else put ui_raw_lines 0; fi

# Families. In a shadcn app, stock files in the ui folder (dialog.tsx, sheet.tsx, drawer.tsx...)
# count as one member per family, so Dialog/AlertDialog/Sheet/Drawer is not a duplicate.
# Renamed or team-added files in the ui folder count like product code.
STOCK='accordion|alert-dialog|alert|aspect-ratio|attachment|avatar|badge|breadcrumb|bubble|button-group|button|calendar|card|carousel|chart|checkbox|collapsible|combobox|command|context-menu|dialog|direction|drawer|dropdown-menu|empty|field|form|hover-card|input-group|input-otp|input|item|kbd|label|marker|menubar|message-scroller|message|native-select|navigation-menu|pagination|popover|progress|questionnaire|radio-group|resizable|scroll-area|select|separator|sheet|sidebar|skeleton|slider|sonner|spinner|switch|table|tabs|textarea|toast|toaster|toggle-group|toggle|tooltip'
if [ "$shadcn" = yes ] && [ -n "$UI_DIR" ]; then
  awk -F'\t' -v ui="$UI_DIR/" -v stock="^($STOCK)\\.(t|j)sx$" '{ f=$1; sub(/^.*\//,"",f); print ((index($1,ui)==1 && f ~ stock) ? "stock" : "own") "\t" $2 }' "$OUT/components.tsv" > "$OUT/components-layer.tsv"
else
  awk -F'\t' '{print "own\t" $2}' "$OUT/components.tsv" > "$OUT/components-layer.tsv"
fi
put stock_ui_defs "$(rg -c '^stock' "$OUT/components-layer.tsv" 2>/dev/null || echo 0)"
pdefs=$(rg -c '^own' "$OUT/components-layer.tsv" 2>/dev/null || echo 0)
put product_component_defs "$pdefs"
[ "$foundation" = raw ] && [ "$routes" -le 2 ] && [ "$pdefs" -le 5 ] && foundation="none (default: shadcn)"
put foundation "$foundation"
# Raw copies. A native element (<button className="...">) whose static classes share 3 or more
# with the same element in another file is a family member the name suffix misses. The file
# that defines the family's component holds the canonical copy, a match target but never a
# member. RAWEL lines up with FAMS; an empty slot has no native element. Rows go to raw-families.tsv.
RAWEL='button;input|textarea;select;;;;;;;a'
RAW=$(rg --files "${MARKUP[@]}" "${EXCL[@]}" "${NONPROD[@]}" -g '!**/*.{test,spec,stories}.*' . 2>/dev/null | sed 's#^\./##' > "$OUT/.markup-files"
  command -v node >/dev/null && node -e '
    const fs=require("fs");
    const [list,comps,famS,elS,out]=process.argv.slice(1);
    const files=fs.readFileSync(list,"utf8").split("\n").filter(Boolean);
    const fams=famS.split(";"), els=elS.split(";");
    const defs=fs.readFileSync(comps,"utf8").split("\n").filter(Boolean).map(l=>l.split("\t"));
    const tagFam={}; els.forEach((e,i)=>e&&e.split("|").forEach(t=>tagFam[t]=i));
    const re=new RegExp("<("+Object.keys(tagFam).join("|")+")(?=[\\s>/])","g");
    const isCls=t=>/^[!-]?[a-z][\w:.\/\[\]()%#,-]*$/i.test(t)&&/[-:]/.test(t);
    const skip=(s,k)=>{const q=s[k];let e=k+1;while(e<s.length&&s[e]!==q){if(s[e]==="\\")e++;e++}return e};
    const strs=(s,i,j)=>{const o=[];for(let k=i;k<j;k++)if("\"\x27`".includes(s[k])){const e=skip(s,k);o.push(s.slice(k+1,e));k=e}return o};
    function classes(s,i){ // from the tag name to its closing >, the literal strings in class or className
      let d=0,at=-1,vs=-1,ve=-1;
      for(let k=i;k<s.length&&k<i+6000;k++){const c=s[k];
        if("\"\x27`".includes(c)){const e=skip(s,k);if(at>=0&&vs<0&&d===0){vs=k;ve=e+1}k=e;continue}
        if(c==="{"){if(at>=0&&vs<0&&d===0)vs=k;d++;continue}
        if(c==="}"){d--;if(d===0&&vs>=0&&ve<0)ve=k+1;continue}
        if(d===0){if(c===">")break;if(at<0&&/^\s(className|class)=/.test(s.slice(k,k+12)))at=k}}
      return vs<0||ve<0?[]:[...new Set(strs(s,vs,ve).join(" ").split(/\s+/).filter(isCls))]}
    const nodes=[];
    for(const f of files){let s;try{s=fs.readFileSync(f,"utf8")}catch{continue}
      for(const m of s.matchAll(re)){const cl=classes(s,m.index+m[0].length);if(cl.length<3)continue;
        nodes.push({f,line:s.slice(0,m.index).split("\n").length,tag:m[1],fam:tagFam[m[1]],cl:new Set(cl)})}}
    const definer=(f,i)=>defs.some(([p,n])=>p===f&&new RegExp("("+fams[i]+")$").test(n));
    const rows=[],counts=fams.map(()=>0);
    for(const n of nodes){if(definer(n.f,n.fam))continue;let best=null,bs=0;
      for(const m of nodes){if(m===n||m.fam!==n.fam||m.f===n.f)continue;let k=0;for(const c of n.cl)if(m.cl.has(c))k++;if(k>bs){bs=k;best=m}}
      if(bs>=3){counts[n.fam]++;rows.push([fams[n.fam],n.f+":"+n.line,n.tag,bs+" shared",best.f+":"+best.line].join("\t"))}}
    fs.writeFileSync(out,rows.length?rows.join("\n")+"\n":"");
    console.log(counts.join(";"));
  ' "$OUT/.markup-files" "$OUT/components.tsv" "$(IFS=';'; echo "${FAMS[*]}")" "$RAWEL" "$OUT/raw-families.tsv" 2>/dev/null)
rm -f "$OUT/.markup-files"; [ -f "$OUT/raw-families.tsv" ] || : > "$OUT/raw-families.tsv"
IFS=';' read -r -a RAWN <<< "${RAW:-}"
: > "$OUT/families.tsv"
i=0
for fam in "${FAMS[@]}"; do
  o=$(awk -F'\t' '$1=="own"{print $2}' "$OUT/components-layer.tsv" | rg -c "($fam)\$" 2>/dev/null || true)
  st=$(awk -F'\t' '$1=="stock"{print $2}' "$OUT/components-layer.tsv" | rg -c "($fam)\$" 2>/dev/null || true)
  r=${RAWN[$i]:-0}; i=$((i + 1))
  n=$(( ${o:-0} + ( ${st:-0} > 0 ? 1 : 0 ) + r ))
  echo "$fam	$n	own ${o:-0}, stock ${st:-0}, raw copies $r" >> "$OUT/families.tsv"
done
put raw_family_copies "$(wc -l < "$OUT/raw-families.tsv" | tr -d ' ')"
put families_with_2plus "$(awk -F'\t' '$2>1' "$OUT/families.tsv" | wc -l | tr -d ' ')"
put families_present "$(awk -F'\t' '$2>0' "$OUT/families.tsv" | wc -l | tr -d ' ')"

# Docs and agent-readable surfaces
put storybook "$( [ -d .storybook ] && echo yes || echo no )"
put stories "$(rg --files -g '*.stories.*' "${EXCL[@]}" 2>/dev/null | wc -l | tr -d ' ')"
put llms_txt "$(rg --files -g '**/llms.txt' -g '**/llms.txt/**' "${EXCL[@]}" 2>/dev/null | head -1 | grep -q . && echo yes || echo no)"
# registry.json kind: shadcn (items[]), designhow ({ "components": [] }) or other
reg=no
for r in $(rg --files -g '**/registry.json' "${EXCL[@]}" 2>/dev/null | head -5); do
  if rg -q '"items"\s*:' "$r"; then reg=shadcn; break
  elif rg -q '"components"\s*:' "$r"; then reg=designhow
  elif [ "$reg" = no ]; then reg=other; fi
done
put registry_json "$reg"
put system_docs_routes "$(rg --files -g '**/app/system/**' -g '**/app/design-system/**' -g '**/pages/system/**' "${EXCL[@]}" 2>/dev/null | wc -l | tr -d ' ')"
# Specs only: twins, fixtures and examples repeat a spec and would count it twice.
put component_specs "$(rg -l -g '*.md' "${EXCL[@]}" -g '!**/fixtures/**' -g '!**/__fixtures__/**' -g '!**/*.examples/**' -g '!**/public/**' -g '!**/static/**' -g '!**/checks/**' -g '!**/spec-template.md' -g '!**/*template*.md' -e '^### State precedence' 2>/dev/null | wc -l | tr -d ' ')"

# Earlier runs
put build_record "$( [ -f .design-system/run.md ] && echo .design-system/run.md || echo none )"
put migration_runs "$(ls -d .migration/*/ 2>/dev/null | tr '\n' ' ' | sed 's/ $//' | grep . || echo none)"
put boss_state "$( [ -f .design-system/boss/state.md ] && echo .design-system/boss/state.md || echo none )"

# Working tree
if git rev-parse --git-dir >/dev/null 2>&1; then
  put git_branch "$(git symbolic-ref --short -q HEAD || git rev-parse --short HEAD 2>/dev/null || echo detached)"
  # Installed skills and this run's own folders are not the team's work in progress.
  put git_uncommitted "$(git status --porcelain -- . ':(exclude).agents' ':(exclude).claude' ':(exclude).design-system' ':(exclude).migration' | wc -l | tr -d ' ')"
else
  put git_branch none
fi

# Adoption: token uses (var(), theme(), semantic Tailwind utilities) as a share of token uses plus
# raw colors and arbitrary values, in product code. Palette classes (bg-gray-500) are primitives with
# no purpose, neither raw nor semantic, so they sit outside adoption and get their own share,
# palette_pct, of token uses plus raw values plus palette classes. token-mapping counts them the same way.
awk -F'\t' '{v[$1]=$2} END {
  raw=v["raw_color_lines"]+v["tw_arbitrary"]; t=v["token_refs"]+v["tw_semantic"]; p=v["tw_palette"];
  if (t+raw==0) print "adoption_pct\tn/a"; else printf "adoption_pct\t%d\n", 100*t/(t+raw);
  if (t+raw+p==0) print "palette_pct\tn/a"; else printf "palette_pct\t%d\n", 100*p/(t+raw+p) }' "$OUT/signals.tsv" \
  | tee -a "$OUT/signals.tsv"
