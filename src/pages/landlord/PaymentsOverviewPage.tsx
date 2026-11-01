import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Chip, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  alpha, useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import CheckIcon from '@mui/icons-material/Check';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useUnits } from '../../hooks/useUnits';
import { useLeasesByUnit } from '../../hooks/useLeases';
import { usePayments, useConfirmPayment, useFlagPayment } from '../../hooks/usePayments';
import { paymentApi } from '../../api/paymentApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Unit, PaymentReceipt } from '../../types';

/* ---- helpers ---- */

function fmtAddress(unit: Unit): string {
  const a = unit.address;
  let s = `${a.street} ${a.number}`;
  if (a.floor) s += `, ${a.floor}.°`;
  if (a.apartment) s += ` ${a.apartment}`;
  return s;
}

function fmtMonth(period: string): string {
  const [y, m] = period.split('-');
  const d = new Date(+y, +m - 1, 1);
  const name = d.toLocaleDateString('es-AR', { month: 'long' });
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${y}`;
}

function fmtShortMonth(period: string): string {
  const [y, m] = period.split('-');
  const d = new Date(+y, +m - 1, 1);
  const name = d.toLocaleDateString('es-AR', { month: 'short' });
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${y}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function generateMonths(start: string, end: string): string[] {
  const months: string[] = [];
  let cur = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), 1);
  const last = new Date(new Date(end).getFullYear(), new Date(end).getMonth(), 1);
  while (cur <= last) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

/* ---- status badge ---- */

const STATUS_CFG: Record<string, { label: string; color: 'success' | 'info' | 'error'; icon: React.ReactElement }> = {
  confirmed: { label: 'Confirmado', color: 'success', icon: <CheckCircleOutlineIcon sx={{ fontSize: 15 }} /> },
  submitted: { label: 'Por revisar', color: 'info', icon: <HourglassEmptyIcon sx={{ fontSize: 15 }} /> },
  flagged:   { label: 'Observado',  color: 'error', icon: <ErrorOutlineIcon sx={{ fontSize: 15 }} /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status];
  if (!cfg) return <Typography variant="caption" color="text.disabled">Sin pago</Typography>;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      color={cfg.color}
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: '0.75rem', height: 24 }}
    />
  );
}

/* ---- page ---- */

export default function PaymentsOverviewPage() {
  const { data: unitsData, isLoading: unitsLoading } = useUnits(1);
  const toast = useToast();
  const theme = useTheme();

  const occupiedUnits = useMemo(
    () => (unitsData?.data || []).filter((u) => u.isOccupied),
    [unitsData],
  );

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tab, setTab] = useState(0);
  const [flagDialog, setFlagDialog] = useState<PaymentReceipt | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [detailPayment, setDetailPayment] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    if (!selectedUnitId && occupiedUnits.length > 0) setSelectedUnitId(occupiedUnits[0].id);
  }, [occupiedUnits, selectedUnitId]);

  const { data: leasesData, isLoading: leasesLoading } = useLeasesByUnit(selectedUnitId);
  const activeLease = useMemo(() => leasesData?.data?.find((l) => l.status === 'active'), [leasesData]);
  const leaseId = activeLease?.id || '';

  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(leaseId, 1, 100);
  const confirmMut = useConfirmPayment();
  const flagMut = useFlagPayment();

  const selectedUnit = occupiedUnits.find((u) => u.id === selectedUnitId);

  const byPeriod = useMemo(() => {
    const m = new Map<string, PaymentReceipt>();
    paymentsData?.data?.forEach((p) => m.set(p.period, p));
    return m;
  }, [paymentsData]);

  const allMonths = useMemo(
    () => activeLease ? generateMonths(activeLease.startDate, activeLease.endDate) : [],
    [activeLease?.startDate, activeLease?.endDate],
  );

  const now = new Date();
  const curPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ordered = useMemo(() => {
    const past = allMonths.filter((m) => m < curPeriod);
    const future = allMonths.filter((m) => m >= curPeriod);
    return [...future, ...past.reverse()];
  }, [allMonths, curPeriod]);

  const filtered = useMemo(() => {
    if (tab === 2) return ordered;
    return ordered.filter((p) => {
      const pay = byPeriod.get(p);
      if (tab === 0) return pay?.status === 'submitted';
      return pay?.status === 'flagged';
    });
  }, [tab, ordered, byPeriod]);

  const counts = useMemo(() => {
    const all = Array.from(byPeriod.values());
    return { submitted: all.filter((p) => p.status === 'submitted').length, flagged: all.filter((p) => p.status === 'flagged').length };
  }, [byPeriod]);

  if (unitsLoading) return <LoadingSpinner />;

  const handleConfirm = async (paymentId: string) => {
    try {
      await confirmMut.mutateAsync({ leaseId, paymentId });
      toast.success('Pago confirmado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar');
    }
  };

  const handleFlag = async () => {
    if (!flagDialog) return;
    try {
      await flagMut.mutateAsync({ leaseId, paymentId: flagDialog.id, reviewNote });
      toast.success('Comprobante observado');
      setFlagDialog(null);
      setReviewNote('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al observar');
    }
  };

  const download = async (paymentId: string, fileName: string) => {
    try {
      const res = await paymentApi.downloadFile(leaseId, paymentId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Error al descargar'); }
  };

  const loading = leasesLoading || paymentsLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Pagos"
        subtitle="Revisá y confirmá los comprobantes de tus inquilinos."
      />

      {occupiedUnits.length === 0 ? (
        <EmptyState
          message="No hay unidades con contratos activos"
          description="Cuando tengas inquilinos con contratos vigentes, acá vas a poder revisar sus comprobantes."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Controls */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Unidad"
              value={selectedUnitId}
              onChange={(e) => { setSelectedUnitId(e.target.value); setTab(0); }}
              size="small"
              sx={{ minWidth: 320 }}
            >
              {occupiedUnits.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {fmtAddress(u)}{u.tenant?.name ? ` — ${u.tenant.name}` : ''}
                </MenuItem>
              ))}
            </TextField>

            {selectedUnitId && !loading && activeLease && (
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none', fontWeight: 500, fontSize: '0.85rem' },
                }}
              >
                <Tab label={<TabLabel text="Por revisar" count={counts.submitted} color="primary" />} />
                <Tab label={<TabLabel text="Observados" count={counts.flagged} color="error" />} />
                <Tab label="Todos" />
              </Tabs>
            )}
          </Box>

          {/* Body */}
          {!selectedUnitId ? (
            <EmptyState message="Seleccioná una unidad." />
          ) : loading ? (
            <LoadingSpinner />
          ) : !activeLease ? (
            <EmptyState message="Esta unidad no tiene un contrato activo." />
          ) : filtered.length === 0 ? (
            <EmptyState message={tab === 0 ? 'No hay comprobantes pendientes de revisión.' : tab === 1 ? 'No hay comprobantes observados.' : 'No hay comprobantes.'} />
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ flex: 1, minHeight: 0, borderColor: 'divider' }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={thSx}>Período</TableCell>
                    <TableCell sx={thSx} align="right">Pagado</TableCell>
                    <TableCell sx={thSx} align="right">Esperado</TableCell>
                    <TableCell sx={thSx}>Mensaje</TableCell>
                    <TableCell sx={thSx} align="center">Estado</TableCell>
                    <TableCell sx={{ ...thSx, width: 160 }} align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((period) => {
                    const p = byPeriod.get(period);
                    const isCur = period === curPeriod;
                    const isPast = period < curPeriod && !p;
                    const mismatch = p && p.expectedAmount && p.amount !== p.expectedAmount;

                    return (
                      <TableRow
                        key={period}
                        hover
                        sx={{
                          ...(isCur && { bgcolor: alpha(theme.palette.primary.main, 0.04) }),
                          ...(isPast && { opacity: 0.4 }),
                        }}
                      >
                        {/* Period */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: isCur ? 700 : 500 }}>
                            {fmtShortMonth(period)}
                          </Typography>
                          {isCur && (
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.65rem' }}>
                              Mes actual
                            </Typography>
                          )}
                        </TableCell>

                        {/* Paid amount */}
                        <TableCell align="right">
                          {p ? (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: mismatch ? 'error.main' : 'text.primary' }}>
                              {formatCurrency(p.amount)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled">—</Typography>
                          )}
                        </TableCell>

                        {/* Expected amount */}
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {p?.expectedAmount ? formatCurrency(p.expectedAmount) : selectedUnit?.currentRent ? formatCurrency(selectedUnit.currentRent) : '—'}
                          </Typography>
                        </TableCell>

                        {/* Message */}
                        <TableCell>
                          {p?.message ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: 220 }} noWrap>
                              {p.message}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled">—</Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center">
                          <StatusBadge status={p?.status || 'pending'} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          {p?.status === 'submitted' && (
                            <>
                              <Tooltip title="Confirmar pago">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleConfirm(p.id)}
                                  disabled={confirmMut.isPending}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Observar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => { setFlagDialog(p); setReviewNote(''); }}
                                >
                                  <FlagOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {p?.file && (
                            <Tooltip title="Descargar comprobante">
                              <IconButton size="small" onClick={() => download(p.id, p.file!.fileName)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ---- Flag dialog ---- */}
      <Dialog open={!!flagDialog} onClose={() => setFlagDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Observar comprobante
          {flagDialog && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {fmtMonth(flagDialog.period)} — {formatCurrency(flagDialog.amount)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo de la observación"
            multiline
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 1 }}
            placeholder="Ej: El monto no coincide, falta el comprobante..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFlagDialog(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleFlag} disabled={!reviewNote.trim() || flagMut.isPending}>
            Observar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Detail dialog ---- */}
      <Dialog open={!!detailPayment} onClose={() => setDetailPayment(null)} maxWidth="xs" fullWidth>
        {detailPayment && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
              {fmtMonth(detailPayment.period)}
              <StatusBadge status={detailPayment.status} />
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <DetailField label="Importe pagado" value={formatCurrency(detailPayment.amount)} highlight={detailPayment.expectedAmount ? detailPayment.amount !== detailPayment.expectedAmount : false} />
                <DetailField label="Importe esperado" value={detailPayment.expectedAmount ? formatCurrency(detailPayment.expectedAmount) : '—'} />
                <DetailField label="Fecha de pago" value={fmtDate(detailPayment.paymentDate)} />
                {detailPayment.reviewedAt && <DetailField label="Revisado" value={fmtDate(detailPayment.reviewedAt)} />}
              </Box>

              {detailPayment.message && (
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, px: 2, py: 1.5, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Mensaje del inquilino</Typography>
                  <Typography variant="body2" sx={{ mt: 0.25 }}>{detailPayment.message}</Typography>
                </Box>
              )}

              {detailPayment.reviewNote && (
                <Box sx={{ bgcolor: alpha('#d32f2f', 0.04), borderRadius: 1.5, px: 2, py: 1.5, mb: 2, border: '1px solid', borderColor: alpha('#d32f2f', 0.15) }}>
                  <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>Observación</Typography>
                  <Typography variant="body2" sx={{ mt: 0.25 }}>{detailPayment.reviewNote}</Typography>
                </Box>
              )}

              {detailPayment.file && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <AttachFileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ flex: 1 }} noWrap>{detailPayment.file.fileName}</Typography>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => download(detailPayment.id, detailPayment.file!.fileName)}
                    sx={{ textTransform: 'none', flexShrink: 0 }}
                  >
                    Descargar
                  </Button>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
              <Button onClick={() => setDetailPayment(null)} color="inherit">Cerrar</Button>
              {detailPayment.status === 'submitted' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="error" onClick={() => { setDetailPayment(null); setFlagDialog(detailPayment); setReviewNote(''); }}>
                    Observar
                  </Button>
                  <Button variant="contained" color="success" onClick={() => { handleConfirm(detailPayment.id); setDetailPayment(null); }}>
                    Confirmar
                  </Button>
                </Box>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

/* ---- small components ---- */

function TabLabel({ text, count, color }: { text: string; count: number; color: 'primary' | 'error' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {text}
      {count > 0 && (
        <Chip
          label={count}
          size="small"
          color={color}
          sx={{ height: 18, minWidth: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.5 } }}
        />
      )}
    </Box>
  );
}

function DetailField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, ...(highlight && { color: 'error.main' }) }}>{value}</Typography>
    </Box>
  );
}

const thSx = {
  fontWeight: 700,
  fontSize: '0.75rem',
  color: 'text.secondary',
  bgcolor: '#fafafa',
  borderBottom: '1px solid',
  borderColor: 'divider',
  py: 1,
} as const;
