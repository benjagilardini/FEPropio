export const unitTypeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
};

export const utilityTypeLabels: Record<string, string> = {
  electricity: 'EPEC',
  gas: 'Ecogas',
  water: 'Aguas Cordobesas',
  condominiumFees: 'Expensas',
  propertyTax: 'Imp. inmobiliario',
};

export const utilityAccountPrefix: Record<string, string> = {
  electricity: 'Contrato',
  gas: 'Cliente',
  water: 'U. de facturaci\u00f3n',
  condominiumFees: 'Consorcio',
  propertyTax: 'Partida',
};

export const expenseCategoryLabels: Record<string, string> = {
  tax: 'Impuesto',
  insurance: 'Seguro',
  maintenance: 'Mantenimiento',
  condominiumFees: 'Expensas',
  other: 'Otro',
};

export const maintenanceCategoryLabels: Record<string, string> = {
  plumbing: 'Plomer\u00eda',
  electrical: 'Electricidad',
  gas: 'Gas',
  structural: 'Estructura',
  appliance: 'Electrodom\u00e9stico',
  other: 'Otro',
};

export const frequencyLabels: Record<number, string> = {
  1: 'Mensual',
  2: 'Bimestral',
  3: 'Trimestral',
  4: 'Cuatrimestral',
  6: 'Semestral',
  12: 'Anual',
};

export const INDEX_DESCRIPTIONS: Record<string, string> = {
  ICL: '\u00cdndice para Contratos de Locaci\u00f3n, publicado por el BCRA. Combina inflaci\u00f3n (CER) y salarios (RIPTE).',
  IPC: '\u00cdndice de Precios al Consumidor, publicado por INDEC. Mide la variaci\u00f3n general de precios.',
  UVA: 'Unidad de Valor Adquisitivo, publicada por el BCRA. Ajusta por inflaci\u00f3n diaria seg\u00fan el CER.',
};
