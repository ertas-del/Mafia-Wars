// Style sets, storefront types and invented sign names. No real businesses, no real people.
import type { AreaId } from '../cityData.ts';

export const STYLE_SETS: Record<AreaId, readonly string[]> = {
  manhattan_south: ['tenement', 'little_italy', 'financial'],
  midtown_concrete: ['tower', 'theatre', 'neon'],
  uptown: ['brownstone'],
  bronx_terminal: ['tenement', 'arthur_shop', 'warehouse'],
  brooklyn_docks: ['brownstone', 'pier_shed', 'warehouse'],
  queens_cargo: ['rowhouse', 'hangar', 'lounge'],
  staten_island: ['small_house'],
};

/** Storefront types each style may carry. */
export const STOREFRONTS: Record<string, readonly string[]> = {
  tenement: ['none', 'none', 'bakery', 'deli', 'bar', 'pharmacy', 'laundromat', 'pawn', 'cafe', 'butcher', 'tailor', 'barber', 'hardware', 'florist'],
  little_italy: ['bakery', 'cafe', 'butcher', 'social_club', 'deli', 'tailor', 'florist', 'restaurant', 'none'],
  financial: ['bank', 'lobby', 'office', 'brokerage'],
  tower: ['lobby', 'bank', 'office', 'brokerage'],
  theatre: ['theatre', 'cinema'],
  neon: ['arcade', 'bar', 'cinema', 'diner', 'pawn', 'lounge'],
  brownstone: ['none', 'none', 'cafe', 'florist', 'barber', 'pharmacy', 'deli'],
  arthur_shop: ['bakery', 'butcher', 'cafe', 'deli', 'florist', 'restaurant', 'fishmonger'],
  warehouse: ['loading_dock', 'garage', 'cold_storage', 'freight'],
  pier_shed: ['loading_dock', 'fishmonger', 'freight', 'chandler'],
  rowhouse: ['none', 'none', 'deli', 'bar', 'barber', 'laundromat'],
  hangar: ['hangar_door', 'freight'],
  lounge: ['lounge', 'bar', 'restaurant', 'diner'],
  small_house: ['none', 'none', 'none', 'garage', 'deli'],
};

export const SURNAMES: readonly string[] = [
  'Abruzzo', 'Acerra', 'Adamo', 'Albano', 'Alessi', 'Amato', 'Angelini', 'Arcuri', 'Bacci', 'Baldoni', 'Barone', 'Benedetti', 'Bertuzzi', 'Bianco', 'Bonelli',
  'Brancato', 'Bruno', 'Cacciola', 'Calabro', 'Caputo', 'Carbone', 'Cardillo', 'Carosi', 'Cavallo', 'Cerrone', 'Colombo', 'Corradi', 'Costa', 'Crisafulli', 'D\'Amico',
  'De Luca', 'Del Greco', 'Delgado', 'Dimarco', 'Donato', 'Esposito', 'Fabbri', 'Falco', 'Farina', 'Ferrante', 'Fiore', 'Fontana', 'Fratelli', 'Gaeta', 'Galasso',
  'Garofalo', 'Giordano', 'Greco', 'Guarino', 'Lombardi', 'Longo', 'Lucente', 'Maffei', 'Mancuso', 'Marchetti', 'Mazzola', 'Messina', 'Molinari', 'Monaco', 'Morelli',
  'Nardone', 'Orsini', 'Pagano', 'Palumbo', 'Pellegrino', 'Piazza', 'Ricci', 'Rinaldi', 'Romano', 'Ruggiero', 'Salerno', 'Sanna', 'Scarpa', 'Serrano', 'Tedesco',
  'Tomasi', 'Vitale', 'Zito', 'Abbott', 'Archer', 'Ashby', 'Bannon', 'Barlow', 'Brennan', 'Burke', 'Cadogan', 'Carrigan', 'Colgan', 'Conlon', 'Crowley',
  'Dolan', 'Doyle', 'Duffy', 'Fallon', 'Finnegan', 'Flaherty', 'Gilroy', 'Hanrahan', 'Keegan', 'Kinsella', 'Lacey', 'Madigan', 'McBride', 'Mulcahy', 'Nolan',
  'O\'Hara', 'Quinlan', 'Rafferty', 'Sheehan', 'Tierney', 'Whelan', 'Adler', 'Berman', 'Cohen', 'Eisner', 'Feldman', 'Gold', 'Hirsch', 'Kessler', 'Lerner',
  'Mandel', 'Neumann', 'Rosen', 'Sachs', 'Silver', 'Stern', 'Weiss', 'Zuckerman', 'Alvarez', 'Bonilla', 'Cordero', 'Duarte', 'Escobar', 'Figueroa', 'Guzman',
  'Herrera', 'Ibarra', 'Lozano', 'Marrero', 'Ortega', 'Quintero', 'Rivas', 'Soto', 'Vargas', 'Zamora', 'Chan', 'Fong', 'Huang', 'Leung', 'Mak',
  'Ng', 'Tam', 'Wong', 'Yee', 'Kowalski', 'Nowak', 'Wisniewski', 'Zielinski', 'Petrakis', 'Stavros', 'Kostas', 'Makris', 'Haddad', 'Khoury', 'Mansour',
  'Sarkis', 'Baptiste', 'Joseph', 'Laurent', 'Pierre', 'Sinclair', 'Whitfield', 'Holloway', 'Marlowe', 'Pemberton', 'Thackeray', 'Wexler', 'Ainsley', 'Beckett', 'Calloway',
];

const TRADES: Record<string, readonly string[]> = {
  bakery: ['Bakery', 'Pasticceria', 'Panificio', 'Pastry Shop', 'Bread Co.'],
  deli: ['Deli', 'Salumeria', 'Delicatessen', 'Provisions', 'Grocery'],
  bar: ['Tavern', 'Bar & Grill', 'Pub', 'Taproom', 'Saloon'],
  pharmacy: ['Pharmacy', 'Drugstore', 'Apothecary', 'Chemists'],
  laundromat: ['Laundry', 'Wash & Fold', 'Cleaners', 'Launderette'],
  pawn: ['Pawn', 'Loan & Jewelry', 'Pawnbrokers', 'Exchange'],
  cafe: ['Caffe', 'Coffee House', 'Espresso Bar', 'Cafe', 'Tea Room'],
  butcher: ['Butcher', 'Meats', 'Pork Store', 'Meat Market', 'Provisions'],
  tailor: ['Tailors', 'Clothiers', 'Dry Goods', 'Alterations', 'Haberdashery'],
  barber: ['Barber Shop', 'Barbers', 'Hair Salon', 'Shave & Cut'],
  hardware: ['Hardware', 'Tools & Supply', 'Lumber & Paint', 'Ironmongers'],
  florist: ['Florist', 'Flowers', 'Garden Shop', 'Nursery'],
  social_club: ['Social Club', 'Athletic Club', 'Benevolent Society', 'Men\'s Club'],
  restaurant: ['Ristorante', 'Trattoria', 'Restaurant', 'Kitchen', 'Osteria'],
  bank: ['Savings Bank', 'Trust', 'Bank & Trust', 'Mutual'],
  lobby: ['Building', 'Plaza', 'House', 'Tower', 'Center'],
  office: ['Associates', 'Holdings', 'Realty', 'Insurance', 'Partners'],
  brokerage: ['Brokerage', 'Securities', 'Capital', 'Exchange Co.'],
  theatre: ['Theatre', 'Playhouse', 'Palace', 'Opera House', 'Music Hall'],
  cinema: ['Cinema', 'Movie House', 'Picture Palace', 'Films'],
  arcade: ['Arcade', 'Amusements', 'Game Room', 'Pinball Hall'],
  diner: ['Diner', 'Luncheonette', 'Coffee Shop', 'Grill'],
  lounge: ['Lounge', 'Supper Club', 'Cocktail Bar', 'Room'],
  fishmonger: ['Fish Co.', 'Seafood', 'Fisheries', 'Fish Market', 'Oyster House'],
  loading_dock: ['Warehouse', 'Storage', 'Distributors', 'Wholesale'],
  garage: ['Auto Repair', 'Garage', 'Body Shop', 'Motors', 'Towing'],
  cold_storage: ['Cold Storage', 'Ice & Cold', 'Refrigeration', 'Provision Co.'],
  freight: ['Freight', 'Trucking', 'Cartage', 'Express', 'Haulage'],
  chandler: ['Ship Chandlers', 'Marine Supply', 'Rope & Tackle', 'Ship Stores'],
  hangar_door: ['Air Cargo', 'Aviation Services', 'Air Freight', 'Charter'],
};

/** Residential and generic building names by style. */
const HOUSE_TYPES: Record<string, readonly string[]> = {
  tenement: ['Flats', 'Apartments', 'Court', 'Arms', 'House'],
  little_italy: ['Flats', 'Palazzo', 'Court', 'Apartments'],
  brownstone: ['House', 'Row', 'Terrace', 'Residence', 'Court'],
  rowhouse: ['Row', 'Homes', 'Terrace', 'Cottages'],
  small_house: ['Cottage', 'House', 'Lodge', 'Cabin', 'Residence'],
  financial: ['Building', 'Exchange', 'Counting House', 'Hall'],
  tower: ['Tower', 'Plaza', 'Building', 'Center'],
  warehouse: ['Warehouse', 'Storage', 'Depot', 'Works'],
  pier_shed: ['Pier Shed', 'Wharf House', 'Dock Shed', 'Quay House'],
  hangar: ['Hangar', 'Air Terminal', 'Cargo Shed'],
  arthur_shop: ['Market', 'Shop', 'Emporium'],
  lounge: ['Lounge', 'Club', 'Room'],
  neon: ['Palace', 'Arcade', 'Revue'],
  theatre: ['Theatre', 'Playhouse', 'Palace'],
};

const ADJECTIVES: readonly string[] = ['Golden', 'Royal', 'Little', 'Grand', 'Lucky', 'Blue', 'Silver', 'Corner', 'Old', 'New', 'Star', 'Harbor', 'Empire', 'Liberty', 'Crown', 'Anchor', 'Maple', 'Cedar', 'Iron', 'Midnight'];

type Rand = () => number;
const pick = <T>(arr: readonly T[], rand: Rand): T => arr[Math.floor(rand() * arr.length)];

/** Build an invented sign name; the caller checks uniqueness and calls again on a clash. */
export function makeSign(style: string, storefront: string, rand: Rand): string {
  const sur = pick(SURNAMES, rand);
  const trades = TRADES[storefront];
  const form = Math.floor(rand() * 6);
  if (trades) {
    const t = pick(trades, rand);
    if (form === 0) return `${sur} ${t}`;
    if (form === 1) return `${sur} & Sons ${t}`;
    if (form === 2) return `${sur}'s ${t}`;
    if (form === 3) return `The ${pick(ADJECTIVES, rand)} ${t}`;
    if (form === 4) return `${sur} & ${pick(SURNAMES, rand)} ${t}`;
    return `${pick(ADJECTIVES, rand)} ${sur} ${t}`;
  }
  const h = pick(HOUSE_TYPES[style] || ['House'], rand);
  if (form < 3) return `${sur} ${h}`;
  if (form === 3) return `The ${pick(ADJECTIVES, rand)} ${h}`;
  if (form === 4) return `${pick(ADJECTIVES, rand)} ${sur} ${h}`;
  return `${sur} & ${pick(SURNAMES, rand)} ${h}`;
}
