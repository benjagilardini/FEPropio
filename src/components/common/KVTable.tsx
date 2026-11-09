import { Box, Typography } from '@mui/material';

export function KVRow({ label, value, idx = 0 }: { label: string; value?: string | null; idx?: number }) {
  if (!value) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1.5,
        py: 1,
        borderRadius: 1,
        bgcolor: idx % 2 === 0 ? 'grey.50' : 'transparent',
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0, mr: 2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

// Auto-assigns alternating idx to KVRow children for zebra striping
export function KVTable({ children }: { children: React.ReactNode }) {
  let visibleIdx = 0;
  const enhanced = (Array.isArray(children) ? children : [children])
    .flat()
    .filter(Boolean)
    .map((child: any) => {
      if (child?.type === KVRow && child.props.value) {
        const el = { ...child, props: { ...child.props, idx: visibleIdx }, key: child.key ?? visibleIdx };
        visibleIdx++;
        return el;
      }
      return child;
    });
  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>{enhanced}</Box>;
}
