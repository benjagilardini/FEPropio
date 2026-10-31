import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, IconButton, Tooltip,
  Pagination as MuiPagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTenantLeases } from '../../hooks/useLeases';
import { usePayments, useCreatePayment } from '../../hooks/usePayments';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatPeriod } from '../../utils/formatDate';
import { useForm } from 'react-hook-form';
import type { PaymentInput } from '../../types';

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.03em' }}>{value}</Typography>
      <Tooltip title={copied ? 'Copiado' : 'Copiar'}>
        <IconButton size="small" onClick={handleCopy} sx={{ color: 'text.secondary' }}>
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

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
  const pa = activeLease.paymentAccount;

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
      <PageHeader
        title="Mis Pagos"
        actions={
          activeLease.status === 'active' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Cargar comprobante
            </Button>
          )
        }
      />

      {/* Payment account card */}
      {pa && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AccountBalanceIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Datos para transferir</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Titular</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{pa.holderName}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Banco</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{pa.bank}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>CBU/CVU</Typography>
              <CopyValue value={pa.cbuOrCvu} />
            </Grid>
            {pa.alias && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Alias</Typography>
                <CopyValue value={pa.alias} />
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Payments list */}
      {payments.length === 0 ? (
        <EmptyState
          message="No hay comprobantes de pago."
          description="Cuando cargues un comprobante de transferencia, va a aparecer acá."
          Icon={ReceiptLongIcon}
          action={
            activeLease.status === 'active' ? (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ mt: 1 }}>
                Cargar primer comprobante
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {payments.map((p) => (
            <Paper key={p.id} variant="outlined" sx={{ px: 2.5, py: 2, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ReceiptLongIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{formatPeriod(p.period)}</Typography>
                    <StatusChip status={p.status} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Pagado el {formatDate(p.paymentDate)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{formatCurrency(p.amount)}</Typography>
                  {p.reviewNote && (
                    <Typography variant="caption" sx={{ color: p.status === 'flagged' ? 'error.main' : 'text.secondary' }}>
                      {p.reviewNote}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}

      {/* New payment dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Cargar comprobante de pago</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Período (YYYY-MM)" placeholder="2025-01"
              {...register('period', { required: true })}
              size="small"
            />
            <TextField
              label="Importe ($)"
              {...register('amount', { required: true })}
              size="small"
            />
            <TextField
              label="Fecha de pago" type="datetime-local"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('paymentDate', { required: true })}
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
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
