import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";

const categories = ["All", "Tops", "Bottoms", "Shoes", "Accessories", "Outerwear", "Vintage"];

const Feed = ({ onSelectChat }) => {
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Inside Feed.js

const filteredListings = listings.filter(item => {
  const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
  
  // NEW: Only show items that are NOT sold
  const isAvailable = item.status !== 'sold';
  
  return matchesSearch && matchesCategory && isAvailable;
});

  const handleMessageSeller = async (item) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Please log in!");

    const chatId = [currentUser.uid, item.sellerId].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, {
      participants: [currentUser.uid, item.sellerId],
      lastUpdated: serverTimestamp(),
      itemTitle: item.title,
      sellerId: item.sellerId,
      buyerId: currentUser.uid
    }, { merge: true });

    onSelectChat(chatId);
  };


  return (
    <div>
      {/* Category Filter Pills */}
      <div style={styles.filterRow}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              padding: '8px 18px', 
              fontSize: '0.85rem',
              backgroundColor: selectedCategory === cat ? 'var(--primary)' : '#fff',
              color: selectedCategory === cat ? '#fff' : '#666',
              border: '1px solid #eee'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar Section */}
      <div style={styles.searchContainer}>
        <input 
          type="text" 
          placeholder={`Search by name`} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="custom-input"
          style={styles.searchInput}
        />
      </div>

      <div className="grid-3">
        {filteredListings.map(item => (
          <div key={item.id} className="card" style={{ overflow: 'visible' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={item.imageUrl || "https://via.placeholder.com/300?text=No+Image"} 
                alt={item.title} 
                style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '15px 15px 0 0' }} 
              />
              <div style={styles.priceBadge}>PKR {item.price}</div>
              <div style={styles.categoryTag}>{item.category}</div>
            </div>

            <div style={{ padding: '20px', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--secondary)' }}>{item.title}</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#888' }}>Seller: {item.sellerName || "Anonymous"}</p>
              
              <button 
                onClick={() => handleMessageSeller(item)} 
                className="btn-primary" 
                style={{ width: '100%', fontSize: '0.9rem' }}
              >
                Message Seller
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredListings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: '#888', fontSize: '1.2rem' }}>No items found in this category.</p>
          <button onClick={() => {setSearchTerm(''); setSelectedCategory('All')}} className="tab-btn active">Clear Filters</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  filterRow: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    padding: '10px 0 20px 0',
    marginBottom: '10px',
    scrollbarWidth: 'none' // Hide scrollbar for Chrome/Safari later
  },
  searchContainer: { marginBottom: '30px', display: 'flex', justifyContent: 'center' },
  searchInput: { maxWidth: '500px', borderRadius: '30px', padding: '12px 25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  priceBadge: { position: 'absolute', top: '15px', right: '15px', background: 'white', color: 'var(--secondary)', padding: '6px 14px', borderRadius: '25px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 10 },
  categoryTag: { position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 10px', borderRadius: '5px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }
};

export default Feed;