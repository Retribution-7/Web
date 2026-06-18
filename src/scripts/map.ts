import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Office {
  name: string;
  address: string;
  lat: number;
  lng: number;
  main?: boolean;
}

const OFFICES: Office[] = [
  {
    name: "Contractor — Главный офис",
    address: "пр. Независимости, 38, Минск, Беларусь",
    lat: 53.9023,
    lng: 27.5619,
    main: true,
  },
  {
    name: "Contractor — Шоурум Восток",
    address: "ул. Немига, 5, Минск, Беларусь",
    lat: 53.9091,
    lng: 27.5476,
  },
  {
    name: "Contractor — Офис Запад",
    address: "пр. Машерова, 25, Минск, Беларусь",
    lat: 53.9205,
    lng: 27.5292,
  },
];

export function initMap(): void {
  const el = document.getElementById("business-map");
  if (!el) return;

  if ((el as any)._leaflet_id != null) {
    (el as any)._leaflet_id = null;
    el.innerHTML = "";
  }

  const center = OFFICES.find((o) => o.main) ?? OFFICES[0];
  const map = L.map(el, { scrollWheelZoom: false }).setView(
    [center.lat, center.lng],
    13,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const pinSvg = (color: string, size: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
    </svg>`;

  const mainIcon = L.divIcon({
    className: "",
    html: `<div style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.4))">${pinSvg("#FF4D01", 40)}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });

  const branchIcon = L.divIcon({
    className: "",
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">${pinSvg("#191919", 32)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });

  OFFICES.forEach((office) => {
    const marker = L.marker([office.lat, office.lng], {
      icon: office.main ? mainIcon : branchIcon,
    }).addTo(map);

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(office.address)}`;

    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif;min-width:180px">
        <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#191919">${office.name}</p>
        <p style="font-size:12px;color:#605E5D;margin:0 0 10px">${office.address}</p>
        <a href="${directionsUrl}" target="_blank" rel="noopener"
           style="display:inline-block;padding:6px 12px;background:#FF4D01;color:#fff;
                  border-radius:8px;font-size:12px;font-weight:600;text-decoration:none">
          Get Directions →
        </a>
      </div>
    `);

    if (office.main) marker.openPopup();
  });
}
