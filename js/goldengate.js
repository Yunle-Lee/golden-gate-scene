/*
 * GoldenGateScene — vanilla JS port of the ObsidianUI 404 scene.
 * Fetches golden-gate/north-tower.svg, clones it into a layer stack, then
 * animates isometric traffic, boats, fog and gulls with pointer interaction.
 */
(function () {
  'use strict';

  var SCENE_URL = '/golden-gate/north-tower.svg';

  var DATA = {
    projection: { origin: [515.6929751810054, 317.6987222756589], scale: 0.779011436240911, azimuth: 38, elevation: 30 },
    deckZ: 39.85,
    tunnelX: 500,
    mph: 0.1609344,
    laneY: [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5],
    vehicles: { sedan: { length: 8.6 }, suv: { length: 9.4 }, pickup: { length: 10.4 }, van: { length: 10.6 }, box: { length: 15.5 }, semi: { length: 24 }, bus: { length: 20 }, tanker: { length: 23 } },
    fog: [
      { x: -130.1105109739369, y: 199.34516460905348, z: 31.05184327846365, len: 109.2391975308642, speed: 6.266396604938271, phase: 6.043153978052127, wave: 2.360588134430727 },
      { x: -205.5920781893004, y: 105.28849451303154, z: 38.36268861454047, len: 104.40162037037038, speed: 6.5827760631001375, phase: 3.085701474622771, wave: 2.0848765432098766 },
      { x: 178.92635459533608, y: 11.23182441700962, z: 45.67353395061728, len: 99.56404320987652, speed: 6.899155521262003, phase: 0.12824897119341563, wave: 1.809164951989026 },
      { x: 103.44478737997258, y: -82.82484567901236, z: 18.9843792866941, len: 94.72646604938272, speed: 7.215534979423868, phase: 3.4507964677640603, wave: 1.5334533607681755 },
      { x: 27.963220164609083, y: -176.8815157750343, z: 26.295224622770917, len: 89.88888888888889, speed: 7.531914437585733, phase: 0.49334396433470507, wave: 3.257741769547325 },
      { x: -47.51834705075447, y: 189.06181412894375, z: 33.60606995884773, len: 85.05131172839506, speed: 7.8482938957476, phase: 3.8158914609053496, wave: 2.9820301783264744 },
      { x: -122.99991426611795, y: 95.0051440329218, z: 40.91691529492456, len: 80.21373456790124, speed: 8.164673353909464, phase: 0.8584389574759944, wave: 2.706318587105624 },
      { x: -198.48148148148147, y: 0.9484739368998588, z: 48.227760631001374, len: 75.3761574074074, speed: 8.481052812071331, phase: 4.180986454046639, wave: 2.430606995884774 },
      { x: 186.03695130315495, y: -93.10819615912207, z: 21.53860596707819, len: 70.53858024691358, speed: 8.797432270233196, phase: 1.223533950617284, wave: 2.154895404663923 },
      { x: 110.55538408779148, y: -187.16486625514403, z: 28.849451303155007, len: 65.70100308641975, speed: 9.113811728395062, phase: 4.5460814471879285, wave: 1.8791838134430727 },
      { x: 35.07381687242798, y: 178.77846364883402, z: 36.16029663923183, len: 60.86342592592592, speed: 9.430191186556929, phase: 1.5886289437585737, wave: 1.6034722222222222 },
      { x: -40.40775034293554, y: 84.72179355281207, z: 43.47114197530864, len: 56.0258487654321, speed: 9.746570644718792, phase: 4.911176440329219, wave: 3.3277606310013716 },
      { x: -115.88931755829904, y: -9.334876543209871, z: 50.781987311385464, len: 51.18827160493827, speed: 5.0629501028806585, phase: 1.953723936899863, wave: 3.0520490397805213 },
      { x: -191.37088477366257, y: -103.39154663923183, z: 24.092832647462277, len: 136.35069444444446, speed: 5.379329561042524, phase: 5.276271433470508, wave: 2.776337448559671 }
    ]
  };

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var RAD = Math.PI / 180;
  var SQ = Math.sqrt(1.6);

  var TRUCK_TYPES = ['semi', 'box', 'bus', 'tanker'];
  var OUTER_TABLE = [['sedan', 0.3], ['suv', 0.16], ['pickup', 0.1], ['van', 0.1], ['box', 0.12], ['semi', 0.12], ['bus', 0.05], ['tanker', 0.05]];
  var INNER_TABLE = [['sedan', 0.5], ['suv', 0.28], ['pickup', 0.12], ['van', 0.1]];
  var CAR_PAINTS = ['#e5484d', '#3e63dd', '#30a46c', '#f5b40b', '#8e4ec6', '#12a594', '#f76b15', '#d6409f', '#0090ff', '#7ac943'];
  var TRUCK_PAINTS = ['#ff9f1c', '#2b59c3', '#c1121f', '#2d6a4f', '#ffd60a', '#6d28d9', '#0e7490', '#f4f1ea'];

  var LA_TIME = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' });

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function makeProjection(p) {
    var az = p.azimuth * RAD, el = p.elevation * RAD;
    return {
      origin: p.origin,
      scale: p.scale,
      azimuth: p.azimuth,
      elevation: p.elevation,
      sinA: Math.sin(az), cosA: Math.cos(az),
      sinE: Math.sin(el), cosE: Math.cos(el),
      k: p.scale * SQ
    };
  }

  var h = makeProjection(DATA.projection);

  // World [x, y, z] -> screen [x, y]
  function proj(p, w) {
    var ox = h.origin[0], oy = h.origin[1];
    return [
      ox + (w[0] * h.sinA - w[1] * h.cosA) * h.k,
      oy + ((w[0] * h.cosA + w[1] * h.sinA) * h.sinE - w[2] * h.cosE) * h.k
    ];
  }

  function fmt(v) {
    var s = (Math.round(10 * v) / 10).toFixed(1).replace(/\.0$/, '');
    return s === '-0' ? '0' : s;
  }

  function pathOf(points, close) {
    if (!points.length) return '';
    var d = '';
    for (var i = 0; i < points.length; i++) {
      d += (i ? 'L' : 'M') + fmt(points[i][0]) + ' ' + fmt(points[i][1]);
    }
    return d + (close ? 'Z' : '');
  }

  function r2(v) { return Math.round(100 * v) / 100; }

  // Translate for a group whose geometry is drawn around the projection origin
  function translateFor(w) {
    var o = proj(null, [0, 0, 0]);
    var p = proj(null, w);
    return 'translate(' + r2(p[0] - o[0]) + ' ' + r2(p[1] - o[1]) + ')';
  }

  function svgEl(name) { return document.createElementNS(SVG_NS, name); }

  function layerGroup(name) {
    var g = svgEl('g');
    if (name) g.setAttribute('data-layer', name);
    return g;
  }

  // Deterministic PRNG (Lehmer), seeded like the original
  var seed = 1937;
  function rnd() {
    seed = (16807 * seed) % 0x7fffffff;
    return (seed - 1) / 0x7ffffffe;
  }

  function pick(table) {
    var t = rnd();
    for (var i = 0; i < table.length; i++) {
      if ((t -= table[i][1]) <= 0) return table[i][0];
    }
    return table[table.length - 1][0];
  }

  var WIDE_MQ = window.matchMedia('(min-width: 1024px) and (min-aspect-ratio: 23/20), (min-width: 640px) and (min-aspect-ratio: 3/2)');
  var REDUCE_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  function computeView(width, height, wide) {
    var r = clamp(width / Math.max(1, height), 0.4, 3.2);
    var w = clamp(263 * Math.sqrt(r / (16 / 9)), 128, wide ? 330 : 290);
    var hh = w / r;
    var fx = wide ? 0.36 : 0.5;
    var fy = wide ? 0.42 : 0.26;
    return { x: 353.5 - w * fx, y: 130 - hh * fy, width: w, height: hh };
  }

  function init() {
    var sceneEl = document.querySelector('.gg-scene');
    var host = sceneEl && sceneEl.querySelector('.gg-scene-host');
    if (!sceneEl || !host) return;

    var resizeObserver = null;
    var controller = null;
    var readyRaf = 0;
    var aborter = new AbortController();

    var onWideChange = function () { setView(); };

    function setView() {
      var rect = sceneEl.getBoundingClientRect();
      var w = rect.width, hh = rect.height;
      if (w && hh && controller) {
        controller.setView(computeView(w, hh, WIDE_MQ.matches));
      }
    }

    fetch(SCENE_URL, { signal: aborter.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        host.innerHTML = text;
        var svg = host.querySelector('svg');
        if (!svg) return;
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        controller = createController(sceneEl, svg);
        setView();
        resizeObserver = new ResizeObserver(setView);
        resizeObserver.observe(sceneEl);
        WIDE_MQ.addEventListener('change', onWideChange);
        readyRaf = requestAnimationFrame(function () { sceneEl.setAttribute('data-ready', ''); });
      })
      .catch(function (err) {
        if (!aborter.signal.aborted) console.error('The Golden Gate scene could not load.', err);
      });
  }

  function createController(el, baseSvg) {
    var scene = baseSvg.querySelector('[data-scene]');
    var farLayer = baseSvg.querySelector('[data-layer="far"]');
    var deckLayer = baseSvg.querySelector('[data-layer="deck"]');
    var sortedLayer = baseSvg.querySelector('[data-layer="sorted"]');
    var nearLayer = baseSvg.querySelector('[data-layer="near"]');
    var airLayer = baseSvg.querySelector('[data-layer="air"]');
    var ship = baseSvg.querySelector('[data-ship]');
    var shipSlotFar = baseSvg.querySelector('[data-ship-slot="far"]');
    var shipSlotNear = baseSvg.querySelector('[data-ship-slot="near"]');
    if (!scene || !farLayer || !deckLayer || !sortedLayer || !nearLayer || !airLayer || !ship || !shipSlotFar || !shipSlotNear) {
      throw new Error('The Golden Gate scene is missing a layer');
    }

    var slots = { far: shipSlotFar, near: shipSlotNear };
    var farBoats = layerGroup();
    var nearBoats = layerGroup();
    var traffic = layerGroup('traffic');
    var fogLayer = layerGroup('fog');

    function wrap() {
      var children = [];
      for (var i = 0; i < arguments.length; i++) children.push(arguments[i]);
      var svgClone = baseSvg.cloneNode(false);
      var sceneClone = scene.cloneNode(false);
      for (var j = 0; j < children.length; j++) sceneClone.append(children[j]);
      svgClone.append(sceneClone);
      return svgClone;
    }

    var movingClone = wrap(slots.near, nearBoats, traffic, fogLayer);
    movingClone.setAttribute('data-moving', '');
    var layers = [baseSvg, wrap(slots.far, farBoats), wrap(farLayer, deckLayer), movingClone, wrap(sortedLayer, nearLayer), wrap(airLayer)];
    baseSvg.after(layers[1], layers[2], layers[3], layers[4], layers[5]);

    function updateNight() {
      var hour = Number(LA_TIME.format(new Date()));
      el.toggleAttribute('data-night', hour < 7 || hour >= 19);
    }
    updateNight();

    var lamps = [];
    el.querySelectorAll('[data-lamp]').forEach(function (node) {
      var xy = (node.dataset.lamp || '').split(',').map(Number);
      lamps.push({ node: node, x: xy[0], y: xy[1], on: false });
    });

    var suspensions = [];
    el.querySelectorAll('[data-susp]').forEach(function (node) {
      var path = node.firstElementChild;
      if (!(path instanceof SVGPathElement)) return;
      var v = (node.dataset.susp || '').split(',').map(Number);
      suspensions.push({ path: path, x: v[0], y: v[1], zBot: v[2], zTop: v[3], id: node.dataset.susp || '' });
    });

    var bounds = { x0: -Infinity, y0: -Infinity, x1: Infinity, y1: Infinity };
    function inView(pt, margin) {
      return pt[0] >= bounds.x0 - margin && pt[0] <= bounds.x1 + margin &&
        pt[1] >= bounds.y0 - margin && pt[1] <= bounds.y1 + margin;
    }
    function setVisible(node, shown) { node.style.display = shown ? '' : 'none'; }

    var boxes = [];
    el.querySelectorAll('[data-b]').forEach(function (node) {
      var v = (node.dataset.b || '').split(' ').map(Number);
      boxes.push({ node: node, x0: v[0], y0: v[1], x1: v[2], y1: v[3], shown: true });
    });

    var cars = [];
    var carByNode = new Map();
    var lanes = DATA.laneY.map(function (laneY, i) {
      return {
        laneY: laneY,
        sign: i < 3 ? 1 : -1,
        outer: i === 0 || i === 5,
        group: layerGroup(),
        pool: [],
        tail: null,
        nextGap: 0,
        delay: 1.5 * rnd()
      };
    });
    lanes.slice().sort(function (a, b) { return a.laneY - b.laneY; }).forEach(function (lane) { traffic.append(lane.group); });

    function dirSuffix(sign) { return sign > 0 ? 's' : 'n'; }
    function activeCars(lane) {
      return lane.pool.filter(function (c) { return c.active; }).sort(function (a, b) { return a.s - b.s; });
    }

    function makeCar(lane) {
      var node = svgEl('g');
      node.setAttribute('class', 'gg-car');
      node.style.display = 'none';
      var inner = svgEl('g');
      var use = svgEl('use');
      use.setAttribute('href', '#v-sedan-' + dirSuffix(lane.sign));
      inner.append(use);
      node.append(inner);
      lane.group.append(node);
      var car = {
        spec: DATA.vehicles.sedan,
        paint: CAR_PAINTS[0],
        laneY: lane.laneY,
        sign: lane.sign,
        s: -laneOrigin(),
        x: 0,
        want: 0,
        speed: 0,
        node: node,
        inner: inner,
        clipped: false,
        hidden: true,
        active: false
      };
      cars.push(car);
      carByNode.set(node, car);
      lane.pool.push(car);
      return car;
    }

    var SPAWN_S = -(DATA.tunnelX + 40);
    var DESPAWN_S = DATA.tunnelX + 40;
    function laneOrigin() { return DATA.tunnelX + 40; }

    function spawn(dt) {
      for (var i = 0; i < lanes.length; i++) {
        var lane = lanes[i];
        lane.delay = Math.max(0, lane.delay - dt);
        var tail = lane.tail && lane.tail.active ? lane.tail : (activeCars(lane)[0] || null);
        lane.tail = tail;
        if (lane.delay > 0) continue;
        var type = pick(lane.outer ? OUTER_TABLE : INNER_TABLE);
        var spec = DATA.vehicles[type];
        if (tail && tail.s - SPAWN_S < tail.spec.length / 2 + spec.length / 2 + lane.nextGap) continue;
        var car = lane.pool.find(function (c) { return !c.active; });
        if (!car && lane.pool.length < 26) car = makeCar(lane);
        if (!car) continue;
        var isTruck = TRUCK_TYPES.indexOf(type) !== -1;
        var want = DATA.mph * (isTruck ? 38 + 6 * rnd() : 43 + 7 * rnd());
        var palette = isTruck ? TRUCK_PAINTS : CAR_PAINTS;
        var paint = palette[Math.floor(rnd() * palette.length)];
        if (tail && paint === tail.paint) paint = palette[(palette.indexOf(paint) + 1) % palette.length];
        car.paint = paint;
        car.node.style.setProperty('--gg-paint', paint);
        car.spec = spec;
        car.s = SPAWN_S;
        car.want = want;
        car.speed = Math.min(want, tail ? tail.speed : want);
        car.active = true;
        var useEl = car.inner.firstElementChild;
        if (useEl) useEl.setAttribute('href', '#v-' + type + '-' + dirSuffix(lane.sign));
        if (lane.sign > 0) {
          if (lane.group.firstChild !== car.node) lane.group.prepend(car.node);
        } else {
          if (lane.group.lastChild !== car.node) lane.group.append(car.node);
        }
        lane.tail = car;
        lane.nextGap = lane.outer ? 26 + rnd() * rnd() * 150 : 22 + rnd() * rnd() * 140;
        lane.delay = 0;
      }
    }

    function advance(dt) {
      for (var i = 0; i < lanes.length; i++) {
        var lane = lanes[i];
        var list = activeCars(lane);
        list.forEach(function (car, idx) {
          var ahead = list[idx + 1];
          var target = car.want;
          if (ahead) {
            var gap = ahead.s - car.s - (ahead.spec.length + car.spec.length) / 2;
            var safe = 6 + 0.9 * car.speed;
            if (gap < safe) target = Math.min(car.want, ahead.speed * Math.min(1, gap / safe));
          }
          car.speed += (target - car.speed) * Math.min(1, dt * (target < car.speed ? 4 : 1.2));
        });
        for (var j = 0; j < list.length; j++) {
          list[j].s += list[j].speed * dt;
          if (list[j].s > DESPAWN_S) {
            list[j].active = false;
            if (hoveredCar === list[j]) setHovered(null);
          }
        }
        if (!(lane.tail && lane.tail.active)) lane.tail = activeCars(lane)[0] || null;
      }
    }

    function place() {
      for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        car.x = car.sign > 0 ? car.s : -car.s;
        var pos = [car.x, car.laneY, DATA.deckZ];
        var hide = !car.active || Math.abs(car.x) > DATA.tunnelX + car.spec.length / 2 + 1 || !inView(proj(null, pos), 18 + car.spec.length);
        if (hide !== car.hidden) {
          car.hidden = hide;
          setVisible(car.node, !hide);
          if (hide && hoveredCar === car) setHovered(null);
        }
        if (hide) continue;
        car.inner.setAttribute('transform', translateFor(pos));
        var clip = car.x < -DATA.tunnelX + car.spec.length / 2 + 2;
        if (clip !== car.clipped) {
          car.clipped = clip;
          if (clip) car.node.setAttribute('clip-path', 'url(#north-portal)');
          else car.node.removeAttribute('clip-path');
        }
      }
    }

    var W = Math.sign(Math.sin(h.azimuth * RAD)) || 1;
    function isFar(v) { return v * W < -4; }

    var shipT = -120;
    var shipSlot = null;
    var shipShown = true;

    function moveShip(dt) {
      shipT += 2.3 * dt;
      if (shipT > 236) shipT = -236;
      var shown = inView(proj(null, [-30, shipT, 0]), 120);
      if (shown !== shipShown) {
        shipShown = shown;
        setVisible(ship, shown);
      }
      if (!shown) return;
      ship.setAttribute('transform', translateFor([-30, shipT, 0]));
      ship.style.opacity = Math.min(1, (236 - Math.abs(shipT)) / 18).toFixed(2);
      var slotName = isFar(shipT) ? 'far' : 'near';
      if (slotName !== shipSlot) {
        shipSlot = slotName;
        slots[slotName].append(ship);
      }
    }

    function makeMarker(cls, href) {
      var node = svgEl('g');
      node.setAttribute('class', cls);
      var inner = svgEl('g');
      var use = svgEl('use');
      use.setAttribute('href', href);
      inner.append(use);
      node.append(inner);
      return { node: node, inner: inner, shown: true };
    }

    function checkVisible(marker, pos, margin) {
      var shown = inView(proj(null, pos), margin);
      if (shown !== marker.shown) {
        marker.shown = shown;
        setVisible(marker.node, shown);
      }
      return shown;
    }

    var boats = [[-70, 150, 0.6], [80, 115, -2.2], [-160, 95, 1.1], [120, -150, 2.6]].map(function (b, i) {
      var marker = makeMarker('gg-boat', '#boat-h0');
      return {
        node: marker.node, inner: marker.inner, shown: true,
        x: b[0], y: b[1], heading: b[2],
        speed: 3.2 + 0.5 * i,
        tackIn: 8 + 4 * i,
        dir: 0
      };
    });

    function moveBoats(dt) {
      for (var i = 0; i < boats.length; i++) {
        var boat = boats[i];
        boat.tackIn -= dt;
        var out = Math.abs(boat.x) > 235 || Math.abs(boat.y) > 215 || (Math.abs(boat.y) < 22 && Math.abs(boat.x) < 40);
        if (boat.tackIn <= 0 || out) {
          var toward = Math.atan2(-boat.y, -boat.x);
          boat.heading = out ? toward + (rnd() - 0.5) * 1.2 : boat.heading + (rnd() < 0.5 ? 1 : -1) * (1.4 + 0.8 * rnd());
          boat.tackIn = 10 + 12 * rnd();
        }
        boat.x += Math.cos(boat.heading) * boat.speed * dt;
        boat.y += Math.sin(boat.heading) * boat.speed * dt;
        if (!checkVisible(boat, [boat.x, boat.y, 0], 16)) continue;
        var dir = (Math.round(boat.heading / (Math.PI / 4)) % 8 + 8) % 8;
        if (dir !== boat.dir) {
          boat.dir = dir;
          var useEl = boat.inner.firstElementChild;
          if (useEl) useEl.setAttribute('href', '#boat-h' + dir);
        }
        boat.inner.setAttribute('transform', translateFor([boat.x, boat.y, 0]));
        var target = isFar(boat.y) ? farBoats : nearBoats;
        if (boat.node.parentNode !== target) target.append(boat.node);
      }
    }

    var fogs = DATA.fog.map(function (f, i) {
      var marker = makeMarker('gg-fog', '#fog-' + i);
      return {
        node: marker.node, inner: marker.inner, shown: true,
        x: f.x, y: f.y, z: f.z, speed: f.speed, t: f.phase, opacity: ''
      };
    });

    function moveFog(dt) {
      for (var i = 0; i < fogs.length; i++) {
        var fog = fogs[i];
        fog.y += fog.speed * dt;
        fog.t += 0.35 * dt;
        if (fog.y > 240) fog.y -= 480;
        if (!checkVisible(fog, [fog.x, fog.y, fog.z], 90)) continue;
        var opacity = (Math.min(1, (240 - Math.abs(fog.y)) / 30) * (0.42 + 0.2 * Math.sin(fog.t))).toFixed(2);
        if (opacity !== fog.opacity) {
          fog.opacity = opacity;
          fog.node.style.opacity = opacity;
        }
        fog.inner.setAttribute('transform', translateFor([fog.x, fog.y, fog.z]));
      }
    }

    var gulls = [];
    for (var gi = 0; gi < 6; gi++) {
      var p = svgEl('path');
      p.setAttribute('class', 'gg-gull');
      airLayer.append(p);
      gulls.push({
        node: p,
        cx: -120 + 48 * gi,
        cy: (gi % 2 ? 1 : -1) * (60 + 18 * gi),
        r: 24 + 6 * gi,
        z: 72 + 4 * gi,
        a: 1.1 * gi,
        w: (gi % 2 ? 1 : -1) * (0.35 + 0.04 * gi),
        flap: 0.7 * gi,
        shown: true
      });
    }

    function moveGulls(dt) {
      for (var i = 0; i < gulls.length; i++) {
        var g = gulls[i];
        g.a += g.w * dt;
        g.flap += 7 * dt;
        var gx = g.cx + Math.cos(g.a) * g.r;
        var gy = g.cy + Math.sin(g.a) * g.r;
        var gz = g.z + 2 * Math.sin(3 * g.a);
        var shown = inView(proj(null, [gx, gy, gz]), 8);
        if (shown !== g.shown) {
          g.shown = shown;
          setVisible(g.node, shown);
        }
        if (!shown) continue;
        var l = -Math.sin(g.a) * Math.sign(g.w);
        var ix = Math.cos(g.a) * Math.sign(g.w);
        var flap = 1.6 * Math.sin(g.flap);
        g.node.setAttribute('d', pathOf([
          proj(null, [gx - 4.2 * ix, gy + 4.2 * l, gz + flap]),
          proj(null, [gx, gy, gz]),
          proj(null, [gx + 4.2 * ix, gy - 4.2 * l, gz + flap]),
          proj(null, [gx, gy, gz + 0.9])
        ], true));
      }
    }

    var pointerWorld = null;
    var springs = new Map();
    var hoveredCar = null;
    var mousePos = null;
    var hoverTimer = 0;

    function clientToSvg(cx, cy) {
      var ctm = baseSvg.getScreenCTM();
      if (!ctm) return null;
      return new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    }

    function clientToWorld(cx, cy) {
      var pt = clientToSvg(cx, cy);
      if (!pt) return null;
      var o = proj(null, [0, 0, 0]);
      var xb = proj(null, [1, 0, 0]);
      var yb = proj(null, [0, 1, 0]);
      var zb = proj(null, [0, 0, DATA.deckZ]);
      var xdx = xb[0] - o[0], xdy = xb[1] - o[1];
      var ydx = yb[0] - o[0], ydy = yb[1] - o[1];
      var px = pt.x - zb[0], py = pt.y - zb[1];
      var det = xdx * ydy - ydx * xdy;
      return [(px * ydy - ydx * py) / det, (xdx * py - px * xdy) / det];
    }

    function updateLamps() {
      for (var i = 0; i < lamps.length; i++) {
        var lamp = lamps[i];
        var on = pointerWorld !== null && 83.2 > Math.hypot(lamp.x - pointerWorld[0], lamp.y - pointerWorld[1]);
        if (on !== lamp.on) {
          lamp.on = on;
          lamp.node.toggleAttribute('data-on', on);
        }
      }
    }

    function setHovered(car) {
      if (hoveredCar === car) return;
      if (hoveredCar) hoveredCar.node.removeAttribute('data-lit');
      hoveredCar = car;
      if (car) car.node.setAttribute('data-lit', '');
    }

    function carAtPoint(cx, cy) {
      var hit = document.elementFromPoint(cx, cy);
      var node = hit && hit.closest ? hit.closest('.gg-car') : null;
      var car = node ? carByNode.get(node) : undefined;
      return car && car.active && !car.hidden ? car : null;
    }

    function nearestCar(cx, cy) {
      var pt = clientToSvg(cx, cy);
      if (!pt) return null;
      var best = null;
      var bestDist = 144;
      for (var i = 0; i < cars.length; i++) {
        var car = cars[i];
        if (!car.active || car.hidden) continue;
        var scr = proj(null, [car.x, car.laneY, DATA.deckZ + 2]);
        var d = (scr[0] - pt.x) * (scr[0] - pt.x) + (scr[1] - pt.y) * (scr[1] - pt.y);
        if (d < bestDist) {
          bestDist = d;
          best = car;
        }
      }
      return best;
    }

    function onPointerMove(e) {
      pointerWorld = clientToWorld(e.clientX, e.clientY);
      if (e.pointerType === 'mouse') {
        mousePos = { x: e.clientX, y: e.clientY };
        setHovered(carAtPoint(e.clientX, e.clientY));
      } else {
        var car = carAtPoint(e.clientX, e.clientY) || nearestCar(e.clientX, e.clientY);
        if (car) {
          setHovered(car);
          window.clearTimeout(hoverTimer);
          hoverTimer = window.setTimeout(function () { setHovered(null); }, 2600);
        }
      }
      updateLamps();
      kick();
    }

    function onPointerLeave(e) {
      pointerWorld = null;
      if (e.pointerType === 'mouse') {
        mousePos = null;
        setHovered(null);
      }
      updateLamps();
      kick();
    }

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerdown', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);

    var rafId = 0;
    var lastTime = 0;
    var inViewport = false;

    function frame(now) {
      var dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;
      if (!REDUCE_MQ.matches) {
        spawn(dt);
        advance(dt);
        place();
        moveShip(dt);
        moveBoats(dt);
        moveFog(dt);
        moveGulls(dt);
        for (var i = 0; i < suspensions.length; i++) {
          var s = suspensions[i];
          var spring = springs.get(s.id);
          var pull = 0;
          if (pointerWorld) {
            var dx = s.x - pointerWorld[0];
            var dist = Math.hypot(dx, s.y - pointerWorld[1]);
            if (dist < 64) pull = 2.4 * Math.sign(dx || 1) * Math.pow(1 - dist / 64, 2);
          }
          if (!spring) {
            if (!pull) continue;
            spring = { at: 0, rate: 0 };
            springs.set(s.id, spring);
          }
          spring.rate += (pull - spring.at) * 70 * dt - 4.5 * spring.rate * dt;
          spring.at += spring.rate * dt;
          if (!pull && Math.abs(spring.at) < 0.01 && Math.abs(spring.rate) < 0.01) {
            spring.at = 0;
            springs.delete(s.id);
          }
          s.path.setAttribute('d', pathOf([
            proj(null, [s.x + spring.at, s.y, s.zBot]),
            proj(null, [s.x, s.y, s.zTop])
          ]));
        }
        if (mousePos) setHovered(carAtPoint(mousePos.x, mousePos.y));
      }
      rafId = inViewport && !REDUCE_MQ.matches ? requestAnimationFrame(frame) : 0;
      if (!rafId) lastTime = 0;
    }

    function kick() {
      if (!rafId && inViewport) rafId = requestAnimationFrame(frame);
    }

    // Pre-fill traffic
    for (var warm = 0; warm < 160; warm += 0.1) {
      spawn(0.1);
      advance(0.1);
    }
    for (var fi = 0; fi < fogs.length; fi++) fogLayer.append(fogs[fi].node);

    function reposition() {
      place();
      moveShip(0);
      moveBoats(0);
      moveFog(0);
      moveGulls(0);
    }

    var observer = new IntersectionObserver(function (entries) {
      inViewport = entries[entries.length - 1].isIntersecting;
      if (inViewport) kick();
      else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      }
    }, { rootMargin: '120px 0px' });
    observer.observe(el);

    var nightInterval = window.setInterval(updateNight, 60000);
    var onReduceChange = function () { kick(); };
    REDUCE_MQ.addEventListener('change', onReduceChange);

    reposition();

    return {
      setView: function (view) {
        var value = [view.x, view.y, view.width, view.height].map(function (v) { return v.toFixed(2); }).join(' ');
        for (var i = 0; i < layers.length; i++) layers[i].setAttribute('viewBox', value);
        bounds = { x0: view.x, y0: view.y, x1: view.x + view.width, y1: view.y + view.height };
        for (var b = 0; b < boxes.length; b++) {
          var box = boxes[b];
          var shown = box.x1 >= bounds.x0 - 10 && box.x0 <= bounds.x1 + 10 && box.y1 >= bounds.y0 - 10 && box.y0 <= bounds.y1 + 10;
          if (shown !== box.shown) {
            box.shown = shown;
            setVisible(box.node, shown);
          }
        }
        reposition();
      },
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
        window.clearInterval(nightInterval);
        window.clearTimeout(hoverTimer);
        REDUCE_MQ.removeEventListener('change', onReduceChange);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerdown', onPointerMove);
        el.removeEventListener('pointerleave', onPointerLeave);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
