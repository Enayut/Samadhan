// Demo photo gallery — real photographs extracted from the bundled official
// CCL Annual Report 2024-25 (provenance: data/images/ATTRIBUTION.md; files
// copied into mobile/public/images/). These are REPRESENTATIVE CCL field
// images for the demo gallery — NOT photos captured by demo characters and
// NOT live feeds. Labels follow the attribution file's honesty rules (page
// function / chapter context, never an asserted per-photo subject).
export interface GalleryPhoto {
  id: string;
  src: string;
  label: string;
  mine: string;
  context: string;
  source: string;
  /** Representative mine context this photo illustrates (honest labelling). */
  representative: boolean;
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'pip-bench',
    src: '/images/piparwar-bench.jpg',
    label: 'Opencast bench · Piparwar area',
    mine: 'MINE-001 · Piparwar OCP',
    context: 'Representative North Karanpura opencast plate (official CCL artwork)',
    source: 'CCL Annual Report 2024-25, plate after cover',
    representative: true,
  },
  {
    id: 'pip-haul',
    src: '/images/piparwar-haul-road.jpg',
    label: 'Piparwar OCP · operations context',
    mine: 'MINE-001 · Piparwar OCP',
    context: 'Official CCL report back-cover plate — representative operations imagery',
    source: 'CCL Annual Report 2024-25, back cover',
    representative: true,
  },
  {
    id: 'safety-insp',
    src: '/images/safety-inspection.jpg',
    label: 'Safety inspection scene',
    mine: 'Area safety context',
    context: 'Safety chapter photograph — representative inspection scene',
    source: 'CCL Annual Report 2024-25, safety chapter (p.61)',
    representative: true,
  },
  {
    id: 'ppe-crew',
    src: '/images/ppe-crew.jpg',
    label: 'Crew / PPE compliance scene',
    mine: 'Area labour context',
    context: 'Safety chapter photograph — representative crew scene',
    source: 'CCL Annual Report 2024-25, safety chapter (p.61)',
    representative: true,
  },
  {
    id: 'slope-survey',
    src: '/images/slope-survey.jpg',
    label: 'Field survey / slope monitoring',
    mine: 'MINE-002/003 · OCP context',
    context: 'Geology field-visit photograph, North Karanpura — representative monitoring scene',
    source: 'CCL Annual Report 2024-25, geology page (p.89)',
    representative: true,
  },
  {
    id: 'dust-suppression',
    src: '/images/dust-suppression.jpg',
    label: 'Environment / dust-suppression context',
    mine: 'MINE-002 · Ashoka OCP context',
    context: 'Environment chapter photograph — representative EC-condition scene',
    source: 'CCL Annual Report 2024-25, environment page (p.85)',
    representative: true,
  },
];

// Fallback shown if an asset cannot load (never a black/broken frame).
export const GALLERY_FALLBACK_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
      <rect width="400" height="260" fill="#E2E8F0"/>
      <rect x="12" y="12" width="376" height="236" rx="8" fill="#F7FAFC" stroke="#CBD5E0" stroke-width="2" stroke-dasharray="6 4"/>
      <g fill="#718096" font-family="sans-serif" text-anchor="middle">
        <text x="200" y="118" font-size="15" font-weight="bold">Mine photo unavailable</text>
        <text x="200" y="142" font-size="11">Evidence metadata (GPS · timestamp · hash) remains valid.</text>
        <text x="200" y="230" font-size="9" fill="#A0AEC0">SAMAADHAN demo gallery</text>
      </g>
    </svg>`,
  );
