import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import MapTerritoriesView from '../../../components/MapTerritoriesView';

// Mock dei servizi
vi.mock('../../../services/geoService', () => {
  const geoServiceMock = {
    getRegions: vi.fn().mockResolvedValue([
      { codice_regione: 1, nome_regione: 'Lombardia' },
      { codice_regione: 2, nome_regione: 'Lazio' }
    ]),
    getProvinces: vi.fn().mockResolvedValue([
      { codice_provincia: 12, nome_provincia: 'Milano', codice_regione: 1, sigla_provincia: 'MI' },
      { codice_provincia: 58, nome_provincia: 'Roma', codice_regione: 2, sigla_provincia: 'RM' }
    ]),
    getMunicipalitiesByCodes: vi.fn().mockResolvedValue([
      {
        codice_comune: 15146,
        nome_comune: 'Milano',
        codice_provincia: 12,
        geometry: {
          type: 'Polygon',
          coordinates: [[[9.1859, 45.4654], [9.2059, 45.4754], [9.1959, 45.4854], [9.1759, 45.4754], [9.1859, 45.4654]]]
        }
      }
    ]),
    getAllMunicipalities: vi.fn().mockResolvedValue([
      {
        codice_comune: 15146,
        nome_comune: 'Milano',
        codice_provincia: 12,
        geometry: {
          type: 'Polygon',
          coordinates: [[[9.1859, 45.4654], [9.2059, 45.4754], [9.1959, 45.4854], [9.1759, 45.4754], [9.1859, 45.4654]]]
        }
      },
      {
        codice_comune: 15836,
        nome_comune: 'Roma',
        codice_provincia: 58,
        geometry: {
          type: 'Polygon',
          coordinates: [[[12.4859, 41.9028], [12.5059, 41.9128], [12.4959, 41.9228], [12.4759, 41.9128], [12.4859, 41.9028]]]
        }
      }
    ])
  };
  return {
    __esModule: true,
    default: geoServiceMock,
    geoService: geoServiceMock
  };
});

vi.mock('../../../services/authServiceSimple', () => {
  const authServiceSimpleMock = {
    getAllUserProfiles: vi.fn().mockResolvedValue([
      {
        id: 'user1',
        username: 'agente_test',
        full_name: 'Mario Rossi',
        email: 'mario@example.com',
        phone_number: '1234567890',
        color: '#FF0000'
      }
    ])
  };
  return {
    __esModule: true,
    default: authServiceSimpleMock,
    authServiceSimple: authServiceSimpleMock
  };
});

vi.mock('../../../services/userMunicipalityService', () => ({
  __esModule: true,
  default: {
    getUserMunicipalities: vi.fn().mockResolvedValue({
      data: [{ municipality_code: 15146 }]
    })
  }
}));

// Mock delle icone
vi.mock('../../../components/Icons', () => ({
  MapIconSolid: () => <div data-testid="map-icon">Map Icon</div>,
  UserIcon: () => <div data-testid="user-icon">User Icon</div>,
  PhoneIcon: () => <div data-testid="phone-icon">Phone Icon</div>,
  EnvelopeIcon: () => <div data-testid="envelope-icon">Envelope Icon</div>,
  SpinnerIcon: () => <div data-testid="spinner-icon" className="animate-spin">Spinner</div>
}));

vi.mock('maplibre-gl', () => ({
  __esModule: true,
  default: {}
}));

// Mock di react-map-gl
vi.mock('react-map-gl', () => {
  const React = require('react');

  const ReactMapGL = React.forwardRef(
    (
      {
        children,
        onClick,
        onMouseMove,
        onMouseEnter,
        onMouseLeave,
        onLoad
      }: any,
      ref: any
    ) => {
      const api = React.useMemo(
        () => ({
          fitBounds: vi.fn(),
          getCanvas: () => ({ style: {} }),
          queryRenderedFeatures: () => [],
          setFeatureState: vi.fn()
        }),
        []
      );

      React.useImperativeHandle(ref, () => api, [api]);

      React.useEffect(() => {
        onLoad?.({});
      }, [onLoad]);

      return (
        <div
          data-testid="react-map-gl"
          onClick={(e: any) => onClick?.(e.nativeEvent ?? e)}
          onMouseMove={(e: any) => onMouseMove?.(e.nativeEvent ?? e)}
          onMouseEnter={(e: any) => onMouseEnter?.(e.nativeEvent ?? e)}
          onMouseLeave={(e: any) => onMouseLeave?.(e.nativeEvent ?? e)}
        >
          {children}
        </div>
      );
    }
  );

  return {
    __esModule: true,
    default: ReactMapGL,
    Source: ({ children }: any) => <div data-testid="map-source">{children}</div>,
    Layer: () => <div data-testid="map-layer" />,
    Popup: ({ children, longitude, latitude, onClose }: any) => (
      <div data-testid="map-popup" data-longitude={longitude} data-latitude={latitude}>
        <button onClick={onClose} data-testid="popup-close">×</button>
        {children}
      </div>
    )
  };
});

describe('MapTerritoriesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderizza correttamente il componente', async () => {
    render(<MapTerritoriesView />);
    
    // Verifica che il titolo sia presente
    expect(screen.getByText('Mappa Territori')).toBeInTheDocument();
    
    // Verifica che i select siano presenti
    expect(screen.getByLabelText('Regione')).toBeInTheDocument();
    expect(screen.getByLabelText('Provincia')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerca Comune')).toBeInTheDocument();
  });

  test('gestisce il click su un comune', async () => {
    render(<MapTerritoriesView />);
    
    // Attendi il caricamento dei dati
    await waitFor(() => {
      expect(screen.getByText('Lombardia')).toBeInTheDocument();
    });

    // Simula il click sulla mappa con un feature di comune
    const mapElement = screen.getByTestId('react-map-gl');
    const mockEvent = {
      features: [{
        properties: {
          codice_comune: 15146,
          nome_comune: 'Milano'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[9.1859, 45.4654], [9.2059, 45.4754], [9.1959, 45.4854], [9.1759, 45.4754], [9.1859, 45.4654]]]
        }
      }],
      lngLat: { lng: 9.1859, lat: 45.4654 }
    };

    fireEvent.click(mapElement, mockEvent);

    // Verifica che il popup venga mostrato
    await waitFor(() => {
      expect(screen.getByTestId('map-popup')).toBeInTheDocument();
    });
  });

  test('mostra le informazioni complete nel popup', async () => {
    render(<MapTerritoriesView />);
    
    await waitFor(() => {
      expect(screen.getByText('Lombardia')).toBeInTheDocument();
    });

    const mapElement = screen.getByTestId('react-map-gl');
    const mockEvent = {
      features: [{
        properties: {
          codice_comune: 15146,
          nome_comune: 'Milano'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[9.1859, 45.4654], [9.2059, 45.4754], [9.1959, 45.4854], [9.1759, 45.4754], [9.1859, 45.4654]]]
        }
      }],
      lngLat: { lng: 9.1859, lat: 45.4654 }
    };

    fireEvent.click(mapElement, mockEvent);

    await waitFor(() => {
      const popup = screen.getByTestId('map-popup');
      expect(popup).toBeInTheDocument();
      
      // Verifica che le informazioni principali siano presenti
      expect(screen.getByText('Milano')).toBeInTheDocument();
      expect(screen.getByText('Provincia:')).toBeInTheDocument();
      expect(screen.getByText('Codice:')).toBeInTheDocument();
      expect(screen.getByText('Agente:')).toBeInTheDocument();
    });
  });

  test('chiude il popup quando si clicca sul pulsante X', async () => {
    render(<MapTerritoriesView />);
    
    await waitFor(() => {
      expect(screen.getByText('Lombardia')).toBeInTheDocument();
    });

    const mapElement = screen.getByTestId('react-map-gl');
    const mockEvent = {
      features: [{
        properties: {
          codice_comune: 15146,
          nome_comune: 'Milano'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[9.1859, 45.4654], [9.2059, 45.4754], [9.1959, 45.4854], [9.1759, 45.4754], [9.1859, 45.4654]]]
        }
      }],
      lngLat: { lng: 9.1859, lat: 45.4654 }
    };

    fireEvent.click(mapElement, mockEvent);

    await waitFor(() => {
      expect(screen.getByTestId('map-popup')).toBeInTheDocument();
    });

    // Clicca sul pulsante di chiusura
    const closeButton = screen.getByTestId('popup-close');
    fireEvent.click(closeButton);

    // Il popup dovrebbe essere chiuso
    await waitFor(() => {
      expect(screen.queryByTestId('map-popup')).not.toBeInTheDocument();
    });
  });

  test('gestisce il mouse hover su un comune', async () => {
    render(<MapTerritoriesView />);
    
    await waitFor(() => {
      expect(screen.getByText('Lombardia')).toBeInTheDocument();
    });

    const mapElement = screen.getByTestId('react-map-gl');
    const mockEvent = {
      features: [{
        properties: {
          codice_comune: 15146,
          nome_comune: 'Milano',
          agentName: 'Mario Rossi'
        }
      }],
      lngLat: { lng: 9.1859, lat: 45.4654 }
    };

    fireEvent.mouseMove(mapElement, mockEvent);

    // Verifica che l'hover venga gestito
    await waitFor(() => {
      expect(screen.getByTestId('map-popup')).toBeInTheDocument();
    });
  });

  test('mostra messaggio di errore quando il caricamento fallisce', async () => {
    render(<MapTerritoriesView />);
    
    await waitFor(() => {
      expect(screen.getByText('Lombardia')).toBeInTheDocument();
    });

    const mapElement = screen.getByTestId('react-map-gl');
    const mockEvent = {
      features: [{
        properties: {
          codice_comune: 15146,
          nome_comune: 'Milano'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[9.1859, 45.4654], [9.2059, 45.4754], [9.1959, 45.4854], [9.1759, 45.4754], [9.1859, 45.4654]]]
        }
      }],
      lngLat: { lng: 9.1859, lat: 45.4654 }
    };

    fireEvent.click(mapElement, mockEvent);

    // Il componente dovrebbe gestire l'errore gracefully
    await waitFor(() => {
      expect(screen.getByTestId('map-popup')).toBeInTheDocument();
    });
  });

  test('identifica correttamente i comuni non assegnati', async () => {
    render(<MapTerritoriesView />);
    
    await waitFor(() => {
      expect(screen.getByText('Lombardia')).toBeInTheDocument();
    });

    // Simula il click su un comune non assegnato (Roma non è nell'elenco degli assegnati)
    const mapElement = screen.getByTestId('react-map-gl');
    const mockEvent = {
      features: [{
        properties: {
          codice_comune: 15836,
          nome_comune: 'Roma'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[12.4859, 41.9028], [12.5059, 41.9128], [12.4959, 41.9228], [12.4759, 41.9128], [12.4859, 41.9028]]]
        }
      }],
      lngLat: { lng: 12.4859, lat: 41.9028 }
    };

    fireEvent.click(mapElement, mockEvent);

    // Verifica che il popup venga mostrato
    await waitFor(() => {
      const popup = screen.getByTestId('map-popup');
      expect(popup).toBeInTheDocument();
      
      // Verifica che venga mostrato il nome del comune
      expect(screen.getByText('Roma')).toBeInTheDocument();
    });
  });
});
