import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Divider, Grid, Chip, Button, IconButton, Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import SpeedIcon from '@mui/icons-material/Speed';
import ShareIcon from '@mui/icons-material/Share';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTenantLeases } from '../../hooks/useLeases';
import { leaseApi } from '../../api/leaseApi';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import type { Unit } from '../../types';

const utilityTypeLabels: Record<string, string> = {
  electricity: 'Electricidad',
  gas: 'Gas',
  water: 'Agua',
  condominiumFees: 'Expensas',
  propertyTax: 'Impuesto inmobiliario',
};

const utilityIcons: Record<string, React.ReactNode> = {
  electricity: <ElectricalServicesIcon sx={{ fontSize: 20, color: '#f9a825' }} />,
  gas: <LocalFireDepartmentIcon sx={{ fontSize: 20, color: '#ef5350' }} />,
  water: <WaterDropIcon sx={{ fontSize: 20, color: '#42a5f5' }} />,
  condominiumFees: <HomeWorkIcon sx={{ fontSize: 20, color: '#7e57c2' }} />,
  propertyTax: <ReceiptLongIcon sx={{ fontSize: 20, color: '#66bb6a' }} />,
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Box>
  );
}

const facilityItems = [
  { key: 'waterShutoff', label: 'Llave de paso de agua', icon: <WaterDropIcon sx={{ fontSize: 18, color: '#42a5f5' }} /> },
  { key: 'gasShutoff', label: 'Llave de gas', icon: <LocalFireDepartmentIcon sx={{ fontSize: 18, color: '#ef5350' }} /> },
  { key: 'electricalPanel', label: 'Tablero eléctrico', icon: <ElectricalServicesIcon sx={{ fontSize: 18, color: '#f9a825' }} /> },
  { key: 'meters', label: 'Medidores', icon: <SpeedIcon sx={{ fontSize: 18, color: '#78909c' }} /> },
] as const;

function UtilityList({ utilities }: { utilities: import('../../types').UtilityAccount[] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = useCallback((accountId: string, idx: number) => {
    navigator.clipboard.writeText(accountId);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {utilities.map((ua, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.5, py: 1, bgcolor: '#fafafa', borderRadius: 1.5,
          }}
        >
          <Box sx={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'divider' }}>
            {utilityIcons[ua.utilityType] || <ReceiptLongIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {utilityTypeLabels[ua.utilityType] || ua.utilityType}
              </Typography>
              <Chip
                label={ua.paidBy === 'tenant' ? 'A tu cargo' : 'Incluido'}
                size="small"
                color={ua.paidBy === 'tenant' ? 'default' : 'success'}
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ua.provider}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.25, py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              {ua.accountId}
            </Typography>
            <Tooltip title={copiedIdx === i ? 'Copiado' : 'Copiar'}>
              <IconButton size="small" onClick={() => handleCopy(ua.accountId, i)} sx={{ p: 0.25, color: copiedIdx === i ? 'primary.main' : 'text.secondary' }}>
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function UnitInfoPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: unit, isLoading: unitLoading } = useQuery<Unit>({
    queryKey: ['tenant', 'unit', activeLease?.id],
    queryFn: () => leaseApi.getUnitForTenant(activeLease!.id),
    enabled: !!activeLease,
  });

  if (leasesLoading || unitLoading) return <LoadingSpinner />;
  if (!unit) return <EmptyState message="No se encontró información de la vivienda." />;

  const a = unit.address;
  const addressMain = `${a.street} ${a.number}${a.floor ? `, Piso ${a.floor}` : ''}${a.apartment ? ` ${a.apartment}` : ''}`;
  const addressCity = [a.neighborhood, a.city, a.province].filter(Boolean).join(', ');
  const fullAddress = `${addressMain}, ${addressCity}`;
  const unitTypeLabel = unit.unitType === 'apartment' ? 'Departamento' : 'Casa';
  const hasFacilities = unit.facilities && facilityItems.some((f) => (unit.facilities as any)?.[f.key]);
  const hasUtilities = (unit.utilityAccounts?.length ?? 0) > 0;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleShareAddress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Dirección', text: fullAddress, url: mapsUrl });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <Box>
      <PageHeader
        title="Inicio"
        subtitle={addressMain}
        chips={<Chip label={unitTypeLabel} size="small" variant="outlined" />}
      />

      <Grid container spacing={2}>
        {/* Row 1: Ubicación y datos | Suministros */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%' }}>
            <SectionTitle icon={<LocationOnIcon sx={{ fontSize: 20, color: 'primary.main' }} />} title="Ubicación y datos" />
            <InfoRow label="Dirección" value={addressMain} />
            <Divider />
            <InfoRow label="Localidad" value={addressCity} />
            <Divider />
            <InfoRow label="Tipo" value={unitTypeLabel} />
            {unit.areaSqm && (
              <>
                <Divider />
                <InfoRow label="Superficie" value={`${unit.areaSqm} m²`} />
              </>
            )}
            {unit.functionalUnit && (
              <>
                <Divider />
                <InfoRow label="Unidad funcional" value={unit.functionalUnit} />
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {hasUtilities ? (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%' }}>
              <SectionTitle icon={<ReceiptLongIcon sx={{ fontSize: 20, color: 'primary.main' }} />} title="Suministros" />
              <UtilityList utilities={unit.utilityAccounts!} />
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay datos de suministros cargados.
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Row 2: Mapa | Instalaciones */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, minHeight: 180 }}>
              <iframe
                src={embedUrl}
                title="Mapa"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, px: 1.5, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                size="small"
                startIcon={<OpenInNewIcon />}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textTransform: 'none' }}
              >
                Abrir en Google Maps
              </Button>
              <Tooltip title={copiedAddress ? 'Dirección copiada' : 'Compartir dirección'}>
                <IconButton size="small" onClick={handleShareAddress} sx={{ color: 'text.secondary' }}>
                  {copiedAddress ? <ContentCopyIcon sx={{ fontSize: 18 }} /> : <ShareIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {hasFacilities ? (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%' }}>
              <SectionTitle icon={<BuildIcon sx={{ fontSize: 20, color: 'primary.main' }} />} title="Ubicación de instalaciones" />
              <Grid container spacing={1.5}>
                {facilityItems.map((f) => {
                  const val = (unit.facilities as any)?.[f.key];
                  if (!val) return null;
                  return (
                    <Grid size={{ xs: 6 }} key={f.key}>
                      <Box sx={{ px: 1.5, py: 1, bgcolor: '#fafafa', borderRadius: 1.5, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                          {f.icon}
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{f.label}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{val}</Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay datos de instalaciones cargados.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
