import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useUnit, useDeleteUnit } from '../../hooks/useUnits';
import { useLeasesByUnit } from '../../hooks/useLeases';
import { leaseApi } from '../../api/leaseApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Unit, Lease } from '../../types';

const unitTypeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
};

const utilityTypeLabels: Record<string, string> = {
  electricity: 'EPEC',
  gas: 'Ecogas',
  water: 'Aguas Cordobesas',
  condominiumFees: 'Expensas',
  propertyTax: 'Imp. inmobiliario',
};

const accountPrefix: Record<string, string> = {
  electricity: 'Contrato',
  gas: 'Cliente',
  water: 'U. de facturación',
  condominiumFees: 'Consorcio',
  propertyTax: 'Partida',
};

function formatFullAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

function formatSubtitle(unit: Unit): string | null {
  const parts: string[] = [];
  if (unit.address.neighborhood) parts.push(unit.address.neighborhood);
  if (unit.address.city) parts.push(unit.address.city);
  return parts.length > 0 ? parts.join(', ') : null;
}

function formatFreq(months: number): string {
  if (months === 3) return 'trimestral';
  if (months === 6) return 'semestral';
  if (months === 12) return 'anual';
  return `cada ${months} meses`;
}

function KVRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', width: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

const sectionTitle = { fontWeight: 700, fontSize: '1.05rem', mb: 1.5 };

export default function UnitDetailPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading } = useUnit(unitId!);
  const { data: leasesData } = useLeasesByUnit(unitId!);
  const deleteMutation = useDeleteUnit();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !unit) return <LoadingSpinner />;

  const leases: Lease[] = leasesData?.data || [];
  const activeLease = leases.find((l) => l.status === 'active');
  const address = formatFullAddress(unit);
  const subtitle = formatSubtitle(unit);
  const isOccupied = unit.isOccupied ?? !!activeLease;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(unitId!);
      toast.success('Contrato finalizado correctamente');
      navigate('/units');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al finalizar el contrato');
    }
  };

  const handleDownloadContract = async (lease: Lease) => {
    try {
      const response = await leaseApi.downloadDocument(lease.id);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lease.document?.fileName || 'contrato.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Document may not be available yet
    }
  };

  return (
    <Box>
      <PageHeader
        breadcrumbs={[
          { label: 'Mis unidades', onClick: () => navigate('/units') },
          { label: address },
        ]}
        title={address}
        subtitle={subtitle || undefined}
        chips={<StatusChip status={isOccupied ? 'occupied' : 'vacant'} />}
        actions={
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/units/${unitId}/edit`)}>
            Editar unidad
          </Button>
        }
      />

      {/* Two independent columns */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
        {/* Left column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Datos administrativos</Typography>
            <KVRow label="Tipo de unidad" value={unitTypeLabels[unit.unitType] || unit.unitType} />
            <KVRow label="Superficie" value={unit.areaSqm ? `${unit.areaSqm} m²` : undefined} />
            <KVRow label="Unidad funcional" value={unit.functionalUnit ? `UF ${unit.functionalUnit}` : undefined} />
            <KVRow label="Partida inmobiliaria" value={unit.propertyTaxAccount} />
            <KVRow label="Valor de referencia" value={unit.referenceValue ? `${formatCurrency(unit.referenceValue)} (editable)` : undefined} />
          </Paper>

          {unit.facilities && (
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionTitle}>Ubicación de instalaciones</Typography>
              <KVRow label="Llave de paso de agua" value={unit.facilities.waterShutoff} />
              <KVRow label="Llave de gas" value={unit.facilities.gasShutoff} />
              <KVRow label="Tablero eléctrico" value={unit.facilities.electricalPanel} />
              <KVRow label="Medidores" value={unit.facilities.meters} />
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Contratos de la unidad</Typography>
            {leases.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                No hay contratos para esta unidad.
              </Typography>
            ) : (
              leases.map((lease) => (
                <Box
                  key={lease.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/leases/${lease.id}`)}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {lease.tenantName || 'Sin inquilino'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDate(lease.startDate)} {'–'} {formatDate(lease.endDate)} {'·'} {lease.adjustmentIndex} {formatFreq(lease.adjustmentFrequencyMonths)}
                    </Typography>
                  </Box>
                  <Box sx={{ mx: 1 }}>
                    <StatusChip status={lease.status} />
                  </Box>
                  <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                </Box>
              ))
            )}
          </Paper>
        </Box>

        {/* Right column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Contrato vigente</Typography>
            {activeLease ? (
              <>
                <KVRow label="Locataria" value={activeLease.tenantName || '—'} />
                <KVRow label="Vigencia" value={`${formatDate(activeLease.startDate)} – ${formatDate(activeLease.endDate)}`} />
                <KVRow label="Alquiler vigente" value={unit.currentRent ? formatCurrency(unit.currentRent) : formatCurrency(activeLease.initialRent)} />
                <KVRow label="Índice" value={`${activeLease.adjustmentIndex} · ${formatFreq(activeLease.adjustmentFrequencyMonths)}`} />
                {activeLease.paymentAccount?.alias && (
                  <KVRow label="Alias de cobro" value={activeLease.paymentAccount.alias} />
                )}
                {activeLease.paymentAccount?.cbuOrCvu && (
                  <KVRow label="CBU" value={activeLease.paymentAccount.cbuOrCvu} />
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<DescriptionOutlinedIcon />}
                    onClick={() => handleDownloadContract(activeLease)}
                    sx={{ textTransform: 'uppercase', justifyContent: 'center' }}
                  >
                    Ver contrato
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate(`/leases/${activeLease.id}/adjustments/${activeLease.id}`)}
                    sx={{ textTransform: 'uppercase', justifyContent: 'center' }}
                  >
                    Ver actualización
                  </Button>
                  <Button
                    fullWidth
                    size="small"
                    sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'text.secondary', mt: 0.5 }}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Finalizar contrato
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                  No hay contrato vigente.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate(`/units/${unitId}/leases/new`)}
                  sx={{ mt: 1 }}
                >
                  Cargar contrato
                </Button>
              </>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Suministros</Typography>
            {(unit.utilityAccounts?.length ?? 0) > 0 ? (
              unit.utilityAccounts!.map((ua, i) => (
                <KVRow
                  key={i}
                  label={ua.provider || utilityTypeLabels[ua.utilityType] || ua.utilityType}
                  value={ua.accountId ? `${accountPrefix[ua.utilityType] || 'Cuenta'} ${ua.accountId}` : '—'}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                No hay suministros cargados.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmDelete}
        title="Finalizar contrato"
        message={'¿Estás seguro de que querés finalizar este contrato? Esta acción no se puede deshacer.'}
        confirmLabel="Finalizar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Box>
  );
}
