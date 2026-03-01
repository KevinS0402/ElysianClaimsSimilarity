import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchClaims = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Replace this with your ACTUAL Cloud Run URL
      const cloudRunUrl = 'https://elysianclaimssimilarity-488463719336.europe-west1.run.app/search';
      
      const response = await fetch(cloudRunUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the search server.");
    } finally {
      setLoading(false);
    }
  };

  const renderClaimCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>{item.id}</Text>
        <Text style={styles.statusTag}>{item.status}</Text>
      </View>
      
      <Text style={styles.cardTitle}>{item.loss} - {item.type}</Text>
      <Text style={styles.amount}>Settlement: ${item.amount.toLocaleString()}</Text>
      
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Claims Similarity Finder</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Describe the current claim (e.g., pipe burst in office)..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          multiline
        />

        <TouchableOpacity 
          style={[styles.button, !query.trim() && styles.buttonDisabled]} 
          onPress={searchClaims}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Find Similar Claims</Text>
          )}
        </TouchableOpacity>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderClaimCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && results.length === 0 ? (
              <Text style={styles.emptyText}>No results yet. Try searching for something!</Text>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f8' },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 20, marginTop: 10 },
  
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    backgroundColor: '#0a84ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: { backgroundColor: '#a0cfff' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  listContainer: { paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardId: { fontSize: 12, fontWeight: '700', color: '#888' },
  statusTag: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#00501e', 
    backgroundColor: '#cce8d6', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
    overflow: 'hidden'
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4 },
  amount: { fontSize: 16, fontWeight: '600', color: '#0a84ff', marginBottom: 12 },
  description: { fontSize: 15, color: '#555', lineHeight: 22 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 }
});