import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActionArea, Grid, Chip } from '@mui/material';
import { useTenantLeases } from '../../hooks/useLeases';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function HomePage() {
  const { data: leases, isLoading } = useTenantLeases();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;

  if (!leases || leases.length === 0) {
    return <EmptyState message="No tenés contratos activos." />;
  }

  if (leases.length === 1) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Mi Vivienda</Typography>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">Contrato activo</Typography>
              <StatusChip status={leases[0].status} />
            </Box>
            <Typography variant="body1">Inicio: {formatDate(leases[0].startDate)}</Typography>
            <Typography variant="body1">Fin: {formatDate(leases[0].endDate)}</Typography>
            <Typography variant="body1">Alquiler: {formatCurrency(leases[0].initialRent)}</Typography>
            <Typography variant="body1">Indice: <Chip label={leases[0].adjustmentIndex} size="small" /></Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Mis Contratos</Typography>
      <Grid container spacing={3}>
        {leases.map((lease) => (
          <Grid size={{ xs: 12, sm: 6 }} key={lease.id}>
            <Card>
              <CardActionArea onClick={() => navigate(`/my-lease?leaseId=${lease.id}`)}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <StatusChip status={lease.status} />
                    <Chip label={lease.adjustmentIndex} size="small" />
                  </Box>
                  <Typography variant="body1">
                    {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                  </Typography>
                  <Typography variant="body1">Alquiler: {formatCurrency(lease.initialRent)}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
