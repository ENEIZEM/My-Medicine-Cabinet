import { FlatList, View } from 'react-native';
import { useTheme, Card, Text, Button, Icon } from 'react-native-paper';
import { useMedicine } from '@/contexts/MedicineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {StyleSheet } from 'react-native';

export default function MedicineScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { medicines } = useMedicine();

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      {medicines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon 
            source="pill" 
            size={60} 
            color={colors.onSurfaceVariant} 
          />
          <Text style={{ color: colors.onSurfaceVariant, marginTop: 16 }}>
            {t.medicine.emptyState}
          </Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12, backgroundColor: colors.surfaceVariant }}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Icon 
                    source="pill" 
                    size={24} 
                    color={colors.primary} 
                  />
                  <Text style={{ color: colors.onSurface, marginLeft: 8 }}>
                    {item.name}
                  </Text>
                </View>
                <Text style={{ color: colors.onSurfaceVariant }}>
                  {t.medicine.quantity}: {item.quantity}
                </Text>
              </Card.Content>
            </Card>
          )}
        />
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});