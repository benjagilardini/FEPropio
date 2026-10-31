import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, Button } from '@mui/material';
import { useTenantLeases } from '../../hooks/useLeases';
import { leaseApi } from '../../api/leaseApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function LeasePage() {
  const { data: leases, isLoading } = useTenantLeases();

  if (isLoading) return <LoadingSpinner />;

  const lease = leases?.find((l) => l.status === 'active') || leases?.[0];
  if (!lease) return <EmptyState message="No tenes un contrato asociado." />;

  const handleDownload = async () => {
    try {
      const response = await leaseApi.downloadDocument(lease.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', lease.document?.fileName || 'contrato.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Document download not yet available
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h5">Mi Contrato</Typography>
        <StatusChip status={lease.status} size="medium" />
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Datos del contrato</Typography>
        <List dense>
          <ListItem><ListItemText primary="Inicio" secondary={formatDate(lease.startDate)} /></ListItem>
          <ListItem><ListItemText primary="Fin" secondary={formatDate(lease.endDate)} /></ListItem>
          <ListItem><ListItemText primary="Alquiler inicial" secondary={formatCurrency(lease.initialRent)} /></ListItem>
          <ListItem>
            <ListItemText
              primary="Ajuste"
              secondary={<><Chip label={lease.adjustmentIndex} size="small" /> cada {lease.adjustmentFrequencyMonths} mes(es)</>}
            />
          </ListItem>
          {lease.securityDeposit && (
            <ListItem><ListItemText primary="Deposito" secondary={formatCurrency(lease.securityDeposit)} /></ListItem>
          )}
        </List>
        {lease.document && (
          <Button variant="outlined" onClick={handleDownload} sx={{ mt: 1 }}>
            Descargar contrato PDF
          </Button>
        )}
      </Paper>

      {lease.paymentAccount && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Datos de cobro del propietario</Typography>
          <List dense>
            <ListItem><ListItemText primary="Titular" secondary={lease.paymentAccount.holderName} /></ListItem>
            <ListItem><ListItemText primary="Banco" secondary={lease.paymentAccount.bank} /></ListItem>
            <ListItem><ListItemText primary="CBU/CVU" secondary={lease.paymentAccount.cbuOrCvu} /></ListItem>
            {lease.paymentAccount.alias && (
              <ListItem><ListItemText primary="Alias" secondary={lease.paymentAccount.alias} /></ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
}
