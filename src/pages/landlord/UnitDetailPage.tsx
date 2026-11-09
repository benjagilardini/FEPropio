import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, MenuItem, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUnit, useDeleteUnit } from '../../hooks/useUnits';
import { useLeasesByUnit, useEndLease } from '../../hooks/useLeases';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../../hooks/useExpenses';
import { leaseApi } from '../../api/leaseApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useForm, Controller } from 'react-hook-form';
import type { ExpenseInput, Lease } from '../../types';
import { unitTypeLabels, utilityTypeLabels, expenseCategoryLabels, utilityAccountPrefix } from '../../constants/labels';
import { formatAddress, formatAddressSecondary } from '../../utils/formatAddress';
import { formatFreq } from '../../utils/formatters';
import { KVRow, KVTable } from '../../components/common/KVTable';
import { getApiError } from '../../utils/getApiError';

const sectionTitle = { fontWeight: 700, fontSize: '1.05rem', mb: 1.5 };

export default function UnitDetailPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading } = useUnit(unitId!);
  const { data: leasesData } = useLeasesByUnit(unitId!);
  const endLeaseMut = useEndLease();
  const deleteMut = useDeleteUnit();
  const toast = useToast();
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(false);
  const [restitutionDate, setRestitutionDate] = useState('');
  const [unitDestination, setUnitDestination] = useState<'vacant' | 'renew' | ''>('');
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const { data: expensesData } = useExpenses(unitId!);
  const createExpenseMut = useCreateExpense();
  const deleteExpenseMut = useDeleteExpense();
  const expenseForm = useForm<ExpenseInput>({ defaultValues: { category: 'other', paidBy: 'landlord' } });

  if (isLoading || !unit) return <LoadingSpinner />;

  const leases: Lease[] = leasesData?.data || [];
  const activeLease = leases.find((l) => l.status === 'active');
  const address = formatAddress(unit);
  const subtitle = formatAddressSecondary(unit);
  const isOccupied = unit.isOccupied ?? !!activeLease;

  const handleEndLease = async () => {
    if (!activeLease) return;
    try {
      await endLeaseMut.mutateAsync({
        leaseId: activeLease.id,
        data: {
          restitutionDate: restitutionDate || undefined,
          unitDestination: unitDestination || undefined,
        },
      });
      toast.success('Contrato finalizado correctamente');
      setEndDialogOpen(false);
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al finalizar el contrato'));
    }
  };

  const handleDeleteUnit = async () => {
    try {
      await deleteMut.mutateAsync(unitId!);
      toast.success('Unidad eliminada');
      navigate('/units');
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al eliminar la unidad'));
    }
  };

  const handleCreateExpense = async (formData: ExpenseInput) => {
    try {
      await createExpenseMut.mutateAsync({ unitId: unitId!, data: formData });
      toast.success('Gasto registrado');
      setExpenseDialogOpen(false);
      expenseForm.reset();
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al registrar el gasto'));
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpenseMut.mutateAsync({ unitId: unitId!, expenseId });
      toast.success('Gasto eliminado');
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al eliminar'));
    }
  };

  const recentExpenses = expensesData?.data || [];
  const totalExpenses = expensesData?.pagination?.total || 0;

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
      // Silently ignore — document may not be uploaded yet
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
          <>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/units/${unitId}/edit`)}>
              Editar unidad
            </Button>
            {!activeLease && (
              <Button variant="outlined" color="error" startIcon={<DeleteOutlinedIcon />} onClick={() => setConfirmDeleteUnit(true)}>
                Eliminar unidad
              </Button>
            )}
          </>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Datos administrativos</Typography>
            <KVTable>
              <KVRow label="Tipo de unidad" value={unitTypeLabels[unit.unitType] || unit.unitType} />
              <KVRow label="Superficie" value={unit.areaSqm ? `${unit.areaSqm} m²` : undefined} />
              <KVRow label="Unidad funcional" value={unit.functionalUnit ? `UF ${unit.functionalUnit}` : undefined} />
              <KVRow label="Partida inmobiliaria" value={unit.propertyTaxAccount} />
              <KVRow label="Valor de referencia" value={unit.referenceValue ? `${formatCurrency(unit.referenceValue)} (editable)` : undefined} />
            </KVTable>
          </Paper>

          {unit.facilities && (
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionTitle}>Ubicación de instalaciones</Typography>
              <KVTable>
                <KVRow label="Llave de paso de agua" value={unit.facilities.waterShutoff} />
                <KVRow label="Llave de gas" value={unit.facilities.gasShutoff} />
                <KVRow label="Tablero eléctrico" value={unit.facilities.electricalPanel} />
                <KVRow label="Medidores" value={unit.facilities.meters} />
              </KVTable>
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Contrato vigente</Typography>
            {activeLease ? (
              <>
                <KVTable>
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
                </KVTable>
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
                    onClick={() => setEndDialogOpen(true)}
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
              <KVTable>
                {unit.utilityAccounts!.map((ua, i) => (
                  <KVRow
                    key={i}
                    label={ua.provider || utilityTypeLabels[ua.utilityType] || ua.utilityType}
                    value={ua.accountId ? `${utilityAccountPrefix[ua.utilityType] || 'Cuenta'} ${ua.accountId}` : '—'}
                  />
                ))}
              </KVTable>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                No hay suministros cargados.
              </Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ ...sectionTitle, mb: '0 !important' }}>Gastos</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setExpenseDialogOpen(true)}>
                Nuevo
              </Button>
            </Box>
            {recentExpenses.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                No hay gastos registrados.
              </Typography>
            ) : (
              <>
                {recentExpenses.slice(0, 5).map((e) => (
                  <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.concept}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(e.date)} · {expenseCategoryLabels[e.category] || e.category}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mx: 1 }}>{formatCurrency(e.amount)}</Typography>
                    <IconButton size="small" color="error" onClick={() => handleDeleteExpense(e.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {totalExpenses > 5 && (
                  <Button size="small" fullWidth sx={{ mt: 1 }} onClick={() => navigate(`/units/${unitId}/expenses`)}>
                    Ver todos ({totalExpenses})
                  </Button>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo gasto</DialogTitle>
        <Box component="form" onSubmit={expenseForm.handleSubmit(handleCreateExpense)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Fecha" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...expenseForm.register('date', { required: true })}
            />
            <Controller
              name="category"
              control={expenseForm.control}
              render={({ field }) => (
                <TextField select label="Categoría" {...field}>
                  {[
                    { value: 'tax', label: 'Impuesto' },
                    { value: 'insurance', label: 'Seguro' },
                    { value: 'maintenance', label: 'Mantenimiento' },
                    { value: 'condominiumFees', label: 'Expensas' },
                    { value: 'other', label: 'Otro' },
                  ].map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
            <TextField label="Concepto" {...expenseForm.register('concept', { required: true })} />
            <TextField label="Importe ($)" {...expenseForm.register('amount', { required: true })} />
            <Controller
              name="paidBy"
              control={expenseForm.control}
              render={({ field }) => (
                <TextField select label="A cargo de" {...field}>
                  <MenuItem value="landlord">Propietario</MenuItem>
                  <MenuItem value="tenant">Inquilino</MenuItem>
                </TextField>
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createExpenseMut.isPending}>Guardar</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={endDialogOpen} onClose={() => setEndDialogOpen(false)}>
        <DialogTitle>Finalizar contrato</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer. Completá los datos de finalización.
          </Typography>
          <TextField
            label="Fecha de restitución del inmueble"
            type="date"
            value={restitutionDate}
            onChange={(e) => setRestitutionDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Destino de la unidad"
            value={unitDestination}
            onChange={(e) => setUnitDestination(e.target.value as 'vacant' | 'renew')}
          >
            <MenuItem value="">Sin definir</MenuItem>
            <MenuItem value="vacant">Queda vacante</MenuItem>
            <MenuItem value="renew">Se renueva contrato</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleEndLease}
            disabled={endLeaseMut.isPending}
          >
            {endLeaseMut.isPending ? 'Finalizando...' : 'Finalizar contrato'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteUnit} onClose={() => setConfirmDeleteUnit(false)}>
        <DialogTitle>Eliminar unidad</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que querés eliminar esta unidad? Se perderán todos los datos asociados. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteUnit(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUnit} disabled={deleteMut.isPending}>
            {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
