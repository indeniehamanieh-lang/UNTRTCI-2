#!/usr/bin/env bash
# Génère les icônes Android à partir de mobile/assets/icon.png (1024x1024 conseillé),
# sinon à partir de public/icon-512.png.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="assets/icon.png"
[ -f "$SRC" ] || SRC="../public/icon-512.png"
echo "Icône source : $SRC"
RES="android/app/src/main/res"
declare -A LEGACY=( [mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192 )
declare -A FG=( [mdpi]=108 [hdpi]=162 [xhdpi]=216 [xxhdpi]=324 [xxxhdpi]=432 )
for d in "${!LEGACY[@]}"; do
  L=${LEGACY[$d]}; F=${FG[$d]}; S=$(( F * 60 / 100 ))
  convert "$SRC" -background white -alpha remove -resize "${L}x${L}" +repage "$RES/mipmap-$d/ic_launcher.png"
  convert "$SRC" -background white -alpha remove -resize "${L}x${L}" +repage "$RES/mipmap-$d/ic_launcher_round.png"
  # Premier plan adaptatif : logo à 60 % au centre (zone sûre d'Android)
  convert "$SRC" -background white -alpha remove -resize "${S}x${S}" +repage \
    -background none -gravity center -extent "${F}x${F}" "$RES/mipmap-$d/ic_launcher_foreground.png"
done
echo "Icônes générées."
