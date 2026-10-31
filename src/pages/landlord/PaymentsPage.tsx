import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Pagination as MuiPagination,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import FlagIcon from '@mui/icons-material/Flag';
import { usePayments, useConfirmPayment, useFlagPayment } from '../../hooks/usePayments';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatPeriod } from '../../utils/formatDate';

export default function PaymentsPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayments(leaseId!, page);
  const confirmMut = useConfirmPayment();
  const flagMut = useFlagPayment();

  const toast = useToast();
  const [flagDialog, setFlagDialog] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  if (isLoading) return <LoadingSpinner />;

  const payments = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handleConfirm = async (paymentId: string) => {
    try {
      await confirmMut.mutateAsync({ leaseId: leaseId!, paymentId });
      toast.success('Pago confirmado');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar el pago');
    }
  };

  const handleFlag = async () => {
    if (!flagDialog) return;
    try {
      await flagMut.mutateAsync({ leaseId: leaseId!, paymentId: flagDialog, reviewNote });
      toast.warning('Pago observado');
      setFlagDialog(null);
      setReviewNote('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al observar el pago');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Comprobantes de Pago</Typography>

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
                  <TableCell>Esperado</TableCell>
                  <TableCell>Fecha de pago</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Observación</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatPeriod(p.period)}</TableCell>
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{p.expectedAmount ? formatCurrency(p.expectedAmount) : '-'}</TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell><StatusChip status={p.status} /></TableCell>
                    <TableCell>{p.reviewNote || '-'}</TableCell>
                    <TableCell>
                      {p.status === 'submitted' && (
                        <Box display="flex" gap={1}>
                          <Button
                            size="small" variant="outlined" color="success" startIcon={<CheckIcon />}
                            onClick={() => handleConfirm(p.id)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="small" variant="outlined" color="error" startIcon={<FlagIcon />}
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
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}

      <Dialog open={!!flagDialog} onClose={() => setFlagDialog(null)}>
        <DialogTitle>Observar comprobante</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Observación" multiline rows={3}
            value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialog(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleFlag} disabled={!reviewNote.trim()}>
            Observar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
