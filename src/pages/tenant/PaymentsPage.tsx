import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Pagination as MuiPagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTenantLeases } from '../../hooks/useLeases';
import { usePayments, useCreatePayment } from '../../hooks/usePayments';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatPeriod } from '../../utils/formatDate';
import { useForm } from 'react-hook-form';
import type { PaymentInput } from '../../types';

export default function TenantPaymentsPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayments(activeLease?.id || '', page);
  const createMut = useCreatePayment();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset } = useForm<PaymentInput>();

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!activeLease) return <EmptyState message="No tenés un contrato activo." />;

  const payments = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const onSubmit = async (formData: PaymentInput) => {
    try {
      setError('');
      await createMut.mutateAsync({ leaseId: activeLease.id, data: formData });
      toast.success('Comprobante cargado correctamente');
      setDialogOpen(false);
      reset();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar comprobante';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Mis Pagos</Typography>
        {activeLease.status === 'active' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Cargar comprobante
          </Button>
        )}
      </Box>

      {activeLease.paymentAccount && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Datos de pago</Typography>
          <Typography variant="body2">
            {activeLease.paymentAccount.bank} | CBU: {activeLease.paymentAccount.cbuOrCvu}
            {activeLease.paymentAccount.alias && ` | Alias: ${activeLease.paymentAccount.alias}`}
            {` | Titular: ${activeLease.paymentAccount.holderName}`}
          </Typography>
        </Paper>
      )}

      {payments.length === 0 ? (
        <EmptyState message="No hay comprobantes de pago." />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell>Importe</TableCell>
                  <TableCell>Fecha de pago</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Observación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatPeriod(p.period)}</TableCell>
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell><StatusChip status={p.status} /></TableCell>
                    <TableCell>{p.reviewNote || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cargar comprobante de pago</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Período (YYYY-MM)" placeholder="2025-01"
              {...register('period', { required: true })}
            />
            <TextField label="Importe ($)" {...register('amount', { required: true })} />
            <TextField
              label="Fecha de pago" type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('paymentDate', { required: true })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createMut.isPending}>
              Enviar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
