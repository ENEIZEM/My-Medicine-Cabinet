// constants/styles.ts
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 30,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  row: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 15,
  paddingHorizontal: 5,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
  },
});
