import { FAB } from 'react-native-paper';
import { Link } from 'expo-router';
import type { RoutePath } from '@/types/routes';

interface AddFabProps {
  to: RoutePath;
  label: string;
}

export default function AddFab({ to, label }: AddFabProps) {
  return (
    <Link href={{ pathname: to }} asChild>
      <FAB
        icon="plus"
        label={label}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
      />
    </Link>
  );
}