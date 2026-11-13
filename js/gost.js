/* Условные графические обозначения и позиционные обозначения по ЕСКД (ГОСТ 2.710-81, 2.721-74, 2.728-74, 2.730-73, 2.759-82).
   Для символов, которые в KiCad уже нарисованы так же (резистор, конденсатор, диод, светодиод, трансформатор,
   предохранитель), меняются только буквенные обозначения. Выводы остаются на прежних местах, поэтому
   соединения и проверка не зависят от выбранной системы обозначений. */
(function () {
  'use strict';
  const G = (window.Gost = {});
  const pinEnd = (p) => { const r = (p.r * Math.PI) / 180; return { x: p.x + Math.cos(r) * p.l, y: p.y - Math.sin(r) * p.l, dx: Math.cos(r), dy: -Math.sin(r) }; };
  const P = (...a) => a.join(' ');

  /* Возвращает {g, pins} для символа (g — графика, pins — выводы с подправленной длиной) или null, если УГО совпадает. */
  G.symbol = function (lib, L) {
    const l = lib.toLowerCase(), g = L.g, pins = L.pins;
    // электролитический (оксидный) конденсатор: положительная обкладка — линия со знаком «+», отрицательная — узкий прямоугольник
    if (/c_polarized|polarized/.test(l) && pins.length === 2 && g.length === 4) {
      return { g: [
        { t: 'path', d: 'M-2.286 -0.762 L2.286 -0.762', fill: 'none' }, { t: 'path', d: 'M0 -1.016 L0 -0.762', fill: 'none' }, g[1], g[2],
        { t: 'path', d: 'M2.286 0.508 L-2.286 0.508 L-2.286 1.016 L2.286 1.016 Z', fill: 'none' }] };
    }
    // биполярный транзистор: корпус изображается окружностью
    if (pins.length === 3 && /transistor|2n\d|bc\d|q_/.test(l) && !g.some((x) => x.t === 'circle')) {
      const base = pins.find((p) => Math.abs(Math.cos((p.r * Math.PI) / 180)) > 0.9), others = pins.filter((p) => p !== base);
      if (base && others.length === 2) {
        const b = pinEnd(base), c = pinEnd(others.reduce((a, p) => (pinEnd(p).y < pinEnd(a).y ? p : a)));
        return { g: g.concat([{ t: 'circle', cx: (b.x + c.x) / 2, cy: b.y, r: 3.6, fill: 'none' }]) };
      }
    }
    // усилитель / операционный усилитель: прямоугольник со знаком усиления, инверсный вход — с кружком
    if (/lm386|opamp|amplifier/.test(l) && pins.length >= 5) {
      const e = pins.map(pinEnd), x0 = Math.min(...e.map((q) => q.x)), x1 = Math.max(...e.map((q) => q.x)), y0 = Math.min(...e.map((q) => q.y)), y1 = Math.max(...e.map((q) => q.y));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const gg = [{ t: 'path', d: `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1} Z`, fill: 'background' },
        { t: 'path', d: `M${cx - 1.2} ${cy - 1.5} L${cx + 1.5} ${cy} L${cx - 1.2} ${cy + 1.5} Z`, fill: 'none' }];
      const np = pins.map((p) => {      // выводы, заходящие внутрь прямоугольника, укорачиваем до его границы
        const r = (p.r * Math.PI) / 180, dx = Math.cos(r), dy = -Math.sin(r); let len = p.l;
        if (Math.abs(dy) > 0.9) len = Math.abs((dy > 0 ? y0 : y1) - p.y); else if (Math.abs(dx) > 0.9) len = Math.abs((dx > 0 ? x0 : x1) - p.x);
        if (p.n === '-') { const q = pinEnd(Object.assign({}, p, { l: len })); gg.push({ t: 'circle', cx: q.x - q.dx * 0.5 + 0, cy: q.y - q.dy * 0.5, r: 0.5, fill: 'none' }); len -= 0.5 + 0.5; len = Math.max(len, 0.5); }
        return Object.assign({}, p, { l: len });
      });
      return { g: gg, pins: np, hn: true };
    }
    // клеммная колодка: контакты-кружки, соединённые штриховой линией (механическая связь)
    if (/screw_terminal|terminalblock/.test(l) && pins.length >= 2) {
      const ys = pins.map((p) => p.y), gg = [];
      pins.forEach((p) => gg.push({ t: 'circle', cx: 0, cy: p.y, r: 0.64, fill: 'none' }));
      gg.push({ t: 'path', d: `M0 ${Math.min(...ys) + 0.64} L0 ${Math.max(...ys) - 0.64}`, fill: 'none', dash: '0.5 0.4' });
      return { g: gg, pins: pins.map((p) => Object.assign({}, p, { l: Math.abs(p.x) - 0.64 })) };
    }
    // подстроечный резистор: подвижный контакт со стрелкой + знак подстройки
    if (/r_potentiometer_trim/.test(l) && g.length === 3) {
      return { g: [g[0], { t: 'path', d: 'M2.54 0 L1.016 0', fill: 'none' }, { t: 'path', d: 'M1.016 0 L1.75 -0.55 M1.016 0 L1.75 0.55', fill: 'none' }, { t: 'path', d: 'M2.15 -0.7 L2.15 0.7', fill: 'none' }] };
    }
    return null;
  };

  /* ---------- позиционные обозначения (ГОСТ 2.710-81) ---------- */
  function prefix(ref, lib) {
    const l = lib.toLowerCase(), p = ((ref.match(/^([A-Za-z]+)\d+$/) || [])[1] || '').toUpperCase();
    if (/screw_terminal|terminalblock/.test(l)) return 'XT';
    if (/pj-?322|jack|barrel/.test(l)) return 'XS';
    if (/heatsink/.test(l)) return 'EK';
    if (p === 'RV' || /potentiometer/.test(l)) return 'RP';
    if (p === 'D') return /led/.test(l) ? 'HL' : 'VD';
    const m = { R: 'R', C: 'C', CP: 'C', Q: 'VT', U: 'DA', T: 'T', F: 'FU', L: 'L', S: 'SA', SW: 'SA', K: 'K', Y: 'ZQ', BZ: 'HA', LS: 'BA', BT: 'GB', J: 'X', P: 'X' };
    return m[p] || p || 'A';
  }
  /* Номера сохраняются, как на плате (D4 → VD4), чтобы связь с шелкографией оставалась очевидной. */
  G.refMap = function (D) {
    const map = {}, used = {};
    const real = D.insts.filter((i) => !i.power);
    real.forEach((i) => { const pre = prefix(i.id, i.lib), m = i.id.match(/^[A-Za-z]+(\d+)$/); if (m) { map[i.id] = pre + m[1]; (used[pre] = used[pre] || new Set()).add(m[1]); } });
    real.forEach((i) => { if (map[i.id]) return; const pre = prefix(i.id, i.lib); used[pre] = used[pre] || new Set(); let n = 1; while (used[pre].has(String(n))) n++; used[pre].add(String(n)); map[i.id] = pre + n; });
    return map;
  };
})();
