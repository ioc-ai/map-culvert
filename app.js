// == LOGIN LOGIC ==
if (window.location.pathname.endsWith('login.html')) {
  document.getElementById('loginForm').onsubmit = async function (e) {
    e.preventDefault();
    let username = document.getElementById('username').value.trim();
    let password = document.getElementById('password').value;
    let errorDiv = document.getElementById('loginError');

    // fetch users.json (must be in same folder, public for demo)
    let users = await fetch('users.json').then(r=>r.json());
    let matched = users.find(u => u.username === username && u.password === password);

    if (matched) {
      localStorage.setItem('culvert_logged_in', '1');
      window.location = 'index.html';
    } else {
      errorDiv.style.display = 'block';
      errorDiv.textContent = 'Username atau password salah!';
    }
  };
}

// == LOGOUT LOGIC ==
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').onclick = function () {
    localStorage.removeItem('culvert_logged_in');
    window.location = 'login.html';
  };
}

// == AUTH GUARD ==
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/map-culvert/') {
  if (!localStorage.getItem('culvert_logged_in')) {
    window.location = 'login.html';
  }
}

// == MAP LOGIC ==
if (document.getElementById('map')) {
  // Google Satellite tile
  const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; Google Satellite'
  });

  // OSM as alternative
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });

  // Map init
  const map = L.map('map', {
    center: [-2.5, 118], // Indonesia center
    zoom: 5,
    layers: [googleSat]
  });

  // Layer control
  const baseMaps = {
    "Google Satellite": googleSat,
    "OpenStreetMap": osm
  };
  const overlayMaps = {};

  // Color mapping for circle marker
  function getColor(level) {
    switch ((level||'').toLowerCase()) {
      case 'critical': return '#d73027'; // red
      case 'high': return '#fc8d59';     // orange
      case 'medium': return '#fee08b';   // yellow
      case 'low': return '#1a9850';      // green
      case 'no data': return '#888888';  // grey
      default: return '#888888';         // fallback grey
    }
  }

  // Load Culverts GeoJSON
  fetch('culverts.geojson')
    .then(resp => resp.json())
    .then(data => {
      const culvertLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          let lvl = feature.properties?.Level || '';
          return L.circleMarker(latlng, {
            radius: 10,
            fillColor: getColor(lvl),
            color: '#222',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
          });
        },
        onEachFeature: function (feature, layer) {
          let props = feature.properties;
          let html = `<strong>Culvert</strong><br>`;
          for (let k in props) html += k+': '+props[k]+'<br>';
          layer.bindPopup(html);
        }
      });
      overlayMaps["Culverts"] = culvertLayer;
      culvertLayer.addTo(map);
      L.control.layers(baseMaps, overlayMaps).addTo(map);
      // Zoom to layer bounds
      try { map.fitBounds(culvertLayer.getBounds()); } catch(e){}
    }).catch(()=>{
      alert('Gagal memuat culverts.geojson!');
    });
}
