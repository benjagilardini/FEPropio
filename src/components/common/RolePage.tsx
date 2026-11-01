import { useAuth } from '../../context/AuthContext';

interface Props {
  landlord: React.LazyExoticComponent<() => React.JSX.Element>;
  tenant: React.LazyExoticComponent<() => React.JSX.Element>;
}

export default function RolePage({ landlord: Landlord, tenant: Tenant }: Props) {
  const { user } = useAuth();
  return user?.role === 'landlord' ? <Landlord /> : <Tenant />;
}
