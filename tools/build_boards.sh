#!/bin/bash
# Пересборка всех плат. Пути к исходникам правятся здесь. Для усилителя 3D-модель берётся из STEP автора (boards/amplifier/model.js не пересобирается).
set -e; cd "$(dirname "$0")"; OUT=../boards; LIB3D=${LIB3D:-/home/claude/lib3d}
build(){ id=$1; sch=$2; pcb=$3; title=$4; sub=$5; lvl=$6
  mkdir -p $OUT/$id
  python3 kicad_sch_to_web.py "$sch" $OUT/$id/data.js $id "$title" "$sub" $lvl > /tmp/build_$id.log
  if [ -n "$pcb" ]; then
    python3 check_sch_vs_pcb.py $OUT/$id/data.js "$pcb" | head -3
    if [ -z "$SKIP_MODEL" ]; then python3 kicad_pcb_to_model.py "$pcb" $LIB3D $OUT/$id/model.js $id | tail -1; fi   # SKIP_MODEL=1: только схема
  fi
}
build lm317 "/home/claude/cand/ik/LM317-Adjustable-PowerSupply-HEAD/pcb/ADJUSTABLE_PS_LM317/ADJUSTABLE_PS_LM317.kicad_sch" "/home/claude/cand/ik/LM317-Adjustable-PowerSupply-HEAD/pcb/ADJUSTABLE_PS_LM317/ADJUSTABLE_PS_LM317.kicad_pcb" "Регулируемый блок питания LM317" "Стабилизатор напряжения" 2
build psu5v "/home/claude/cand/nia/Basic-PCB-Projects-HEAD/project 1/5V regulated power supply shematic.kicad_sch" "/home/claude/cand/nia/Basic-PCB-Projects-HEAD/project 1/5V regulated power supply pcbdesign.kicad_pcb" "Блок питания 5 В" "Трансформатор, выпрямитель, стабилизатор" 2
build astable "/home/claude/cand/nia/Basic-PCB-Projects-HEAD/project 3/astable vibrator(B).kicad_sch" "/home/claude/cand/nia/Basic-PCB-Projects-HEAD/project 3/astable vibrator(B).kicad_pcb" "Мультивибратор" "Два транзистора и мигающие светодиоды" 1
build amplifier "${AMP_SCH:-/mnt/user-data/uploads/simple_audio_amplifier.kicad_sch}" "" "Усилитель на LM386" "Звуковой усилитель, регуляторы громкости и тембра" 3
# список плат для меню (по возрастанию числа деталей)
python3 - <<'PY'
import json, glob
L = [json.load(open(f, encoding='utf8')) for f in glob.glob('../boards/*/data.js.info.json')]
L.sort(key=lambda x: (x['parts'], x['level']))
open('../boards/boards.js', 'w', encoding='utf8').write('window.BOARD_LIST=' + json.dumps(L, ensure_ascii=False, indent=1) + ';\n')
for f in glob.glob('../boards/*/data.js.info.json'): __import__('os').remove(f)
print([(b['id'], b['parts']) for b in L])
PY
