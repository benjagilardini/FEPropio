import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Pagination as MuiPagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../../hooks/useExpenses';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/getApiError';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useForm, Controller } from 'react-hook-form';
import type { ExpenseInput } from '../../types';

const categoryOptions = [
  { value: 'tax', label: 'Impuesto' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'condominiumFees', label: 'Expensas' },
  { value: 'other', label: 'Otro' },
];

const categoryLabels: Record<string, string> = Object.fromEntries(categoryOptions.map((o) => [o.value, o.label]));

const paidByOptions = [
  { value: 'landlord', label: 'Propietario' },
  { value: 'tenant', label: 'Inquilino' },
];

const paidByLabels: Record<string, string> = { landlord: 'Propietario', tenant: 'Inquilino' };

export default function ExpensesPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useExpenses(unitId!, page);
  const createMut = useCreateExpense();
  const deleteMut = useDeleteExpense();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<ExpenseInput>({
    defaultValues: { category: 'other', paidBy: 'landlord' },
  });

  if (isLoading) return <LoadingSpinner />;

  const expenses = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const onSubmit = async (formData: ExpenseInput) => {
    try {
      await createMut.mutateAsync({ unitId: unitId!, data: formData });
      toast.success('Gasto registrado correctamente');
      setDialogOpen(false);
      reset();
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al registrar el gasto'));
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await deleteMut.mutateAsync({ unitId: unitId!, expenseId });
      toast.success('Gasto eliminado');
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al eliminar el gasto'));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Gastos"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Nuevo Gasto
          </Button>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState message="No hay gastos registrados." />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Importe</TableCell>
                  <TableCell>A cargo de</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>{categoryLabels[e.category] || e.category}</TableCell>
                    <TableCell>{e.concept}</TableCell>
                    <TableCell>{formatCurrency(e.amount)}</TableCell>
                    <TableCell>{paidByLabels[e.paidBy] || e.paidBy}</TableCell>
                    <TableCell>
                      <IconButton color="error" size="small" onClick={() => handleDelete(e.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Gasto</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Fecha" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }}
              {...register('date', { required: true })}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField select label="Categoria" {...field}>
                  {categoryOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
            <TextField label="Concepto" {...register('concept', { required: true })} />
            <TextField label="Importe ($)" {...register('amount', { required: true })} />
            <Controller
              name="paidBy"
              control={control}
              render={({ field }) => (
                <TextField select label="A cargo de" {...field}>
                  {paidByOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
