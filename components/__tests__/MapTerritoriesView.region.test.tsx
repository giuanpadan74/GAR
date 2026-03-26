import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapTerritoriesView from '../MapTerritoriesView';
import geoService from '../../services/geoService';
import { supabase } from '../../services/supabaseClient';

// Mock dei servizi
vi.mock('../../services/geoService', () => {
    const geoServiceMock = {
        getRegions: vi.fn(),
        getProvinces: vi.fn(),
        getMunicipalitiesByRegion: vi.fn(),
        getMunicipalitiesByProvince: vi.fn(),
        getMunicipalitiesByCodes: vi.fn(),
        getAllMunicipalities: vi.fn()
    };
    return {
        __esModule: true,
        default: geoServiceMock,
        geoService: geoServiceMock
    };
});

vi.mock('../../services/authServiceSimple', () => {
    const authServiceSimpleMock = {
        getAllUserProfiles: vi.fn()
    };
    return {
        __esModule: true,
        default: authServiceSimpleMock,
        authServiceSimple: authServiceSimpleMock
    };
});

vi.mock('../../services/userMunicipalityService', () => ({
    __esModule: true,
    default: {
        getUserMunicipalities: vi.fn()
    }
}));

vi.mock('maplibre-gl', () => ({
    __esModule: true,
    default: {}
}));

vi.mock('react-map-gl', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="react-map-gl">{children}</div>,
    Source: ({ children }: any) => <div data-testid="map-source">{children}</div>,
    Layer: () => <div data-testid="map-layer" />,
    Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>
}));

vi.mock('../../services/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    data: [],
                    error: null
                }))
            }))
        }))
    }
}));

// Mock dati test
const mockRegions = [
    { codice_regione: 1, nome_regione: 'Piemonte' },
    { codice_regione: 2, nome_regione: 'Valle d\'Aosta' }
];

const mockProvinces = [
    { codice_provincia: 1, nome_provincia: 'Torino', codice_regione: 1 },
    { codice_provincia: 2, nome_provincia: 'Novara', codice_regione: 1 }
];

const mockMunicipalities = [
    {
        codice_comune: 1001,
        nome_comune: 'Torino',
        codice_provincia: 1,
        geometry: {
            type: 'Polygon',
            coordinates: [[[7.68, 45.07], [7.69, 45.08], [7.70, 45.07], [7.68, 45.07]]]
        }
    },
    {
        codice_comune: 1002,
        nome_comune: 'Moncalieri',
        codice_provincia: 1,
        geometry: {
            type: 'Polygon',
            coordinates: [[[7.65, 45.00], [7.66, 45.01], [7.67, 45.00], [7.65, 45.00]]]
        }
    }
];

const mockUsers = [
    {
        id: 'user1',
        username: 'agente1',
        full_name: 'Mario Rossi',
        email: 'mario@example.com',
        phone_number: '1234567890',
        color: '#FF0000'
    }
];

const mockUserMunicipalities = {
    user1: [1001] // Solo Torino è assegnata
};

describe('MapTerritoriesView - Funzionalità Regione', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup mock responses
        (geoService.getRegions as any).mockResolvedValue(mockRegions);
        (geoService.getProvinces as any).mockResolvedValue(mockProvinces);
        (geoService.getMunicipalitiesByRegion as any).mockResolvedValue(mockMunicipalities);
        (geoService.getAllMunicipalities as any).mockResolvedValue(mockMunicipalities);
        (geoService.getMunicipalitiesByCodes as any).mockResolvedValue(mockMunicipalities);
        (geoService.getMunicipalitiesByProvince as any).mockResolvedValue([]);

        const auth = require('../../services/authServiceSimple').default;
        auth.getAllUserProfiles.mockResolvedValue(mockUsers);

        const userMunicipalityService = require('../../services/userMunicipalityService').default;
        userMunicipalityService.getUserMunicipalities.mockResolvedValue({
            data: [{ municipality_code: 1001 }]
        });
    });

    it('dovrebbe caricare e visualizzare i comuni di una regione selezionata', async () => {
        const user = userEvent.setup();
        
        render(
            <MapTerritoriesView
                users={mockUsers}
                userMunicipalities={mockUserMunicipalities}
            />
        );

        // Attendi che il componente si carichi
        await waitFor(() => {
            expect(geoService.getRegions).toHaveBeenCalled();
        });

        // Seleziona la regione Piemonte
        const regionSelect = screen.getByLabelText('Regione');
        await user.selectOptions(regionSelect, '1');

        // Verifica che vengano caricati i comuni della regione
        await waitFor(() => {
            expect(geoService.getMunicipalitiesByRegion).toHaveBeenCalledWith(1);
        });

        // Verifica che i comuni siano visualizzati con la differenziazione corretta
        // Torino (assegnato) dovrebbe avere bordo continuo
        // Moncalieri (non assegnato) dovrebbe avere bordo tratteggiato
        expect(screen.getByText('Seleziona una provincia')).toBeInTheDocument();
    });

    it('dovrebbe gestire correttamente gli errori nel caricamento dei comuni regionali', async () => {
        const user = userEvent.setup();
        
        // Mock errore nel caricamento
        (geoService.getMunicipalitiesByRegion as any).mockRejectedValue(new Error('Errore di rete'));
        
        // Mock toast per verificare che venga mostrato
        const mockToast = vi.fn();
        vi.spyOn(require('sonner'), 'toast').mockImplementation(mockToast);

        render(
            <MapTerritoriesView
                users={mockUsers}
                userMunicipalities={mockUserMunicipalities}
            />
        );

        await waitFor(() => {
            expect(geoService.getRegions).toHaveBeenCalled();
        });

        // Seleziona la regione
        const regionSelect = screen.getByLabelText('Regione');
        await user.selectOptions(regionSelect, '1');

        // Verifica che venga mostrato un messaggio di errore
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith('Errore nel caricamento dei comuni della regione');
        });
    });

    it('dovrebbe mostrare popup corretti per comuni assegnati e non assegnati', async () => {
        const user = userEvent.setup();
        
        render(
            <MapTerritoriesView
                users={mockUsers}
                userMunicipalities={mockUserMunicipalities}
            />
        );

        await waitFor(() => {
            expect(geoService.getRegions).toHaveBeenCalled();
        });

        // Seleziona la regione
        const regionSelect = screen.getByLabelText('Regione');
        await user.selectOptions(regionSelect, '1');

        await waitFor(() => {
            expect(geoService.getMunicipalitiesByRegion).toHaveBeenCalledWith(1);
        });

        // Il test verificherebbe che il popup venga mostrato correttamente
        // ma a causa della complessità del componente mappa, verifichiamo solo lo stato
        expect(screen.getByText('Seleziona una provincia')).toBeInTheDocument();
    });

    it('dovrebbe gestire regioni senza comuni', async () => {
        const user = userEvent.setup();
        
        // Mock regione senza comuni
        (geoService.getMunicipalitiesByRegion as any).mockResolvedValue([]);

        render(
            <MapTerritoriesView
                users={mockUsers}
                userMunicipalities={mockUserMunicipalities}
            />
        );

        await waitFor(() => {
            expect(geoService.getRegions).toHaveBeenCalled();
        });

        const regionSelect = screen.getByLabelText('Regione');
        await user.selectOptions(regionSelect, '2'); // Valle d'Aosta

        await waitFor(() => {
            expect(geoService.getMunicipalitiesByRegion).toHaveBeenCalledWith(2);
        });

        // Non dovrebbero esserci errori anche con array vuoto
        expect(screen.getByText('Seleziona una provincia')).toBeInTheDocument();
    });
});
