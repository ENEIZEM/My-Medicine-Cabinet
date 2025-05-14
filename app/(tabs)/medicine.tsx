import { FlatList, View } from 'react-native';
import { useTheme, Card, Text, FAB } from 'react-native-paper';
import { useMedicine } from '@/contexts/MedicineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function MedicineScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { medicines } = useMedicine();

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      {medicines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.onSurfaceVariant, marginBottom: 20 }}>
            {t.medicine.emptyState}
          </Text>
          <Link href="/(modals)/add-medicine" asChild>
            <FAB
              icon="plus"
              label={t.medicine.addTitle}
              style={styles.fab}
            />
          </Link>
        </View>
      ) : (
        <>
          <FlatList
            data={medicines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 12, backgroundColor: colors.surfaceVariant }}>
                <Card.Content>
                  <Text style={{ color: colors.onSurface }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.onSurfaceVariant }}>
                    {t.medicine.quantity}: {item.quantity}
                  </Text>
                </Card.Content>
              </Card>
            )}
          />
          <Link href="/(modals)/add-medicine" asChild>
            <FAB
              icon="plus"
              label={t.medicine.addTitle}
              style={styles.fab}
            />
          </Link>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});