import { useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, IconButton, Tooltip,
  Divider, alpha, useTheme,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { useTenantLeases } from '../../hooks/useLeases';
import { usePayments, useCreatePayment } from '../../hooks/usePayments';
import { paymentApi } from '../../api/paymentApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateMonths, formatShortMonth, formatLongMonth } from '../../utils/formatters';
import { PaymentStatusBadge } from '../../components/common/PaymentStatusBadge';
import { getApiError } from '../../utils/getApiError';
import type { PaymentReceipt } from '../../types';

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <Box sx={{ flex: 1, minWidth: 120 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', letterSpacing: 0.5 }}>{value}</Typography>
        <Tooltip title={copied ? 'Copiado' : 'Copiar'}><IconButton size="small" onClick={copy} sx={{ p: 0.25 }}><ContentCopyIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
      </Box>
    </Box>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 80 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export default function TenantPaymentsPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];
  const { data, isLoading } = usePayments(activeLease?.id || '', 1, 100);
  const createMut = useCreatePayment();
  const toast = useToast();
  const theme = useTheme();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPeriod, setDialogPeriod] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const allMonths = useMemo(() => activeLease ? generateMonths(activeLease.startDate, activeLease.endDate) : [], [activeLease?.startDate, activeLease?.endDate]);

  const byPeriod = useMemo(() => {
    const m = new Map<string, PaymentReceipt>();
    data?.data?.forEach((p) => m.set(p.period, p));
    return m;
  }, [data]);

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!activeLease) return <EmptyState message="No tenés un contrato activo." />;

  const pa = activeLease.paymentAccount;
  const now = new Date();
  const curPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const past = allMonths.filter((m) => m < curPeriod);
  const future = allMonths.filter((m) => m >= curPeriod);
  const ordered = [...future, ...past.reverse()];

  const openDialog = (period: string) => {
    setDialogPeriod(period);
    setMessage(''); setFile(null); setError(''); setDialogOpen(true);
  };

  const onSubmit = async () => {
    try {
      setError('');
      await createMut.mutateAsync({
        leaseId: activeLease.id,
        data: { period: dialogPeriod, paymentDate: new Date().toISOString(), message: message || undefined },
        file: file || undefined,
      });
      toast.success('Comprobante cargado correctamente');
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = getApiError(err, 'Error al cargar comprobante');
      setError(msg); toast.error(msg);
    }
  };

  const downloadReceipt = async (paymentId: string, fileName: string) => {
    try {
      const res = await paymentApi.downloadFile(activeLease.id, paymentId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar el archivo');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Mis Pagos" />

      {pa && (
        <Paper variant="outlined" sx={{ px: 2.5, py: 1.5, mb: 1.5, borderColor: 'divider', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <AccountBalanceIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Datos para transferir</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <InfoField label="Titular" value={pa.holderName} />
            <InfoField label="Banco" value={pa.bank} />
            <CopyField label="CBU/CVU" value={pa.cbuOrCvu} />
            {pa.alias && <CopyField label="Alias" value={pa.alias} />}
          </Box>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ borderColor: 'divider', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 0.75, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, width: 130, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', fontSize: '0.65rem' }}>
            Período
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, width: 120, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', fontSize: '0.65rem' }}>
            Monto
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, flex: 1, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', fontSize: '0.65rem' }}>
            Detalle
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, width: 100, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', fontSize: '0.65rem', flexShrink: 0 }}>
            Estado
          </Typography>
          <Box sx={{ width: 120, flexShrink: 0 }} />
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {ordered.map((period, idx) => {
            const payment = byPeriod.get(period);
            const status = payment?.status || 'pending';
            const isCur = period === curPeriod;
            const isPast = period < curPeriod && !payment;
            const canUpload = !payment && activeLease.status === 'active';
            const displayAmount = payment?.expectedAmount || activeLease.initialRent;

            return (
              <Box key={period}>
                {idx > 0 && <Divider />}
                <Box sx={{
                  display: 'flex', alignItems: 'center', px: 2.5, py: 1,
                  ...(isCur && { bgcolor: alpha(theme.palette.primary.main, 0.03), borderLeft: `3px solid ${theme.palette.primary.main}`, pl: 2 }),
                  ...(isPast && { opacity: 0.45 }),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                }}>
                  <Box sx={{ width: 130, flexShrink: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: isCur ? 700 : 500, fontSize: '0.82rem' }}>
                      {formatShortMonth(period)}
                    </Typography>
                    {isCur && <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.65rem', lineHeight: 1 }}>Mes actual</Typography>}
                  </Box>

                  <Box sx={{ width: 120, flexShrink: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      {displayAmount ? formatCurrency(displayAmount) : '—'}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {payment?.message && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {payment.message}
                      </Typography>
                    )}
                    {payment?.reviewNote && (
                      <Typography variant="caption" sx={{ color: 'error.main' }}>
                        {payment.reviewNote}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ width: 100, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    <PaymentStatusBadge status={status} />
                  </Box>

                  <Box sx={{ width: 130, flexShrink: 0, textAlign: 'right' }}>
                    {canUpload && (
                      <Button size="small" variant={isCur ? 'contained' : 'text'} onClick={() => openDialog(period)} sx={{ fontSize: '0.72rem', py: 0.25, textTransform: 'none' }}>
                        Cargar pago
                      </Button>
                    )}
                    {payment?.file && (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                        onClick={() => downloadReceipt(payment.id, payment.file!.fileName)}
                        sx={{ fontSize: '0.72rem', py: 0.25, textTransform: 'none' }}
                      >
                        Descargar
                      </Button>
                    )}
                    {payment?.status === 'flagged' && activeLease.status === 'active' && (
                      <Button size="small" variant="text" onClick={() => openDialog(period)} sx={{ fontSize: '0.72rem', py: 0.25, textTransform: 'none' }}>
                        Reenviar
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Cargar comprobante — {dialogPeriod && formatLongMonth(dialogPeriod)}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>}

          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onClick={() => fileRef.current?.click()}
            sx={{
              border: '2px dashed', borderColor: file ? 'primary.main' : 'divider', borderRadius: 2,
              p: 2, textAlign: 'center', cursor: 'pointer',
              bgcolor: file ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
              '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.03) },
            }}
          >
            <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <AttachFileIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{file.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>({(file.size / 1024).toFixed(0)} KB)</Typography>
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.25 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Arrastrá o hacé clic para adjuntar comprobante</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>PDF, JPG, PNG — máx. 5 MB</Typography>
              </>
            )}
          </Box>

          <TextField
            label="Mensaje para el propietario (opcional)"
            value={message} onChange={(e) => setMessage(e.target.value)}
            size="small" multiline rows={2}
            placeholder="Ej: Transferencia desde cuenta Santander"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={onSubmit} disabled={createMut.isPending}>Enviar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
