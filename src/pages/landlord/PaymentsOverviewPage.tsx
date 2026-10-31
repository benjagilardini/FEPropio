import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import FlagIcon from '@mui/icons-material/Flag';
import { useUnits } from '../../hooks/useUnits';
import { usePayments, useConfirmPayment, useFlagPayment } from '../../hooks/usePayments';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatPeriod } from '../../utils/formatDate';
import type { Unit } from '../../types';

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.\u00B0`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

const TAB_LABELS = ['Por revisar', 'Observados', 'Todos'] as const;

export default function PaymentsOverviewPage() {
  const { data: unitsData, isLoading: unitsLoading } = useUnits(1);

  const occupiedUnits = (unitsData?.data || []).filter(
    (u) => u.isOccupied,
  );

  const toast = useToast();
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [tab, setTab] = useState(0);
  const [flagDialog, setFlagDialog] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const selectedUnit = occupiedUnits.find((u) => u.id === selectedUnitId);
  const leaseId = '';

  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(leaseId);
  const confirmMut = useConfirmPayment();
  const flagMut = useFlagPayment();

  if (unitsLoading) return <LoadingSpinner />;

  const allPayments = paymentsData?.data || [];

  const filteredPayments =
    tab === 0
      ? allPayments.filter((p) => p.status === 'submitted')
      : tab === 1
        ? allPayments.filter((p) => p.status === 'flagged')
        : allPayments;

  const handleConfirm = async (paymentId: string) => {
    if (!leaseId) return;
    try {
      await confirmMut.mutateAsync({ leaseId, paymentId });
      toast.success('Pago confirmado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar el pago');
    }
  };

  const handleFlag = async () => {
    if (!flagDialog || !leaseId) return;
    try {
      await flagMut.mutateAsync({ leaseId, paymentId: flagDialog, reviewNote });
      toast.warning('Pago observado');
      setFlagDialog(null);
      setReviewNote('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al observar el pago');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
        Pagos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprobantes que cargaron tus locatarios. Al confirmarlos, se cuentan como ingresos
        percibidos para el rendimiento.
      </Typography>

      {occupiedUnits.length === 0 ? (
        <EmptyState
          message="No hay unidades con contratos activos"
          description="Cuando tengas unidades ocupadas con contratos vigentes, vas a poder revisar los comprobantes de pago aca."
        />
      ) : (
        <>
          <TextField
            select
            label="Seleccionar unidad"
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setTab(0);
            }}
            sx={{ mb: 3, minWidth: 350 }}
            size="small"
          >
            {occupiedUnits.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {formatAddress(unit)}
                {unit.tenant?.name ? ` \u2014 ${unit.tenant.name}` : ''}
              </MenuItem>
            ))}
          </TextField>

          {selectedUnitId && (
            <>
              {paymentsLoading ? (
                <LoadingSpinner />
              ) : allPayments.length === 0 ? (
                <EmptyState message="No hay comprobantes de pago para esta unidad." />
              ) : (
                <>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ mb: 2 }}
                  >
                    {TAB_LABELS.map((label) => (
                      <Tab key={label} label={label} />
                    ))}
                  </Tabs>

                  {filteredPayments.length === 0 ? (
                    <EmptyState message={`No hay comprobantes en "${TAB_LABELS[tab]}".`} />
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Periodo</TableCell>
                            <TableCell>Importe</TableCell>
                            <TableCell>Esperado</TableCell>
                            <TableCell>Fecha de pago</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Observacion</TableCell>
                            <TableCell>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredPayments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{formatPeriod(p.period)}</TableCell>
                              <TableCell>{formatCurrency(p.amount)}</TableCell>
                              <TableCell>
                                {p.expectedAmount ? formatCurrency(p.expectedAmount) : '-'}
                              </TableCell>
                              <TableCell>{formatDate(p.paymentDate)}</TableCell>
                              <TableCell>
                                <StatusChip status={p.status} />
                              </TableCell>
                              <TableCell>{p.reviewNote || '-'}</TableCell>
                              <TableCell>
                                {p.status === 'submitted' && (
                                  <Box display="flex" gap={1}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                      startIcon={<CheckIcon />}
                                      onClick={() => handleConfirm(p.id)}
                                    >
                                      Confirmar
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<FlagIcon />}
                                      onClick={() => setFlagDialog(p.id)}
                                    >
                                      Observar
                                    </Button>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={!!flagDialog} onClose={() => setFlagDialog(null)}>
        <DialogTitle>Observar comprobante</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Observacion"
            multiline
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialog(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleFlag}
            disabled={!reviewNote.trim()}
          >
            Observar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
