import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Divider, Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useTenantLeases, useLease } from '../../hooks/useLeases';
import { leaseApi } from '../../api/leaseApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import PageHeader from '../../components/common/PageHeader';
import { InfoRow } from '../../components/common/InfoRow';
import { CopyField } from '../../components/common/CopyField';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { frequencyLabels } from '../../constants/labels';

export default function LeasePage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];
  const { data: lease, isLoading } = useLease(activeLease?.id || '');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lease?.document?.fileId || !lease?.id) return;
    let revoked = false;
    leaseApi.downloadDocument(lease.id).then((res) => {
      if (revoked) return;
      setPdfUrl(URL.createObjectURL(res.data));
    }).catch(() => {});
    return () => { revoked = true; if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [lease?.document?.fileId, lease?.id]);

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!lease) return <EmptyState message="No tenés un contrato asociado." />;

  const handleDownload = async () => {
    try {
      const response = await leaseApi.downloadDocument(lease.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = lease.document?.fileName || 'contrato.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { /* no document */ }
  };

  const daysRemaining = Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const progress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

  return (
    <Box>
      <PageHeader
        title="Mi Contrato"
        chips={<StatusChip status={lease.status} size="medium" />}
        actions={
          lease.document && (
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
              Descargar PDF
            </Button>
          )
        }
      />

      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
        <Paper variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden', flex: 7, minWidth: 0 }}>
          {lease.document ? (
            <Box sx={{ bgcolor: '#f5f5f5', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {lease.document.fileName && (
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{lease.document.fileName}</Typography>
                  <Chip label={lease.document.mimeType === 'application/pdf' ? 'PDF' : 'Imagen'} size="small" variant="outlined" />
                </Box>
              )}
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Contrato"
                  style={{ width: '100%', flex: 1, border: 'none' }}
                />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Cargando documento...</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', px: 4 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                <DownloadIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Sin documento adjunto</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                El propietario todavía no adjuntó el contrato en formato digital.
              </Typography>
            </Box>
          )}
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 3, minWidth: 0, overflow: 'auto' }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Vigencia</Typography>
            </Box>
            <InfoRow label="Inicio" value={formatDate(lease.startDate)} />
            <Divider />
            <InfoRow label="Fin" value={formatDate(lease.endDate)} />
            <Divider />
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Progreso del contrato</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Vencido'}
                </Typography>
              </Box>
              <Box sx={{ height: 5, bgcolor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${progress}%`, bgcolor: progress > 90 ? 'warning.main' : 'primary.main', borderRadius: 3, transition: 'width 0.4s' }} />
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <AttachMoneyIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Condiciones económicas</Typography>
            </Box>
            <InfoRow label="Alquiler inicial" value={formatCurrency(lease.initialRent)} />
            <Divider />
            {lease.securityDeposit && (
              <>
                <InfoRow label="Depósito en garantía" value={formatCurrency(lease.securityDeposit)} />
                <Divider />
              </>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Ajuste</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={lease.adjustmentIndex} size="small" color="primary" variant="outlined" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {(frequencyLabels[lease.adjustmentFrequencyMonths] || `cada ${lease.adjustmentFrequencyMonths} meses`).toLowerCase()}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {lease.paymentAccount && (
            <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'divider', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <AccountBalanceIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Datos para transferir</Typography>
              </Box>
              <InfoRow label="Titular" value={lease.paymentAccount.holderName} />
              <Divider />
              <InfoRow label="Banco" value={lease.paymentAccount.bank} />
              <Divider />
              <CopyField label="CBU/CVU" value={lease.paymentAccount.cbuOrCvu} />
              {lease.paymentAccount.alias && (
                <>
                  <Divider />
                  <CopyField label="Alias" value={lease.paymentAccount.alias} />
                </>
              )}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
