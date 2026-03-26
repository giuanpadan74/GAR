
export interface Agent {
  id: number;
  name: string;
  phone: string;
  email: string;
  color: string;
  assignedMunicipalities: number[];
}

export interface Region {
  codice_regione: number;
  nome_regione: string;
}

export interface Province {
  codice_provincia: number;
  nome_provincia: string;
  codice_regione: number;
  sigla_provincia: string;
}

export type GeoJSONGeometry = {
  type: string;
  coordinates: any;
};

export interface Municipality {
  codice_comune: number;
  nome_comune: string;
  codice_provincia: number;
  geometry?: GeoJSONGeometry;
}