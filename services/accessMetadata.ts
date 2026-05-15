export interface AccessMetadata {
  deviceInfo: string;
  userAgent: string;
}

const getDeviceType = (userAgent: string): string => {
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  if (/mobi|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
};

const getOperatingSystem = (userAgent: string, platform: string): string => {
  const source = `${userAgent} ${platform}`.toLowerCase();

  if (source.includes('windows')) return 'Windows';
  if (source.includes('iphone') || source.includes('ipad') || source.includes('ios')) return 'iOS';
  if (source.includes('android')) return 'Android';
  if (source.includes('mac')) return 'macOS';
  if (source.includes('linux')) return 'Linux';

  return 'Sistema sconosciuto';
};

const getBrowser = (userAgent: string): string => {
  if (/edg/i.test(userAgent)) return 'Microsoft Edge';
  if (/opr|opera/i.test(userAgent)) return 'Opera';
  if (/chrome/i.test(userAgent)) return 'Google Chrome';
  if (/firefox/i.test(userAgent)) return 'Mozilla Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';

  return 'Browser sconosciuto';
};

export const getAccessMetadata = (): AccessMetadata => {
  if (typeof navigator === 'undefined') {
    return {
      deviceInfo: 'Dispositivo non disponibile',
      userAgent: 'User agent non disponibile'
    };
  }

  const userAgent = navigator.userAgent || 'User agent non disponibile';
  const platform = navigator.platform || '';
  const browser = getBrowser(userAgent);
  const operatingSystem = getOperatingSystem(userAgent, platform);
  const deviceType = getDeviceType(userAgent);

  return {
    deviceInfo: `${browser} su ${operatingSystem} (${deviceType})`,
    userAgent
  };
};
