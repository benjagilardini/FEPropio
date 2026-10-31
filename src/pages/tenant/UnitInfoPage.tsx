import { Box, Typography, Paper, List, ListItem, ListItemText, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTenantLeases } from '../../hooks/useLeases';
import { leaseApi } from '../../api/leaseApi';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import type { Unit } from '../../types';

const utilityTypeLabels: Record<string, string> = {
  electricity: 'Electricidad',
  gas: 'Gas',
  water: 'Agua',
  condominiumFees: 'Expensas',
  propertyTax: 'Impuesto inmobiliario',
};

export default function UnitInfoPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];

  const { data: unit, isLoading: unitLoading } = useQuery<Unit>({
    queryKey: ['tenant', 'unit', activeLease?.id],
    queryFn: () => leaseApi.getUnitForTenant(activeLease!.id),
    enabled: !!activeLease,
  });

  if (leasesLoading || unitLoading) return <LoadingSpinner />;
  if (!unit) return <EmptyState message="No se encontró información de la vivienda." />;

  const a = unit.address;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Mi Vivienda</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Datos</Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary="Dirección"
              secondary={`${a.street} ${a.number}${a.floor ? `, Piso ${a.floor}` : ''}${a.apartment ? `, Depto ${a.apartment}` : ''} - ${a.city}, ${a.province}`}
            />
          </ListItem>
          <ListItem><ListItemText primary="Tipo" secondary={unit.unitType === 'apartment' ? 'Departamento' : 'Casa'} /></ListItem>
          {unit.areaSqm && <ListItem><ListItemText primary="Superficie" secondary={`${unit.areaSqm} m²`} /></ListItem>}
        </List>
      </Paper>

      {unit.facilities && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Instalaciones</Typography>
          <List dense>
            {unit.facilities.waterShutoff && <ListItem><ListItemText primary="Llave de paso de agua" secondary={unit.facilities.waterShutoff} /></ListItem>}
            {unit.facilities.gasShutoff && <ListItem><ListItemText primary="Llave de paso de gas" secondary={unit.facilities.gasShutoff} /></ListItem>}
            {unit.facilities.electricalPanel && <ListItem><ListItemText primary="Tablero eléctrico" secondary={unit.facilities.electricalPanel} /></ListItem>}
            {unit.facilities.meters && <ListItem><ListItemText primary="Medidores" secondary={unit.facilities.meters} /></ListItem>}
          </List>
        </Paper>
      )}

      {(unit.utilityAccounts?.length ?? 0) > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Servicios</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Prestador</TableCell>
                  <TableCell>N° cuenta</TableCell>
                  <TableCell>Paga</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unit.utilityAccounts!.map((ua, i) => (
                  <TableRow key={i}>
                    <TableCell>{utilityTypeLabels[ua.utilityType] || ua.utilityType}</TableCell>
                    <TableCell>{ua.provider}</TableCell>
                    <TableCell>{ua.accountId}</TableCell>
                    <TableCell>{ua.paidBy === 'tenant' ? 'Inquilino' : 'Propietario'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
