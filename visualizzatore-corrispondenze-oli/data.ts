import { CorrespondenceRow, RawProductData } from './types';

const rawProductData: RawProductData[] = [
  // --- CASTROL ---
  // PCMO CASTROL
  { brand: 'Castrol', product: 'EDGE 0W-20 LL VI', sae: '0W-20', roloil: 'PODIUM V', q8: 'F.V BLUE', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 0W-20 V', sae: '0W-20', roloil: 'PODIUM-FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 0W-30', sae: '0W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 0W-40 (C3; SN)', sae: '0W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 0W-40 (A3/B4; CF)', sae: '0W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 5W-30 C3', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 5W-30 LL', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 5W-30 M', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE 5W-40', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE PROFESSIONAL E', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE SUPERCAR', sae: '10W-60', roloil: 'RACING 10W-50', q8: '', type: 'PCMO' },
  { brand: 'Castrol', product: 'EDGE TURBODIESEL', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'GTX 15W-40 A3/B3', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Castrol', product: 'GTX 5W-30 MP', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'GTX 5W-40 C3', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'GTX ULTRACLEAN 10W-40 A3/B4', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC 10W-40 A3/B4', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC 5W-30 DX', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC 5W-40 A3/B4', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC 5W-40 C3', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC 5W-40 DPF', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC DIESEL 10W-40 B4', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC STOP-START 0W-30 C2', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC STOP-START 0W-30 D', sae: '0W-30', roloil: 'PODIUM-F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Castrol', product: 'MAGNATEC STOP-START 5W-30 A3/B4', sae: '5W-30', roloil: 'SUPERSYNTHETIC FE', q8: 'F.ELITE', type: 'PCMO' },

  // HDDO CASTROL
  { brand: 'Castrol', product: 'CRB MULTI (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Castrol', product: 'CRB MULTI (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Castrol', product: 'Vecton (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },

  // GEAR TRANSMISSION CASTROL
  { brand: 'Castrol', product: 'Axle Z Limited Slip', sae: '90', roloil: 'VARIAX 90 LS', q8: 'T 45', type: 'Gear Transmission' },

  // --- ENI ---
  // PCMO ENI
  { brand: 'Eni', product: 'Gas Special 10W-40', sae: '10W-40', roloil: 'SUPERSINTHETIC GAS', q8: '', type: 'PCMO' },
  { brand: 'Eni', product: 'i-Base (15W-40)', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.Rallye', type: 'PCMO' },
  { brand: 'Eni', product: 'i-Base (20W-50)', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '', type: 'PCMO' },
  { brand: 'Eni', product: 'i-Base Professional (15W-40)', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.Rallye', type: 'PCMO' },
  { brand: 'Eni', product: 'i-Base Professional (10W-40)', sae: '10W-40', roloil: 'SYNT XPR', q8: 'TOURING MG SYNT', type: 'PCMO' },
  { brand: 'Eni', product: 'i-Base Professional L', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint (5W-30)', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint (10W-40)', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F. TOP', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint (0W-20)', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Bio Tech', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint FE', sae: '5W-30', roloil: 'PODIUM B', q8: 'F.SPECIAL FE 0W-30', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint MS (5W-30)', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint MS (5W-40)', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Professional (10W-30)', sae: '10W-30', roloil: 'SUPERSINTHETIC-FE', q8: 'F.Elite', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Professional (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Professional (10W-40)', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Professional (20W-50)', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Professional MS', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint TD (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint TD (10W-40)', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Tech F (0W-30)', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Tech G', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.Special G LL', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Tech P (0W-30)', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.Elite C2', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Tech VK (0W-20)', sae: '0W-20', roloil: 'PODIUM V', q8: 'F.V BLUE', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Tech VK (0W-30)', sae: '0W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint Tech VV', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Eni', product: 'I-Sint XEF', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  // HDDO ENI
  { brand: 'Eni', product: 'i-Sigma Bio Tech', sae: '10W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Performance CMS', sae: '15W-40', roloil: 'DOLOMITI TX7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Performance E3 (15W-40)', sae: '15W-40', roloil: 'DOLOMITI T', q8: 'T 720 D', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Performance E3 (20W-50)', sae: '20W-50', roloil: 'DOLOMITI T', q8: '------', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Performance E4', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Performance E7', sae: '15W-40', roloil: 'DOLOMITI TX7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Special TMS', sae: '5W-30', roloil: 'ROADSTAR LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma top (5W-30)', sae: '5W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma top (10W-40)', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma top MS (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma top MS (10W-40)', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma top MS (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Universal (10W-40)', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', q8: 'T 800', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Universal (15W-40)', sae: '15W-40', roloil: 'DOLOMITI SUPER', q8: 'T 520', type: 'HDDO' },
  { brand: 'Eni', product: 'i-Sigma Universal (20W-50)', sae: '20W-50', roloil: 'DOLOMITI T', q8: '------', type: 'HDDO' },

  // GEAR TRANSMISSION ENI
  { brand: 'Eni', product: 'ROTRA (80W-90)', sae: '80W-90', roloil: 'VARIAX 90 AZ', q8: 'ZC 90', type: 'Gear Transmission' },
  { brand: 'Eni', product: 'ROTRA (140)', sae: '140', roloil: 'VARIAX 140', q8: '------', type: 'Gear Transmission' },
  { brand: 'Eni', product: 'ROTRA MP (80W-90)', sae: '80W-90', roloil: 'VARIAX EP 80W-90', q8: 'T 55 80W-90', type: 'Gear Transmission' },
  { brand: 'Eni', product: 'ROTRA MP (85W-140)', sae: '85W-140', roloil: 'VARIAX EP 85W-140', q8: 'T 55 85W-140', type: 'Gear Transmission' },
  { brand: 'Eni', product: 'ROTRA MP DB', sae: '85W-90', roloil: 'VARIAX EP 80W-90', q8: 'T 55 80W-90', type: 'Gear Transmission' },

  // --- FUCHS ---
  // PCMO FUCHS
  { brand: 'Fuchs', product: 'Titan Formula (15W-40)', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Formula SAE 10W-40', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Formula SAE 20W-50', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 5W-40', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 FLEX 23 (5W-30 C2/C3; SN)', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LONGLIFE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 FLEX 23 (5W-30 C2/C3; SP)', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 FLEX 3', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 FLEX 5', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 LL-12 FE', sae: '0W-30', roloil: 'PODIUM B', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 LL-III', sae: '0W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 LL-IV', sae: '0W-20', roloil: 'PODIUM V', q8: 'F.V BLUE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 PRO 2312', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2 0W-30', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 PRO C3', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT 1 PRO V', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan GT SAE 20W-50', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '', type: 'PCMO' },
  { brand: 'Fuchs', product: 'TITAN RACE PRO S (10W-50)', sae: '10W-50', roloil: 'RACING 10W-50', q8: '', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Supersyn (5W-30)', sae: '5W-30', roloil: 'SUPERSYNTHETIC FE', q8: 'F.ELITE', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Supersyn (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Supersyn F ECO-FE', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Supersyn LL (0W-40)', sae: '0W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Supersyn LL (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan SYN MC', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Fuchs', product: 'Titan Universal HD', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  // HDDO FUCHS
  { brand: 'Fuchs', product: 'Titan Cargo', sae: '10W-30', roloil: 'DOLOMITI WMT 10W-30', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Fuchs', product: 'Titan Cargo LD-4', sae: '5W-30', roloil: 'ROADSTAR-LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Fuchs', product: 'Titan Cargo Maxx (10W-40)', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  { brand: 'Fuchs', product: 'Titan Cargo MC', sae: '10W-40', roloil: 'ROADSTAR', q8: 'T 860', type: 'HDDO' },
  { brand: 'Fuchs', product: 'Titan Cargo Pro Gas (10W-40)', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Fuchs', product: 'Titan Cargo Pro Gas (5W-30)', sae: '5W-30', roloil: 'ROADSTAR-LA', q8: 'FT 8700', type: 'HDDO' },
  // GEAR TRANSMISSION FUCHS
  { brand: 'Fuchs', product: 'TITAN SUPERGEAR MC 80W-140', sae: '80W-140', roloil: 'VARIASYNT EP', q8: 'AXLE OIL XG', type: 'Gear Transmission' },
  { brand: 'Fuchs', product: 'TITAN SUPERGEAR (80W-90)', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Fuchs', product: 'TITAN SUPERGEAR (85W-140)', sae: '85W-140', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Fuchs', product: 'TITAN GEAR LS', sae: '85W-90', roloil: 'VARIAX 90 LS', q8: 'T 45', type: 'Gear Transmission' },
  { brand: 'Fuchs', product: 'TITAN GEAR HYP', sae: '85W-90', roloil: 'VARIAX EP 80W-90', q8: 'T 55 80W-90', type: 'Gear Transmission' },

  // --- IP ---
  // PCMO IP
  { brand: 'IP', product: 'MULTIMOTOR (15W-40)', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F. RALLYE', type: 'PCMO' },
  { brand: 'IP', product: 'MULTIMOTOR (20W-50)', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '------', type: 'PCMO' },
  { brand: 'IP', product: 'SIMTIAX EXCLUSIVE 505', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'IP', product: 'SIMTIAX EXCLUSIVE 507', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'IP', product: 'SUPER PLUS M.O.', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F. RALLYE', type: 'PCMO' },
  { brand: 'IP', product: 'SYNTIAX SUPER', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'IP', product: 'SYNTIAX SX', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  // HDDO IP
  { brand: 'IP', product: 'AXIA D (MONO)', sae: 'MONO', roloil: 'STELVIO', q8: 'T 400', type: 'HDDO' },
  { brand: 'IP', product: 'AXIA D (10W-20)', sae: '10W-20', roloil: 'STELVIO', q8: 'T 400', type: 'HDDO' },
  { brand: 'IP', product: 'Geo Uno', sae: '15W-40', roloil: 'SUPERTRACTOR', q8: 'T 5000 D', type: 'HDDO' },
  { brand: 'IP', product: 'Super Axia Plus (15W-40)', sae: '15W-40', roloil: 'DOLOMITI SUPER HD TURBO', q8: 'T 750', type: 'HDDO' },
  { brand: 'IP', product: 'Super Axia Plus (20W-50)', sae: '20W-50', roloil: 'DOLOMITI T', q8: '------', type: 'HDDO' },
  { brand: 'IP', product: 'Tarus Turbo Extra (15W-40)', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'IP', product: 'Tarus Turbo Extra (20W-50)', sae: '20W-50', roloil: 'DOLOMITI T', q8: '------', type: 'HDDO' },
  { brand: 'IP', product: 'Tarus Turbo One', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'IP', product: 'Tarus Turbo Plus', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'IP', product: 'Tarus Turbo Synthetic', sae: '5W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'IP', product: 'Tarus Turbo Ultra', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  // GEAR TRANSMISSION IP
  { brand: 'IP', product: 'PONTIAX FZG (80W-90)', sae: '80W-90', roloil: 'VARIAX 90 AZ', q8: 'ZC 90', type: 'Gear Transmission' },
  { brand: 'IP', product: 'PONTIAX HD (80W-90)', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'IP', product: 'PONTIAX HD (85W-140)', sae: '85W-140', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'IP', product: 'PONTIAX LS', sae: '85W-90', roloil: 'VARIAX 90 LS', q8: 'T 45', type: 'Gear Transmission' },

  // --- MOBIL ---
  // PCMO MOBIL
  { brand: 'Mobil', product: 'MOBIL 1 (0W-20)', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Mobil', product: 'MOBIL 1 ESP (5W-30)', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Mobil', product: 'MOBIL 1 ESP X2', sae: '0W-20', roloil: 'PODIUM V 0W-20', q8: 'F.V BLUE', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 1000 X1', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 2000 Formula P', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 2000 X1', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 3000 Formula F (0W-30)', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 3000 Formula P (0W-30)', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 3000 Formula V', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Mobil', product: 'SUPER 3000 XE', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  // HDDO MOBIL
  { brand: 'Mobil', product: 'DELVAC 1', sae: '5W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC 1 ESP', sae: '5W-40', roloil: 'DOLOMITI WMT 4.5 10W-40', q8: 'FT 7000 10W-40', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC 1 SHC', sae: '5W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC 1240', sae: '40', roloil: 'STELVIO', q8: 'T 400', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC CITY LOGISTIC M', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC CITY LOGISTIC V', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC HD', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC LIGHT COMM. V. E', sae: '10W-40', roloil: 'SUPERSYNTHETIC 10W-40', q8: 'F.TOP', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC MX', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC MX ESP (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC MX ESP (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC MX EXTRA', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', q8: 'T 800', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP ESP (10W-40)', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP ESP M', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP EXTRA', sae: '10W-40', roloil: 'ROADSTAR S', q8: '------', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP LE', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP ULTRA', sae: '5W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP ULTRA LE', sae: '5W-30', roloil: 'ROADSTAR LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Mobil', product: 'DELVAC XHP ULTRA LE SCA', sae: '5W-30', roloil: 'ROADSTAR LA', q8: 'FT 8700', type: 'HDDO' },
  // GEAR TRANSMISSION MOBIL
  { brand: 'Mobil', product: 'MOBILUBE HD (80W-90)', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Mobil', product: 'MOBILUBE HD (85W-140)', sae: '85W-140', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Mobil', product: 'SYNTHETIC GEAR OIL', sae: '75W-90', roloil: 'VARIASYNT EP', q8: 'T 56', type: 'Gear Transmission' },

  // --- MOTUL ---
  // PCMO MOTUL
  { brand: 'Motul', product: '4000 Motion (15W-40)', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Motul', product: '4000 Motion (15W-50)', sae: '15W-50', roloil: 'SUPERMULTIGRADE 20W-50', q8: '------', type: 'PCMO' },
  { brand: 'Motul', product: '4100 Power', sae: '15W-50', roloil: 'SUPERMULTIGRADE 20W-50', q8: '------', type: 'PCMO' },
  { brand: 'Motul', product: '6100 SYN-clean (5W-40)', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Motul', product: '6100 SYN-clean (5W-30)', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F. SPECIAL G LL', type: 'PCMO' },
  { brand: 'Motul', product: '6100 Synergie +', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Motul', product: '6100 SYN-nergy', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Motul', product: '8100 Eco-clean (0W-20)', sae: '0W-20', roloil: 'PODIUM-FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Motul', product: '8100 Eco-clean (0W-30)', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO FE', type: 'PCMO' },
  { brand: 'Motul', product: '8100 Eco-lite (0W-20)', sae: '0W-20', roloil: 'PODIUM-FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Motul', product: '8100 X-cess gen2', sae: '5W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Motul', product: '8100 X-clean EFE', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Motul', product: '8100 X-clean gen2', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Motul', product: '8100 X-clean+', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Motul', product: '8100 X-max (0W-40)', sae: '0W-40', roloil: 'PODIUM', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC 229.52', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC 2312', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2 0W-30', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC 504.00; 507.00 (5W-30)', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC 505.01 502.00', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC 508.00 509.00', sae: '0W-20', roloil: 'PODIUM V', q8: 'F.V BLUE', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC CNG/LPG', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC DEXOS 2', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC LL-04', sae: '5W-40', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Motul', product: 'SPECIFIC RBSO-2AE', sae: '0W-20', roloil: 'PODIUM FE', q8: 'SPECIAL FE', type: 'PCMO' },
  // HDDO MOTUL
  { brand: 'Motul', product: 'DS AGRI SYNT', sae: '10W-40', roloil: 'SUPERTRACTOR', q8: 'T 1000 D', type: 'HDDO' },
  { brand: 'Motul', product: 'DS SUPER AGRI', sae: '15W-40', roloil: 'SUPERTRACTOR', q8: 'T 1000 D', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Futura + (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Futura + (10W-40)', sae: '10W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Mega', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Mega +', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Mega X (10W-40)', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', q8: 'T 800', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Mega X LA', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Norma', sae: '10W', roloil: 'STELVIO', q8: 'T 400', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Norma + (15W-40)', sae: '15W-40', roloil: 'DOLOMITI SUPER HD T.', q8: 'T 520', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Norma + (20W-50)', sae: '20W-50', roloil: 'DOLOMITI T', q8: '------', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Optima', sae: '5W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Supra', sae: '15W-40', roloil: 'DOLOMITI SUPER HD T.', q8: 'T 520', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Ultima', sae: '10W-40', roloil: 'ROADSTAR S', q8: '------', type: 'HDDO' },
  { brand: 'Motul', product: 'Tekma Ultima + (10W-40)', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  // GEAR TRANSMISSION MOTUL
  { brand: 'Motul', product: 'GEAR OIL', sae: '90', roloil: 'VARIAX 90 AZ', q8: 'ZC 90', type: 'Gear Transmission' },
  { brand: 'Motul', product: 'HD (85W-140)', sae: '85W-140', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Motul', product: 'HD (80W-90)', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Motul', product: 'MOTYLGEAR (75W-90)', sae: '75W-90', roloil: 'VARIASYNT', q8: 'T 56', type: 'Gear Transmission' },
  { brand: 'Motul', product: 'TRANS MB', sae: '85W-90', roloil: 'VARIAX 90 LS', q8: 'T 45', type: 'Gear Transmission' },

  // --- PETRONAS ---
  // PCMO PETRONAS
  { brand: 'Petronas', product: 'OLIOFIAT', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA 20K', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA ABARTH (10W-50)', sae: '10W-50', roloil: 'RACING', q8: '------', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA ALFA', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA DIGITEK PURE ENERGY', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA ECO2', sae: '0W-20', roloil: 'PODIUM-FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA K', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA K P.E.', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA MULTIPOWER C3', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA MULTIPOWER GAS', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA STAR', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA STAR PURE ENERGY', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA TURBO DIESEL', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA WR', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SELENIA WR FORWARD (0W-30)', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 3000 AV', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 3000 E', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 5000 AV', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 5000 XS', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 7000 (0W-20)', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 7000 DM', sae: '0W-30', roloil: 'STELVIO', q8: 'T 400', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 7000 E', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 7000 LL', sae: '0W-20', roloil: 'PODIUM-FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 800', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Petronas', product: 'SYNTIUM 800 EU', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Petronas', product: 'VS+', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  // HDDO PETRONAS
  { brand: 'Petronas', product: 'URANIA 100K', sae: '10W-40', roloil: 'ROADSTAR-FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA 3000 E', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', q8: 'T 800', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA 500', sae: '10W', roloil: 'STELVIO', q8: 'T 400', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA 5000 E (10W-40)', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA 5000 F', sae: '5W-30', roloil: 'ROADSTAR-FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA 800', sae: '15W-40', roloil: 'SELLA', q8: 'T 400', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA DAILY FE', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2 0W-30', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA DAILY TEK', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2 0W-30', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA ECOSYNTH', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA ECOTECH', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA FE', sae: '5W-30', roloil: 'ROADSTAR-FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA LD7', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA LD9', sae: '10W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA MAXIMO', sae: '5W-30', roloil: 'ROADSTAR-FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA OPTIMO', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Petronas', product: 'URANIA SUPREMO', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  // GEAR TRANSMISSION PETRONAS
  { brand: 'Petronas', product: 'TUTELA GEAR', sae: '75W-90', roloil: 'VARIASYNT EP', q8: 'T 56', type: 'Gear Transmission' },
  { brand: 'Petronas', product: 'TUTELA TRANSM. W 90 LA', sae: '80W-90', roloil: 'VARIAX EP 80W-90', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Petronas', product: 'TUTELA TRANSM. W 90 LS', sae: '80W-90', roloil: 'VARIAX 90 LS', q8: 'T 45', type: 'Gear Transmission' },
  { brand: 'Petronas', product: 'TUTELA TRANSM. W140 M-DA', sae: '85W-140', roloil: 'VARIAX EP 85W-140', q8: 'T 55 85W-140', type: 'Gear Transmission' },
  { brand: 'Petronas', product: 'TUTELA TRANSM. W90 M-DA', sae: '80W-90', roloil: 'VARIAX EP 80W-90', q8: 'T 55 80W-90', type: 'Gear Transmission' },
  { brand: 'Petronas', product: 'TUTELA ZC 90', sae: '80W-90', roloil: 'VARIAX 90 AZ', q8: 'ZC 90', type: 'Gear Transmission' },

  // --- REPSOL ---
  // PCMO REPSOL
  { brand: 'Repsol', product: 'Autogas (5W-30)', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Autogas (5W-40)', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Autogas (20W-50)', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '------', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite 50501 TDI', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Common Rail', sae: '5W-30', roloil: 'SUPERSYNTHETIC', q8: 'F.ELITE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Competición', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Cosmos High Performance (5W-40)', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Evolution', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Evolution ECO F (0W-30)', sae: '0W-30', roloil: 'PODIUM F', q8: 'F.TECHNO ECO', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Evolution ECO V', sae: '0W-20', roloil: 'PODIUM V', q8: 'F.V BLUE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Evolution Long Life', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Evolution Power 2', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F.ELITE C2', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Evolution VCC', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Injection', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Inyección', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Long Life 50700/50400', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Multiválvulas', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite Super', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Elite TDI', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Premium GTI/TDI (10W-40)', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Repsol', product: 'Premium GTI/TDI (15W-40)', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Repsol', product: 'Premium Tech (5W-30)', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Repsol', product: 'Premium Tech (5W-40)', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  // HDDO REPSOL
  { brand: 'Repsol', product: 'RP DIESEL HIGH MILEAGE', sae: '25W-60', roloil: 'DOLOMITI T 20W-50', q8: '------', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL MULTI G', sae: '15W-40', roloil: 'DOLOMITI SUPER HD T.', q8: 'T 520', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL MULTITURBO', sae: '25W-50', roloil: 'DOLOMITI T 20W-50', q8: '------', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL SERIE 3 (30)', sae: '30', roloil: 'STELVIO 30', q8: 'T 400', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL SERIE 3 (40)', sae: '40', roloil: 'STELVIO 40', q8: 'T 400', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL SUPER TURBO SHPD', sae: '15W-40', roloil: 'DOLOMITI T', q8: 'T 720 D', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO THPD (10W-40)', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', q8: 'T 800', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO THPD (15W-40)', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO THPD MID SAPS (10W-30)', sae: '10W-30', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO THPD MID SAPS (15W-40)', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO UHPD', sae: '10W-40', roloil: 'ROADSTAR S', q8: '------', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO UHPD MID SAPS', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIES.T.UHPD MID SAPS URBAN', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO UHPD URBAN', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO VHPD', sae: '5W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTR. FE', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIESEL TURBO VHPD MID SAPS', sae: '5W-30', roloil: 'ROADSTAR-LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP DIES.T.VHPD MID SAPS URBAN', sae: '5W-30', roloil: 'ROADSTAR-LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP MIXFLEET (15W-40)', sae: '15W-40', roloil: 'DOLOMITI SUPER HD T.', q8: 'T 520', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP MIXFLEET (20W-50)', sae: '20W-50', roloil: 'DOLOMITI T 20W-50', q8: '------', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP TURBOGRADO (15W-40)', sae: '15W-40', roloil: 'DOLOMITI T', q8: 'T 720 D', type: 'HDDO' },
  { brand: 'Repsol', product: 'RP TURBOGRADO (20W-40)', sae: '20W-40', roloil: 'DOLOMITI SUPER HD T.', q8: 'T 520', type: 'HDDO' },
  // GEAR TRANSMISSION REPSOL
  { brand: 'Repsol', product: 'CARTAGO LD (85W-140)', sae: '85W-140', roloil: 'VARIASYNT EP', q8: 'AXLE OIL XG', type: 'Gear Transmission' },
  { brand: 'Repsol', product: 'CARTAGO MULTIGRADO EP (80W-90)', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Repsol', product: 'CARTAGO MULTIGRADO EP (85W-140)', sae: '85W-140', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  
  // --- SHELL ---
  // PCMO SHELL
  { brand: 'Shell', product: 'Shell Helix HX3', sae: '20W-50', roloil: 'SUPERMULTIGRADE', q8: '------', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX5 SN', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F.RALLYE', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX6', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX7 (5W-40)', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX7 (10W-40)', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F.TOP', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX7 ECT', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F.M LL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX7 Pro AV', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix HX8 Synthetic', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra 5W-30', sae: '5W-30', roloil: 'SUPERSYNTHETIC', q8: 'F.ELITE', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra 5W-40', sae: '5W-40', roloil: 'PODIUM 5W-40', q8: 'F.EXCEL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra ECT C2/C3', sae: '0W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra ECT C3', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra Pro AG', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra Pro AM-L', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F.SPECIAL G LL', type: 'PCMO' },
  { brand: 'Shell', product: 'Shell Helix Ultra Pro AV-L', sae: '0W-30', roloil: 'PODIUM V GOLD', q8: 'F.PRESTIGE V', type: 'PCMO' },
  // HDDO SHELL
  { brand: 'Shell', product: 'Rimula R4 L', sae: '15W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula R4 X', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula R5 E', sae: '10W-40', roloil: 'DOLOMITI T SYNT 7', q8: 'T 800', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula R5 LE', sae: '10W-40', roloil: 'DOLOMITI WMT 4.5', q8: 'FT 7000', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula R6 LM', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula R6 LME', sae: '5W-30', roloil: 'ROADSTAR-LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula R6 M', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Shell', product: 'Rimula Ultra', sae: '5W-30', roloil: 'ROADSTAR-LA', q8: 'FT 8700', type: 'HDDO' },
  // GEAR TRANSMISSION SHELL
  { brand: 'Shell', product: 'Spirax S2 A', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Shell', product: 'Spirax S2 ALS', sae: '90', roloil: 'VARIAX 90 LS', q8: 'T 45', type: 'Gear Transmission' },

  // --- TOTAL ---
  // PCMO TOTAL
  { brand: 'Total', product: 'CLASSIC 5', sae: '15W-40', roloil: 'SUPERMULTIGRADE', q8: 'F. RALLYE', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 7', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F. TOP', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 9 (0W-30)', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F. ELITE C2 0W-30', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 9 (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F. EXCEL', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 9 C2/C3', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F. SPECIAL G LL', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 9 C3 (5W-30)', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F. SPECIAL G LL', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 9 C3 (5W-40)', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F. M LL', type: 'PCMO' },
  { brand: 'Total', product: 'CLASSIC 9 LL', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F. PRESTIGE V', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 7000', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F. TOP', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 7000 ENERGY', sae: '10W-40', roloil: 'SUPERSYNTHETIC', q8: 'F. TOP', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 9000', sae: '5W-40', roloil: 'PODIUM', q8: 'F. EXCEL', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 9000 DID', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F. SPECIAL G LL', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 9000 ENERGY (0W-30)', sae: '0W-30', roloil: 'SUPERSYNTHETIC 5W-30', q8: 'F. ELITE', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 9000 ENERGY (5W-30)', sae: '5W-30', roloil: 'SUPERSYNTHETIC 5W-30', q8: 'F. ELITE', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ 9000 ENERGY (5W-40)', sae: '5W-40', roloil: 'PODIUM', q8: 'F. EXCEL', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO C3', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F. M LL', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO FDE', sae: '0W-30', roloil: 'PODIUM F', q8: 'F. TECHNO ECO', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO FGO', sae: '5W-40', roloil: 'PODIUM PLATINUM', q8: 'F. M LL', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO FIRST', sae: '0W-30', roloil: 'PODIUM C2', q8: 'F. ELITE C2 0W-30', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO LONG LIFE (0W-20)', sae: '0W-20', roloil: 'PODIUM V', q8: 'F. V BLUE', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO LONG LIFE (0W-30)', sae: '0W-30', roloil: 'PODIUM V GOLD', q8: 'F. PRESTIGE V', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO LONG LIFE (5W-30)', sae: '5W-30', roloil: 'PODIUM V GOLD', q8: 'F. PRESTIGE V', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO MC3', sae: '5W-30', roloil: 'PODIUM BM', q8: 'F. SPECIAL G LL', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO XTRA DYNAMICS', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE OW-20', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO XTRA EC5', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE OW-20', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO XTRA LONG LIFE', sae: '0W-20', roloil: 'PODIUM V', q8: 'F. V BLUE', type: 'PCMO' },
  { brand: 'Total', product: 'QUARTZ INEO XTRA V-DRIVE', sae: '0W-20', roloil: 'PODIUM FE', q8: 'F.SPECIAL FE OW-20', type: 'PCMO' },
  // HDDO TOTAL
  { brand: 'Total', product: 'RUBIA TIR 7200 FE', sae: '15W-30', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Total', product: 'RUBIA TIR 7400', sae: '15W-40', roloil: 'DOLOMITI TX 7', q8: 'T 750', type: 'HDDO' },
  { brand: 'Total', product: 'RUBIA TIR 8600', sae: '10W-40', roloil: 'ROADSTAR 10W-40', q8: 'T 860', type: 'HDDO' },
  { brand: 'Total', product: 'RUBIA TIR 8900', sae: '10W-40', roloil: 'ROADSTAR 6', q8: 'FT 8500', type: 'HDDO' },
  { brand: 'Total', product: 'RUBIA TIR 8900 FE', sae: '10W-30', roloil: 'ROADSTAR LA', q8: 'FT 8700', type: 'HDDO' },
  { brand: 'Total', product: 'RUBIA TIR 9200 FE', sae: '5W-30', roloil: 'ROADSTAR FE', q8: 'SUPERTRUCK FE', type: 'HDDO' },
  { brand: 'Total', product: 'RUBIA TIR 9900', sae: '10W-40', roloil: 'ROADSTAR GF', q8: 'FT 8600', type: 'HDDO' },
  // GEAR TRANSMISSION TOTAL
  { brand: 'Total', product: 'TRAXIUM AXLE 7 (80W-90)', sae: '80W-90', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Total', product: 'TRAXIUM AXLE 7 (85W-140)', sae: '85W-140', roloil: 'VARIAX EP', q8: 'T 55', type: 'Gear Transmission' },
  { brand: 'Total', product: 'TRAXIUM DUAL 8 FE (80W-140)', sae: '80W-140', roloil: 'VARIASYNT EP', q8: 'AXLE OIL XG', type: 'Gear Transmission' },
];

function processRawData(data: RawProductData[]): CorrespondenceRow[] {
  // Map to store intermediate data, including a Set for SAEs
  const correspondenceMap = new Map<string, Omit<CorrespondenceRow, 'sae'> & { saes: Set<string> }>();

  data.forEach(item => {
    if (!item.roloil || ['---', '-------', ''].includes(item.roloil.trim())) return;
    
    const sae = item.sae?.trim();
    if (!sae || ['---', '-------', ''].includes(sae)) return; // Skip if no SAE

    const roloilKey = item.roloil.trim();
    if (!correspondenceMap.has(roloilKey)) {
      correspondenceMap.set(roloilKey, { 
        roloil: roloilKey, 
        type: item.type,
        saes: new Set<string>() 
      });
    }

    const entry = correspondenceMap.get(roloilKey)!;
    
    entry.saes.add(sae);

    if (item.brand !== 'Q8') {
        entry[item.brand] = item.product;
    }
    
    if (item.q8 && !['---', '-------', ''].includes(item.q8.trim())) {
      entry.Q8 = item.q8;
    }
  });
  
  const processedList = Array.from(correspondenceMap.values()).map(entry => {
      const { saes, ...rest } = entry;
      return {
          ...rest,
          sae: Array.from(saes).sort().join(' / ')
      };
  });

  return processedList.sort((a, b) => a.roloil.localeCompare(b.roloil));
}


export const correspondenceData: CorrespondenceRow[] = processRawData(rawProductData);