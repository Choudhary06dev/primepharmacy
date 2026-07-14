import api from './api';

const STORAGE_CATEGORIES_KEY = 'primepharm_mock_categories';
const STORAGE_COMPANIES_KEY = 'primepharm_mock_companies';
const STORAGE_UNITS_KEY = 'primepharm_mock_units';
const STORAGE_MEDICINES_KEY = 'primepharm_mock_medicines';
const STORAGE_MEDICINES_CUSTOM_KEY = 'primepharm_mock_medicines_custom';
const STORAGE_MEDICINES_DELETED_KEY = 'primepharm_mock_medicines_deleted';
const STORAGE_BATCHES_KEY = 'primepharm_mock_batches';

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? user.pharmacy_id : null;
};

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultCats = [
  { id: 101, name: 'Tablets', description: 'Solid oral dosage forms' },
  { id: 102, name: 'Syrups', description: 'Liquid oral dosage forms' },
  { id: 103, name: 'Capsules', description: 'Solid oral dosage forms in soluble shells' },
  { id: 104, name: 'Suspensions', description: 'Liquid oral dosage forms requiring shaking' },
  { id: 105, name: 'Injections', description: 'Vials and ampoules for injection' },
  { id: 106, name: 'Ointments & Creams', description: 'Topical semi-solid formulations' },
  { id: 107, name: 'Eye & Ear Drops', description: 'Sterile liquid formulations' },
  { id: 108, name: 'Inhalers & Sprays', description: 'Aerosol formulations' },
  { id: 109, name: 'Sachets', description: 'Powder formulations' }
];

const defaultComps = [
  { id: 201, name: 'GlaxoSmithKline' },
  { id: 202, name: 'Abbott Laboratories' },
  { id: 203, name: 'The Searle Company' },
  { id: 204, name: 'Getz Pharma' },
  { id: 205, name: 'Pfizer' },
  { id: 206, name: 'Martin Dow' },
  { id: 207, name: 'Hilton Pharma' },
  { id: 208, name: 'Sanofi-Aventis' },
  { id: 209, name: 'Ferozsons Laboratories' },
  { id: 210, name: 'Bayer Pakistan' },
  { id: 211, name: 'Reckitt Benckiser' },
  { id: 212, name: 'Novartis' }
];

const defaultUnits = [
  { id: 301, name: 'Tablet', abbreviation: 'TAB', type: 'Base' },
  { id: 302, name: 'Capsule', abbreviation: 'CAP', type: 'Base' },
  { id: 303, name: 'Bottle', abbreviation: 'BTL', type: 'Base' },
  { id: 304, name: 'Vial/Ampoule', abbreviation: 'INJ', type: 'Base' },
  { id: 305, name: 'Tube', abbreviation: 'TUB', type: 'Base' },
  { id: 306, name: 'Sachet', abbreviation: 'SAC', type: 'Base' },
  { id: 307, name: 'Strip', abbreviation: 'STP', type: 'Multiple', description: 'Pack of 10' },
  { id: 308, name: 'Box', abbreviation: 'BOX', type: 'Multiple', description: 'Pack of 100' }
];

const seedMockDataForTenant = (pharmacyId) => {
  let cats = JSON.parse(localStorage.getItem(STORAGE_CATEGORIES_KEY) || '[]');
  let catsUpdated = false;
  defaultCats.forEach(dc => {
    if (!cats.some(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
      cats.push({ ...dc, pharmacy_id: pharmacyId, created_at: new Date().toISOString().split('T')[0], medicines_count: 0 });
      catsUpdated = true;
    }
  });
  if (catsUpdated || cats.length === 0) {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(cats));
    mockCategories = cats;
  }

  let comps = JSON.parse(localStorage.getItem(STORAGE_COMPANIES_KEY) || '[]');
  let compsUpdated = false;
  defaultComps.forEach(dc => {
    if (!comps.some(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
      comps.push({ ...dc, pharmacy_id: pharmacyId, created_at: new Date().toISOString().split('T')[0], medicines_count: 0 });
      compsUpdated = true;
    }
  });
  if (compsUpdated || comps.length === 0) {
    localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(comps));
    mockCompanies = comps;
  }

  let units = JSON.parse(localStorage.getItem(STORAGE_UNITS_KEY) || '[]');
  let unitsUpdated = false;
  defaultUnits.forEach(du => {
    if (!units.some(u => u.name.toLowerCase() === du.name.toLowerCase() || u.abbreviation.toLowerCase() === du.abbreviation.toLowerCase())) {
      units.push({ ...du, pharmacy_id: pharmacyId });
      unitsUpdated = true;
    }
  });
  if (unitsUpdated || units.length === 0) {
    localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(units));
    mockUnits = units;
  }

  const tabUnit = mockUnits.find(u => u.abbreviation === 'TAB') || { id: 301 };
  const capUnit = mockUnits.find(u => u.abbreviation === 'CAP') || { id: 302 };
  const btlUnit = mockUnits.find(u => u.abbreviation === 'BTL') || { id: 303 };
  const injUnit = mockUnits.find(u => u.abbreviation === 'INJ') || { id: 304 };
  const tubUnit = mockUnits.find(u => u.abbreviation === 'TUB') || { id: 305 };
  const sacUnit = mockUnits.find(u => u.abbreviation === 'SAC') || { id: 306 };
  const stripUnit = mockUnits.find(u => u.abbreviation === 'STP') || { id: 307 };
  const boxUnit = mockUnits.find(u => u.abbreviation === 'BOX') || { id: 308 };

  const rawMeds = [
    { name: 'Panadol 500mg', generic: 'Paracetamol', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Panadol CF', generic: 'Paracetamol + Pseudoephedrine', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Calpol Syrup 120mg/5ml', generic: 'Paracetamol', cat: 'Syrups', comp: 'GlaxoSmithKline', unitId: btlUnit.id },
    { name: 'Brufen 400mg', generic: 'Ibuprofen', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Brufen DS Syrup 200mg/5ml', generic: 'Ibuprofen', cat: 'Syrups', comp: 'Abbott Laboratories', unitId: btlUnit.id },
    { name: 'Augmentin 625mg', generic: 'Co-Amoxiclav', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Augmentin 1g', generic: 'Co-Amoxiclav', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Augmentin DS Suspension 156.25mg', generic: 'Co-Amoxiclav', cat: 'Suspensions', comp: 'GlaxoSmithKline', unitId: btlUnit.id },
    { name: 'Flagyl 400mg', generic: 'Metronidazole', cat: 'Tablets', comp: 'Sanofi-Aventis', unitId: tabUnit.id },
    { name: 'Flagyl Suspension 200mg/5ml', generic: 'Metronidazole', cat: 'Suspensions', comp: 'Sanofi-Aventis', unitId: btlUnit.id },
    { name: 'Disprin 300mg', generic: 'Aspirin', cat: 'Tablets', comp: 'Reckitt Benckiser', unitId: tabUnit.id },
    { name: 'Loprin 75mg', generic: 'Aspirin', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Solprin 300mg', generic: 'Aspirin Soluble', cat: 'Tablets', comp: 'Reckitt Benckiser', unitId: tabUnit.id },
    { name: 'Ponstan 250mg', generic: 'Mefenamic Acid', cat: 'Tablets', comp: 'Pfizer', unitId: tabUnit.id },
    { name: 'Ponstan Forte 500mg', generic: 'Mefenamic Acid', cat: 'Tablets', comp: 'Pfizer', unitId: tabUnit.id },
    { name: 'Arinac Tablet', generic: 'Ibuprofen + Pseudoephedrine', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Arinac Forte', generic: 'Ibuprofen + Pseudoephedrine', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Avil 25mg', generic: 'Pheniramine Maleate', cat: 'Tablets', comp: 'Sanofi-Aventis', unitId: tabUnit.id },
    { name: 'Avil Syrup', generic: 'Pheniramine Maleate', cat: 'Syrups', comp: 'Sanofi-Aventis', unitId: btlUnit.id },
    { name: 'Softin 10mg', generic: 'Loratadine', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Softin Syrup', generic: 'Loratadine', cat: 'Syrups', comp: 'The Searle Company', unitId: btlUnit.id },
    { name: 'Zyrtec 10mg', generic: 'Cetirizine Hydrochloride', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Zyrtec Syrup 5mg/5ml', generic: 'Cetirizine Hydrochloride', cat: 'Syrups', comp: 'GlaxoSmithKline', unitId: btlUnit.id },
    { name: 'Entamizole Tablet', generic: 'Metronidazole + Diloxanide Furoate', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Entamizole DS Tablet', generic: 'Metronidazole + Diloxanide Furoate', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Entamizole Suspension', generic: 'Metronidazole + Diloxanide Furoate', cat: 'Suspensions', comp: 'Abbott Laboratories', unitId: btlUnit.id },
    { name: 'Ventolin Inhaler 100mcg', generic: 'Salbutamol', cat: 'Inhalers & Sprays', comp: 'GlaxoSmithKline', unitId: btlUnit.id },
    { name: 'Ventolin Syrup 2mg/5ml', generic: 'Salbutamol', cat: 'Syrups', comp: 'GlaxoSmithKline', unitId: btlUnit.id },
    { name: 'Ventolin Tablet 2mg', generic: 'Salbutamol', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Novidat 250mg', generic: 'Ciprofloxacin', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Novidat 500mg', generic: 'Ciprofloxacin', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Ciproxin 500mg', generic: 'Ciprofloxacin', cat: 'Tablets', comp: 'Bayer Pakistan', unitId: tabUnit.id },
    { name: 'Leflox 250mg', generic: 'Levofloxacin', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Leflox 500mg', generic: 'Levofloxacin', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Cranmax Sachet', generic: 'Cranberry Extract', cat: 'Sachets', comp: 'The Searle Company', unitId: sacUnit.id },
    { name: 'Gravinate 50mg', generic: 'Dimenhydrinate', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Gravinate Syrup', generic: 'Dimenhydrinate', cat: 'Syrups', comp: 'The Searle Company', unitId: btlUnit.id },
    { name: 'Capoten 25mg', generic: 'Captopril', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Capoten 50mg', generic: 'Captopril', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Lipiget 10mg', generic: 'Atorvastatin', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Lipiget 20mg', generic: 'Atorvastatin', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Concor 2.5mg', generic: 'Bisoprolol Fumarate', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Concor 5mg', generic: 'Bisoprolol Fumarate', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Glucophage 500mg', generic: 'Metformin Hydrochloride', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Glucophage 850mg', generic: 'Metformin Hydrochloride', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Glucophage 1000mg', generic: 'Metformin Hydrochloride', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Getryl 1mg', generic: 'Glimepiride', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Getryl 2mg', generic: 'Glimepiride', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Getryl 3mg', generic: 'Glimepiride', cat: 'Tablets', comp: 'Getz Pharma', unitId: tabUnit.id },
    { name: 'Diamicron 60mg MR', generic: 'Gliclazide', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Voltral Emulgel 50g', generic: 'Diclofenac Diethylamine', cat: 'Ointments & Creams', comp: 'Novartis', unitId: tubUnit.id },
    { name: 'Voltral 50mg Tablet', generic: 'Diclofenac Sodium', cat: 'Tablets', comp: 'Novartis', unitId: tabUnit.id },
    { name: 'Voltral SR 100mg', generic: 'Diclofenac Sodium', cat: 'Tablets', comp: 'Novartis', unitId: tabUnit.id },
    { name: 'Voltral Injection 75mg', generic: 'Diclofenac Sodium', cat: 'Injections', comp: 'Novartis', unitId: injUnit.id },
    { name: 'Somogel Mouth Gel', generic: 'Lignocaine + Cetalkonium', cat: 'Ointments & Creams', comp: 'Abbott Laboratories', unitId: tubUnit.id },
    { name: 'Betnovate Cream 20g', generic: 'Betamethasone Valerate', cat: 'Ointments & Creams', comp: 'GlaxoSmithKline', unitId: tubUnit.id },
    { name: 'Betnovate-N Cream', generic: 'Betamethasone + Neomycin', cat: 'Ointments & Creams', comp: 'GlaxoSmithKline', unitId: tubUnit.id },
    { name: 'Betnovate-C Cream', generic: 'Betamethasone + Clioquinol', cat: 'Ointments & Creams', comp: 'GlaxoSmithKline', unitId: tubUnit.id },
    { name: 'Polyfax Skin Ointment 20g', generic: 'Polymyxin B + Bacitracin', cat: 'Ointments & Creams', comp: 'GlaxoSmithKline', unitId: tubUnit.id },
    { name: 'Polyfax Eye Ointment 6g', generic: 'Polymyxin B + Bacitracin', cat: 'Ointments & Creams', comp: 'GlaxoSmithKline', unitId: tubUnit.id },
    { name: 'Hydryllin Syrup 120ml', generic: 'Aminophylline + Compound', cat: 'Syrups', comp: 'The Searle Company', unitId: btlUnit.id },
    { name: 'Hydryllin DM Syrup', generic: 'Dextromethorphan + Compound', cat: 'Syrups', comp: 'The Searle Company', unitId: btlUnit.id },
    { name: 'Acefyl Syrup 120ml', generic: 'Acefylline Piperazine', cat: 'Syrups', comp: 'The Searle Company', unitId: btlUnit.id },
    { name: 'Pulmonol Syrup 120ml', generic: 'Cough expectorant formulation', cat: 'Syrups', comp: 'Martin Dow', unitId: btlUnit.id },
    { name: 'Gaviscon Liquid 150ml', generic: 'Sodium Alginate + Compound', cat: 'Suspensions', comp: 'Reckitt Benckiser', unitId: btlUnit.id },
    { name: 'Mucaine Suspension 120ml', generic: 'Oxetacaine in Antacid', cat: 'Suspensions', comp: 'Pfizer', unitId: btlUnit.id },
    { name: 'Risek 20mg Capsule', generic: 'Omeprazole', cat: 'Capsules', comp: 'Getz Pharma', unitId: capUnit.id },
    { name: 'Risek 40mg Capsule', generic: 'Omeprazole', cat: 'Capsules', comp: 'Getz Pharma', unitId: capUnit.id },
    { name: 'Risek Insta 20mg Sachet', generic: 'Omeprazole + Sodium Bicarbonate', cat: 'Sachets', comp: 'Getz Pharma', unitId: sacUnit.id },
    { name: 'Risek Insta 40mg Sachet', generic: 'Omeprazole + Sodium Bicarbonate', cat: 'Sachets', comp: 'Getz Pharma', unitId: sacUnit.id },
    { name: 'Sancos Syrup 120ml', generic: 'Pholcodine + Compound', cat: 'Syrups', comp: 'Novartis', unitId: btlUnit.id },
    { name: 'Tusdec Syrup 120ml', generic: 'Dextromethorphan + Pseudoephedrine', cat: 'Syrups', comp: 'Hilton Pharma', unitId: btlUnit.id },
    { name: 'Surbex-Z Tablet', generic: 'Zinc + B-Complex + Vitamin C', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'CAC 1000 Plus 10s', generic: 'Calcium + Vitamin C Effervescent', cat: 'Tablets', comp: 'GlaxoSmithKline', unitId: tabUnit.id },
    { name: 'Theragran-M Tablet', generic: 'Multivitamins & Minerals', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Fefol Vit Capsule', generic: 'Iron + Folic Acid + Vit C', cat: 'Capsules', comp: 'GlaxoSmithKline', unitId: capUnit.id },
    { name: 'Sangobion Capsule', generic: 'Iron + Vitamins & Minerals', cat: 'Capsules', comp: 'The Searle Company', unitId: capUnit.id },
    { name: 'Neurobion Tablet', generic: 'Vitamin B1 + B6 + B12', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Neurobion Injection 3ml', generic: 'Vitamin B1 + B6 + B12', cat: 'Injections', comp: 'The Searle Company', unitId: injUnit.id },
    { name: 'Epival 250mg Tablet', generic: 'Divalproex Sodium', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Epival 500mg Tablet', generic: 'Divalproex Sodium', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Epival Chrono 500mg', generic: 'Divalproex Sodium SR', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Tegral 200mg Tablet', generic: 'Carbamazepine', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Tegral CR 200mg', generic: 'Carbamazepine SR', cat: 'Tablets', comp: 'The Searle Company', unitId: tabUnit.id },
    { name: 'Rivotril 0.5mg Tablet', generic: 'Clonazepam', cat: 'Tablets', comp: 'Martin Dow', unitId: tabUnit.id },
    { name: 'Rivotril 2mg Tablet', generic: 'Clonazepam', cat: 'Tablets', comp: 'Martin Dow', unitId: tabUnit.id },
    { name: 'Xanax 0.25mg Tablet', generic: 'Alprazolam', cat: 'Tablets', comp: 'Pfizer', unitId: tabUnit.id },
    { name: 'Xanax 0.5mg Tablet', generic: 'Alprazolam', cat: 'Tablets', comp: 'Pfizer', unitId: tabUnit.id },
    { name: 'Lexotanil 3mg Tablet', generic: 'Bromazepam', cat: 'Tablets', comp: 'Martin Dow', unitId: tabUnit.id },
    { name: 'Serc 8mg Tablet', generic: 'Betahistine Dihydrochloride', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Serc 16mg Tablet', generic: 'Betahistine Dihydrochloride', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Amoxil 250mg Capsule', generic: 'Amoxicillin', cat: 'Capsules', comp: 'GlaxoSmithKline', unitId: capUnit.id },
    { name: 'Amoxil 500mg Capsule', generic: 'Amoxicillin', cat: 'Capsules', comp: 'GlaxoSmithKline', unitId: capUnit.id },
    { name: 'Amoxil Syrup 125mg/5ml', generic: 'Amoxicillin', cat: 'Syrups', comp: 'GlaxoSmithKline', unitId: btlUnit.id },
    { name: 'Voren 50mg Tablet', generic: 'Diclofenac Sodium', cat: 'Tablets', comp: 'Abbott Laboratories', unitId: tabUnit.id },
    { name: 'Ceftriaxone 1g Injection', generic: 'Ceftriaxone Sodium', cat: 'Injections', comp: 'Getz Pharma', unitId: injUnit.id },
    { name: 'Risek IV 40mg Injection', generic: 'Omeprazole Sodium', cat: 'Injections', comp: 'Getz Pharma', unitId: injUnit.id },
    { name: 'Avil Injection 2ml', generic: 'Pheniramine Maleate', cat: 'Injections', comp: 'Sanofi-Aventis', unitId: injUnit.id },
    { name: 'Gravinate Injection 1ml', generic: 'Dimenhydrinate', cat: 'Injections', comp: 'The Searle Company', unitId: injUnit.id }
  ];

  const prefixes = [
    'Pan', 'Bru', 'Cal', 'Aug', 'Fla', 'Pon', 'Avi', 'Zyr', 'Nov', 'Lef', 'Cip', 'Gra', 'Cap', 'Lip', 'Con', 'Glu', 'Get', 'Dia', 'Vol', 'Bet', 'Pol', 'Hyd', 'Ace', 'Pul', 'Gav', 'Muc', 'Ris', 'San', 'Tus', 'Sur', 'Fef', 'Neu', 'Epi', 'Teg', 'Riv', 'Xan', 'Lex', 'Ser', 'Amo', 'Vor', 'Cef', 'Nex', 'Ros', 'Aml', 'Los', 'Val', 'Ena', 'Lis', 'Azi', 'Cla', 'Mon', 'Fex', 'Lev', 'Esom', 'Omep', 'Pant', 'Rabi', 'Sita', 'Vilda', 'Empa', 'Dapa', 'Lina', 'Piog', 'Met', 'Glib', 'Thyr', 'Carb', 'Phen', 'Valp', 'Leve', 'Lamo', 'Topi', 'Fluo', 'Esci', 'Sert', 'Cita', 'Paro', 'Amit', 'Olan', 'Risp', 'Quet', 'Halo', 'Arip', 'Meth', 'Done', 'Mema', 'Flut', 'Bude', 'Ipra', 'Tiot', 'Form', 'Salm', 'Mome', 'Clot', 'Mico', 'Keto', 'Terb', 'Itra', 'Fluc', 'Acyc', 'Sofo', 'Dacl', 'Riba', 'Teno', 'Ente', 'Arte', 'Lume', 'Chlo', 'Prim', 'Quin', 'Pyri', 'Meb', 'Albe', 'Iver', 'Perm', 'Benz', 'Sali', 'Clob', 'Fusi', 'Mupi', 'Lata', 'Timo', 'Brim', 'Dorz', 'Tobr', 'Moxi', 'Gati', 'Dext', 'Ring', 'Pota', 'Calc', 'Alu', 'Mag', 'Sucr', 'Bism', 'Lact', 'Lope', 'Mebe', 'Colo', 'Spas', 'Bus', 'Dut', 'Fina', 'Tams', 'Alfu', 'Sild', 'Tada', 'Var', 'Ator', 'Simv', 'Prav', 'Feno', 'Gem', 'Chol', 'Cole', 'Zeti', 'Ezet', 'Ali', 'Rep', 'Evol', 'Bemp', 'Icos', 'Omega', 'Vasp', 'Nia', 'Acip', 'Nexu'
  ];

  const suffixes = [
    'adol', 'fen', 'pol', 'mentin', 'gyl', 'stan', 'vil', 'tec', 'idat', 'flox', 'xin', 'inate', 'oten', 'iget', 'cor', 'phage', 'ryl', 'cron', 'tral', 'novate', 'fax', 'llin', 'fyl', 'nol', 'con', 'caine', 'sek', 'cos', 'dec', 'bex', 'bion', 'val', 'ral', 'ril', 'nax', 'tan', 'oxil', 'ren', 'one', 'sone', 'zole', 'statin', 'pril', 'artan', 'mycin', 'xime', 'dine', 'kast', 'dine', 'alin', 'pine', 'vir', 'quine', 'in', 'sol', 'cid', 'pro', 'drop', 'cap', 'tab', 'syr', 'susp', 'inj', 'gel', 'cream', 'oint', 'derm', 'plus', 'extra', 'fort', 'forte', 'ds', 'max', 'fast', 'slow', 'sr', 'xr', 'mr', 'la', 'od', 'bd', 'tds', 'qid', 'am', 'pm', 'day', 'night', 'cold', 'flu', 'cough', 'relief', 'active', 'care', 'soft', 'hard', 'dry', 'wet', 'clear', 'pure', 'gold', 'silver', 'bronze', 'platinum'
  ];

  const genericsData = [
    { name: 'Paracetamol', cat: 'Tablets', unit: 'Tablet', strengths: ['500mg', '650mg', '1g'] },
    { name: 'Paracetamol', cat: 'Syrups', unit: 'Bottle', strengths: ['120mg/5ml', '250mg/5ml'] },
    { name: 'Ibuprofen', cat: 'Tablets', unit: 'Tablet', strengths: ['200mg', '400mg', '600mg'] },
    { name: 'Ibuprofen', cat: 'Syrups', unit: 'Bottle', strengths: ['100mg/5ml', '200mg/5ml'] },
    { name: 'Aspirin', cat: 'Tablets', unit: 'Tablet', strengths: ['75mg', '150mg', '300mg'] },
    { name: 'Mefenamic Acid', cat: 'Tablets', unit: 'Tablet', strengths: ['250mg', '500mg'] },
    { name: 'Metronidazole', cat: 'Tablets', unit: 'Tablet', strengths: ['200mg', '400mg'] },
    { name: 'Metronidazole', cat: 'Suspensions', unit: 'Bottle', strengths: ['200mg/5ml'] },
    { name: 'Co-Amoxiclav', cat: 'Tablets', unit: 'Tablet', strengths: ['375mg', '625mg', '1g'] },
    { name: 'Co-Amoxiclav', cat: 'Suspensions', unit: 'Bottle', strengths: ['156.25mg', '312.5mg'] },
    { name: 'Ciprofloxacin', cat: 'Tablets', unit: 'Tablet', strengths: ['250mg', '500mg', '750mg'] },
    { name: 'Levofloxacin', cat: 'Tablets', unit: 'Tablet', strengths: ['250mg', '500mg'] },
    { name: 'Amoxicillin', cat: 'Capsules', unit: 'Capsule', strengths: ['250mg', '500mg'] },
    { name: 'Amoxicillin', cat: 'Syrups', unit: 'Bottle', strengths: ['125mg/5ml', '250mg/5ml'] },
    { name: 'Omeprazole', cat: 'Capsules', unit: 'Capsule', strengths: ['10mg', '20mg', '40mg'] },
    { name: 'Esomeprazole', cat: 'Capsules', unit: 'Capsule', strengths: ['20mg', '40mg'] },
    { name: 'Esomeprazole', cat: 'Tablets', unit: 'Tablet', strengths: ['20mg', '40mg'] },
    { name: 'Pantoprazole', cat: 'Tablets', unit: 'Tablet', strengths: ['20mg', '40mg'] },
    { name: 'Rabeprazole', cat: 'Tablets', unit: 'Tablet', strengths: ['10mg', '20mg'] },
    { name: 'Atorvastatin', cat: 'Tablets', unit: 'Tablet', strengths: ['10mg', '20mg', '40mg', '80mg'] },
    { name: 'Rosuvastatin', cat: 'Tablets', unit: 'Tablet', strengths: ['5mg', '10mg', '20mg', '40mg'] },
    { name: 'Simvastatin', cat: 'Tablets', unit: 'Tablet', strengths: ['10mg', '20mg', '40mg'] },
    { name: 'Amlodipine', cat: 'Tablets', unit: 'Tablet', strengths: ['2.5mg', '5mg', '10mg'] },
    { name: 'Valsartan', cat: 'Tablets', unit: 'Tablet', strengths: ['80mg', '160mg', '320mg'] },
    { name: 'Losartan', cat: 'Tablets', unit: 'Tablet', strengths: ['25mg', '50mg', '100mg'] },
    { name: 'Enalapril', cat: 'Tablets', unit: 'Tablet', strengths: ['5mg', '10mg', '20mg'] },
    { name: 'Lisinopril', cat: 'Tablets', unit: 'Tablet', strengths: ['5mg', '10mg', '20mg'] },
    { name: 'Azithromycin', cat: 'Tablets', unit: 'Tablet', strengths: ['250mg', '500mg'] },
    { name: 'Azithromycin', cat: 'Suspensions', unit: 'Bottle', strengths: ['200mg/5ml'] },
    { name: 'Clarithromycin', cat: 'Tablets', unit: 'Tablet', strengths: ['250mg', '500mg'] },
    { name: 'Cefixime', cat: 'Capsules', unit: 'Capsule', strengths: ['400mg'] },
    { name: 'Cefixime', cat: 'Suspensions', unit: 'Bottle', strengths: ['100mg/5ml', '200mg/5ml'] },
    { name: 'Cefuroxime', cat: 'Tablets', unit: 'Tablet', strengths: ['125mg', '250mg', '500mg'] },
    { name: 'Cephradine', cat: 'Capsules', unit: 'Capsule', strengths: ['250mg', '500mg'] },
    { name: 'Cephradine', cat: 'Suspensions', unit: 'Bottle', strengths: ['125mg/5ml', '250mg/5ml'] },
  ];

  const companyNames = comps.map(c => c.name);
  const usedNames = {};
  const formattedMeds = [];

  // 1. original medicines
  rawMeds.forEach((m, idx) => {
    const matchedCat = cats.find(c => c.name === m.cat) || cats[0] || { id: 101, name: 'Tablets' };
    const matchedComp = comps.find(c => c.name === m.comp) || comps[0] || { id: 201, name: 'GlaxoSmithKline' };

    const conversions = [];
    if (m.unitId === tabUnit.id || m.unitId === capUnit.id) {
      conversions.push({
        id: Date.now() + Math.random(),
        from_unit_id: stripUnit.id,
        to_unit_id: m.unitId,
        factor: 10
      });
      conversions.push({
        id: Date.now() + Math.random(),
        from_unit_id: boxUnit.id,
        to_unit_id: m.unitId,
        factor: 100
      });
    }

    const companyName = matchedComp.name || 'GSK';
    const skuName = companyName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();

    usedNames[m.name.toLowerCase()] = 1;

    formattedMeds.push({
      id: 1000 + idx,
      pharmacy_id: pharmacyId,
      category_id: matchedCat.id,
      company_id: matchedComp.id,
      name: m.name,
      generic_name: m.generic,
      sku: `SKU-${skuName}-${String(idx + 1).padStart(3, '0')}`,
      barcode: `501${String(pharmacyId).padStart(2,'0')}${String(idx+1).padStart(7,'0')}`,
      min_stock_level: 50,
      base_unit_id: m.unitId,
      is_active: true,
      conversions: conversions
    });
  });

  // 2. generate additional mock medicines
  const targetCount = 1000;
  const originalCount = formattedMeds.length;
  const additionalNeed = targetCount - originalCount;

  for (let i = 0; i < additionalNeed; i++) {
    const generic = genericsData[i % genericsData.length];
    const company = companyNames[(i * 3) % companyNames.length];
    const strength = generic.strengths[i % generic.strengths.length];

    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[(i * 7) % suffixes.length];
    let brandRoot = prefix + suffix;
    brandRoot = brandRoot.charAt(0).toUpperCase() + brandRoot.slice(1);
    let baseName = brandRoot + ' ' + strength;

    // Uniqueness
    const nameKey = baseName.toLowerCase();
    if (usedNames[nameKey]) {
      usedNames[nameKey]++;
      baseName += ' ' + String.fromCharCode(64 + usedNames[nameKey]);
    } else {
      usedNames[nameKey] = 1;
    }

    const matchedCat = cats.find(c => c.name === generic.cat) || cats[0];
    const matchedComp = comps.find(c => c.name === company) || comps[0];
    
    let unitId = tabUnit.id;
    if (generic.unit === 'Capsule') unitId = capUnit.id;
    else if (generic.unit === 'Bottle') unitId = btlUnit.id;
    else if (generic.unit === 'Vial/Ampoule') unitId = injUnit.id;
    else if (generic.unit === 'Tube') unitId = tubUnit.id;
    else if (generic.unit === 'Sachet') unitId = sacUnit.id;

    const conversions = [];
    if (unitId === tabUnit.id || unitId === capUnit.id) {
      conversions.push({
        id: Date.now() + Math.random(),
        from_unit_id: stripUnit.id,
        to_unit_id: unitId,
        factor: 10
      });
      conversions.push({
        id: Date.now() + Math.random(),
        from_unit_id: boxUnit.id,
        to_unit_id: unitId,
        factor: 100
      });
    }

    const companyName = matchedComp.name || 'GSK';
    const skuName = companyName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const skuIndex = originalCount + i + 1;

    formattedMeds.push({
      id: 1000 + skuIndex,
      pharmacy_id: pharmacyId,
      category_id: matchedCat.id,
      company_id: matchedComp.id,
      name: baseName,
      generic_name: generic.name,
      sku: `SKU-${skuName}-${String(skuIndex).padStart(6, '0')}`,
      barcode: `501${String(pharmacyId).padStart(2,'0')}${String(skuIndex).padStart(7,'0')}`,
      min_stock_level: 50,
      base_unit_id: unitId,
      is_active: true,
      conversions: conversions
    });
  }

  return formattedMeds;
};

export const getInitialMedicines = () => {
  if (!isMockMode()) {
    return [];
  }
  const pharmacyId = getActivePharmacyId() || 1;
  const baseMeds = seedMockDataForTenant(pharmacyId);
  
  if (localStorage.getItem(STORAGE_MEDICINES_KEY)) {
    localStorage.removeItem(STORAGE_MEDICINES_KEY);
  }
  
  const customStored = localStorage.getItem(STORAGE_MEDICINES_CUSTOM_KEY);
  const customMeds = customStored ? JSON.parse(customStored) : [];
  
  const deletedStored = localStorage.getItem(STORAGE_MEDICINES_DELETED_KEY);
  const deletedIds = deletedStored ? JSON.parse(deletedStored) : [];
  
  const customMedsMap = new Map(customMeds.map(m => [m.id, m]));
  const deletedSet = new Set(deletedIds);
  
  const merged = [];
  
  baseMeds.forEach(m => {
    if (deletedSet.has(m.id)) {
      return;
    }
    if (customMedsMap.has(m.id)) {
      merged.push(customMedsMap.get(m.id));
      customMedsMap.delete(m.id);
    } else {
      merged.push(m);
    }
  });
  
  customMedsMap.forEach(m => {
    merged.push(m);
  });
  
  return merged;
};

const getInitialBatches = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_BATCHES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getInitialCategories = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let updated = false;
      parsed.forEach((cat) => {
        if (cat.pharmacy_id === undefined) {
          cat.pharmacy_id = 1;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing categories', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(initial));
  return initial;
};

const getInitialCompanies = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_COMPANIES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let updated = false;
      parsed.forEach((comp) => {
        if (comp.pharmacy_id === undefined) {
          comp.pharmacy_id = 1;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing companies', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(initial));
  return initial;
};

const getInitialUnits = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_UNITS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let updated = false;
      parsed.forEach((u) => {
        if (u.pharmacy_id === undefined) {
          u.pharmacy_id = 1;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing units', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(initial));
  return initial;
};

let mockCategories = getInitialCategories();
let mockCompanies = getInitialCompanies();
let mockUnits = getInitialUnits();
let mockMedicines = getInitialMedicines();
let mockBatches = getInitialBatches();

const saveCategories = () => { localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(mockCategories)); };
const saveCompanies = () => { localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(mockCompanies)); };
const saveUnits = () => { localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(mockUnits)); };
const saveMedicines = () => {
  const pharmacyId = getActivePharmacyId() || 1;
  const baseMeds = seedMockDataForTenant(pharmacyId);
  const baseMedsMap = new Map(baseMeds.map(m => [m.id, m]));
  
  const custom = mockMedicines.filter(m => {
    const base = baseMedsMap.get(m.id);
    if (!base) return true;
    return JSON.stringify(m) !== JSON.stringify(base);
  });
  
  const mockMedsSet = new Set(mockMedicines.map(m => m.id));
  const deleted = baseMeds.filter(m => !mockMedsSet.has(m.id)).map(m => m.id);
  
  localStorage.setItem(STORAGE_MEDICINES_CUSTOM_KEY, JSON.stringify(custom));
  localStorage.setItem(STORAGE_MEDICINES_DELETED_KEY, JSON.stringify(deleted));
  localStorage.removeItem(STORAGE_MEDICINES_KEY);
};
const saveBatches = () => { localStorage.setItem(STORAGE_BATCHES_KEY, JSON.stringify(mockBatches)); };

let categoriesCache = null;
let companiesCache = null;
let unitsCache = null;

export const getCategories = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      mockCategories = getInitialCategories();
      const pharmacyId = getActivePharmacyId();
      return mockCategories.filter((c) => c.pharmacy_id === pharmacyId || c.id < 1000);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
  if (categoriesCache) return categoriesCache;
  const response = await api.get('/inventory/categories');
  categoriesCache = response.data;
  return categoriesCache;
};

export const createCategory = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      const newCategory = {
        id: Date.now(),
        name: data.name,
        description: data.description || '',
        medicines_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        pharmacy_id: pharmacyId,
      };
      
      const exists = mockCategories.some(
        (cat) => cat.pharmacy_id === pharmacyId && cat.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A category with this name already exists.');
      }
      
      mockCategories.push(newCategory);
      saveCategories();
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/categories', data);
    categoriesCache = null;
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create category.';
    throw new Error(errorMsg);
  }
};

export const updateCategory = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      if (Number(id) < 1000) {
        throw new Error('System default categories cannot be updated.');
      }
      const idx = mockCategories.findIndex((cat) => cat.id === Number(id));
      if (idx === -1) throw new Error('Category not found.');

      const pharmacyId = getActivePharmacyId();
      const exists = mockCategories.some(
        (cat) => cat.pharmacy_id === pharmacyId && cat.id !== Number(id) && cat.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A category with this name already exists.');
      }

      mockCategories[idx] = {
        ...mockCategories[idx],
        name: data.name,
        description: data.description || '',
      };
      saveCategories();
      return mockCategories[idx];
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/categories/${id}`, data);
    categoriesCache = null;
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update category.';
    throw new Error(errorMsg);
  }
};

export const deleteCategory = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      if (Number(id) < 1000) {
        throw new Error('System default categories cannot be deleted.');
      }
      const idx = mockCategories.findIndex((cat) => cat.id === Number(id));
      if (idx === -1) throw new Error('Category not found.');

      if (mockCategories[idx].medicines_count > 0) {
        throw new Error(`Cannot delete category: ${mockCategories[idx].medicines_count} medicines are currently classified under it.`);
      }

      mockCategories.splice(idx, 1);
      saveCategories();
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/categories/${id}`);
    categoriesCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete category.');
  }
};

export const getCompanies = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      mockCompanies = getInitialCompanies();
      const pharmacyId = getActivePharmacyId();
      return mockCompanies.filter((comp) => comp.pharmacy_id === pharmacyId || comp.id < 1000);
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
  if (companiesCache) return companiesCache;
  const response = await api.get('/inventory/companies');
  companiesCache = response.data;
  return companiesCache;
};

export const createCompany = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      const exists = mockCompanies.some(
        (comp) => comp.pharmacy_id === pharmacyId && comp.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A company with this name already registered.');
      }

      const newCompany = {
        id: Date.now(),
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        medicines_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        pharmacy_id: pharmacyId,
      };
      
      mockCompanies.push(newCompany);
      saveCompanies();
      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/companies', data);
    companiesCache = null;
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to register company.';
    throw new Error(errorMsg);
  }
};

export const updateCompany = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      if (Number(id) < 1000) {
        throw new Error('System default manufacturers cannot be updated.');
      }
      const idx = mockCompanies.findIndex((comp) => comp.id === Number(id));
      if (idx === -1) throw new Error('Company not found.');

      const pharmacyId = getActivePharmacyId();
      const exists = mockCompanies.some(
        (comp) => comp.pharmacy_id === pharmacyId && comp.id !== Number(id) && comp.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A company with this name already registered.');
      }

      mockCompanies[idx] = {
        ...mockCompanies[idx],
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
      };
      saveCompanies();
      return mockCompanies[idx];
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/companies/${id}`, data);
    companiesCache = null;
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update company.';
    throw new Error(errorMsg);
  }
};

export const deleteCompany = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      if (Number(id) < 1000) {
        throw new Error('System default manufacturers cannot be deleted.');
      }
      const idx = mockCompanies.findIndex((comp) => comp.id === Number(id));
      if (idx === -1) throw new Error('Company not found.');

      if (mockCompanies[idx].medicines_count > 0) {
        throw new Error(`Cannot delete manufacturer: ${mockCompanies[idx].medicines_count} medicines are linked to this company.`);
      }

      mockCompanies.splice(idx, 1);
      saveCompanies();
      return { success: true };
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/companies/${id}`);
    companiesCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete company.');
  }
};

export const getUnits = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      mockUnits = getInitialUnits();
      const pharmacyId = getActivePharmacyId();
      return mockUnits.filter((u) => u.pharmacy_id === pharmacyId || u.id < 1000);
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  }
  if (unitsCache) return unitsCache;
  const response = await api.get('/inventory/units');
  unitsCache = response.data;
  return unitsCache;
};

export const createUnit = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      const exists = mockUnits.some(
        (u) => u.pharmacy_id === pharmacyId && (u.name.toLowerCase() === data.name.toLowerCase() || u.abbreviation.toLowerCase() === data.abbreviation.toLowerCase())
      );
      if (exists) {
        throw new Error('A unit with this name or abbreviation already registered.');
      }

      const newUnit = {
        id: Date.now(),
        name: data.name,
        abbreviation: data.abbreviation.toUpperCase(),
        type: data.type || 'Base',
        description: data.description || '',
        pharmacy_id: pharmacyId,
      };
      
      mockUnits.push(newUnit);
      saveUnits();
      return newUnit;
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/units', data);
    unitsCache = null;
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create unit.';
    throw new Error(errorMsg);
  }
};

export const updateUnit = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      if (Number(id) < 1000) {
        throw new Error('System default units cannot be updated.');
      }
      const idx = mockUnits.findIndex((u) => u.id === Number(id));
      if (idx === -1) throw new Error('Unit not found.');

      const pharmacyId = getActivePharmacyId();
      const exists = mockUnits.some(
        (u) => u.pharmacy_id === pharmacyId && u.id !== Number(id) && (u.name.toLowerCase() === data.name.toLowerCase() || u.abbreviation.toLowerCase() === data.abbreviation.toLowerCase())
      );
      if (exists) {
        throw new Error('A unit with this name or abbreviation already registered.');
      }

      mockUnits[idx] = {
        ...mockUnits[idx],
        name: data.name,
        abbreviation: data.abbreviation.toUpperCase(),
        type: data.type || 'Base',
        description: data.description || '',
      };
      saveUnits();
      return mockUnits[idx];
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/units/${id}`, data);
    unitsCache = null;
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update unit.';
    throw new Error(errorMsg);
  }
};

export const deleteUnit = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      if (Number(id) < 1000) {
        throw new Error('System default units cannot be deleted.');
      }
      const idx = mockUnits.findIndex((u) => u.id === Number(id));
      if (idx === -1) throw new Error('Unit not found.');

      mockUnits.splice(idx, 1);
      saveUnits();
      return { success: true };
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/units/${id}`);
    unitsCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete unit.');
  }
};

// ─── MEDICINES CATALOG INTEGRATIONS ────────────────────────────────────

export const getMedicines = async (page, search = '', perPage = 25, simple = false) => {
  if (isMockMode()) {
    try {
      await delay(200);
      mockMedicines = getInitialMedicines();
      const pharmacyId = getActivePharmacyId();
      const cats = JSON.parse(localStorage.getItem('primepharm_mock_categories') || '[]');
      const comps = JSON.parse(localStorage.getItem('primepharm_mock_companies') || '[]');
      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const batches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');

      const mappedMeds = mockMedicines.filter((m) => m.pharmacy_id === pharmacyId).map((m) => {
        const activeBatches = batches.filter((b) => b.medicine_id === m.id && b.status === 'ACTIVE');
        return {
          ...m,
          category: cats.find((c) => c.id === Number(m.category_id)),
          company: comps.find((c) => c.id === Number(m.company_id)),
          base_unit: units.find((u) => u.id === Number(m.base_unit_id)),
          conversions: (m.conversions || []).map((c) => ({
            ...c,
            from_unit: units.find((u) => u.id === Number(c.from_unit_id))
          })),
          batches: activeBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)),
          total_stock: activeBatches.reduce((acc, curr) => acc + Number(curr.remaining_quantity), 0)
        };
      });

      return mappedMeds.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching mock medicines:', error);
      throw error;
    }
  }

  const params = {};
  if (page !== undefined) {
    params.page = page;
    params.search = search;
    params.per_page = perPage;
  } else {
    params.paginate = 'false';
    if (simple) {
      params.simple = 'true';
      if (search) {
        params.search = search;
      }
    }
  }

  const response = await api.get('/inventory/medicines', { params });
  return response.data;
};

export const getMedicine = async (id) => {
  if (isMockMode()) {
    try {
      await delay(100);
      mockMedicines = getInitialMedicines();
      const med = mockMedicines.find((m) => m.id === Number(id));
      if (!med) throw new Error('Medicine not found.');
      return med;
    } catch (error) {
      console.error('Error fetching mock medicine:', error);
      throw error;
    }
  }

  const response = await api.get(`/inventory/medicines/${id}`);
  return response.data;
};

export const createMedicine = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      
      const newMed = {
        id: Date.now(),
        pharmacy_id: pharmacyId,
        category_id: Number(data.category_id),
        company_id: Number(data.company_id),
        name: data.name,
        generic_name: data.generic_name || '',
        sku: data.sku || `SKU-${Date.now()}`,
        barcode: data.barcode || '',
        min_stock_level: Number(data.min_stock_level || 0),
        base_unit_id: Number(data.base_unit_id),
        is_active: data.is_active !== undefined ? data.is_active : true,
        conversions: (data.conversions || []).map((c) => ({
          id: Date.now() + Math.random(),
          from_unit_id: Number(c.from_unit_id),
          to_unit_id: Number(data.base_unit_id),
          factor: Number(c.factor),
        }))
      };

      // Simulated unique checks
      if (mockMedicines.some((m) => m.pharmacy_id === pharmacyId && m.sku === newMed.sku)) {
        throw new Error('A medicine with this SKU already exists.');
      }

      mockMedicines.push(newMed);
      saveMedicines();

      const cats = JSON.parse(localStorage.getItem('primepharm_mock_categories') || '[]');
      const comps = JSON.parse(localStorage.getItem('primepharm_mock_companies') || '[]');
      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');

      return {
        ...newMed,
        category: cats.find((c) => c.id === newMed.category_id),
        company: comps.find((c) => c.id === newMed.company_id),
        base_unit: units.find((u) => u.id === newMed.base_unit_id),
        conversions: newMed.conversions.map((c) => ({
          ...c,
          from_unit: units.find((u) => u.id === c.from_unit_id)
        })),
        batches: [],
        total_stock: 0
      };
    } catch (error) {
      console.error('Error creating mock medicine:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/medicines', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create medicine.';
    throw new Error(errorMsg);
  }
};

export const updateMedicine = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockMedicines.findIndex((m) => m.id === Number(id));
      if (idx === -1) throw new Error('Medicine not found.');

      const pharmacyId = getActivePharmacyId();

      mockMedicines[idx] = {
        ...mockMedicines[idx],
        category_id: Number(data.category_id),
        company_id: Number(data.company_id),
        name: data.name,
        generic_name: data.generic_name || '',
        sku: data.sku || mockMedicines[idx].sku || `SKU-${Date.now()}`,
        barcode: data.barcode || '',
        min_stock_level: Number(data.min_stock_level || 0),
        base_unit_id: Number(data.base_unit_id),
        is_active: data.is_active !== undefined ? data.is_active : true,
        conversions: (data.conversions || []).map((c) => ({
          id: c.id || Date.now() + Math.random(),
          from_unit_id: Number(c.from_unit_id),
          to_unit_id: Number(data.base_unit_id),
          factor: Number(c.factor),
        }))
      };

      saveMedicines();

      const cats = JSON.parse(localStorage.getItem('primepharm_mock_categories') || '[]');
      const comps = JSON.parse(localStorage.getItem('primepharm_mock_companies') || '[]');
      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const batches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
      const activeBatches = batches.filter((b) => b.medicine_id === Number(id) && b.status === 'ACTIVE');
      const totalStock = activeBatches.reduce((acc, curr) => acc + Number(curr.remaining_quantity), 0);

      const updatedMed = mockMedicines[idx];
      return {
        ...updatedMed,
        category: cats.find((c) => c.id === updatedMed.category_id),
        company: comps.find((c) => c.id === updatedMed.company_id),
        base_unit: units.find((u) => u.id === updatedMed.base_unit_id),
        conversions: updatedMed.conversions.map((c) => ({
          ...c,
          from_unit: units.find((u) => u.id === c.from_unit_id)
        })),
        batches: activeBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)),
        total_stock: totalStock
      };
    } catch (error) {
      console.error('Error updating mock medicine:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/medicines/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update medicine.';
    throw new Error(errorMsg);
  }
};

export const deleteMedicine = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockMedicines.findIndex((m) => m.id === Number(id));
      if (idx === -1) throw new Error('Medicine not found.');

      // Prevent delete if batches exist
      const batches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
      if (batches.some((b) => b.medicine_id === Number(id))) {
        throw new Error('Cannot delete medicine: physical stock batches are currently in inventory.');
      }

      mockMedicines.splice(idx, 1);
      saveMedicines();
      return { success: true };
    } catch (error) {
      console.error('Error deleting mock medicine:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/medicines/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete medicine.');
  }
};

// ─── STOCK BATCHES INTEGRATIONS ───────────────────────────────────────

export const getBatches = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      mockBatches = getInitialBatches();
      mockMedicines = getInitialMedicines();
      const pharmacyId = getActivePharmacyId();
      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');

      return mockBatches.filter((b) => b.pharmacy_id === pharmacyId).map((b) => {
        const med = mockMedicines.find((m) => m.id === Number(b.medicine_id));
        const baseUnit = units.find((u) => u.id === Number(med?.base_unit_id));
        return {
          ...b,
          medicine: med ? { ...med, base_unit: baseUnit } : null
        };
      });
    } catch (error) {
      console.error('Error fetching mock batches:', error);
      throw error;
    }
  }

  const response = await api.get('/inventory/batches');
  return response.data;
};

export const createBatch = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      
      const newBatch = {
        id: Date.now(),
        pharmacy_id: pharmacyId,
        branch_id: 1,
        medicine_id: Number(data.medicine_id),
        batch_no: data.batch_no,
        expiry_date: data.expiry_date,
        purchase_price: Number(data.purchase_price),
        sale_price: Number(data.sale_price),
        quantity: Number(data.quantity),
        remaining_quantity: Number(data.quantity),
        status: 'ACTIVE',
        created_at: new Date().toISOString().split('T')[0],
      };

      mockBatches.push(newBatch);
      saveBatches();

      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const med = mockMedicines.find((m) => m.id === Number(newBatch.medicine_id));
      const baseUnit = units.find((u) => u.id === Number(med?.base_unit_id));
      
      return {
        ...newBatch,
        medicine: med ? { ...med, base_unit: baseUnit } : null
      };
    } catch (error) {
      console.error('Error creating mock batch:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/batches', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create stock batch.';
    throw new Error(errorMsg);
  }
};

export const updateBatch = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockBatches.findIndex((b) => b.id === Number(id));
      if (idx === -1) throw new Error('Batch not found.');

      mockBatches[idx] = {
        ...mockBatches[idx],
        medicine_id: Number(data.medicine_id),
        batch_no: data.batch_no,
        expiry_date: data.expiry_date,
        purchase_price: Number(data.purchase_price),
        sale_price: Number(data.sale_price),
        quantity: Number(data.quantity),
        remaining_quantity: Number(data.remaining_quantity),
        status: data.status,
      };

      saveBatches();

      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const med = mockMedicines.find((m) => m.id === Number(mockBatches[idx].medicine_id));
      const baseUnit = units.find((u) => u.id === Number(med?.base_unit_id));

      return {
        ...mockBatches[idx],
        medicine: med ? { ...med, base_unit: baseUnit } : null
      };
    } catch (error) {
      console.error('Error updating mock batch:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/batches/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update batch.';
    throw new Error(errorMsg);
  }
};

export const deleteBatch = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockBatches.findIndex((b) => b.id === Number(id));
      if (idx === -1) throw new Error('Batch not found.');

      mockBatches.splice(idx, 1);
      saveBatches();
      return { success: true };
    } catch (error) {
      console.error('Error deleting mock batch:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/batches/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete batch.');
  }
};
