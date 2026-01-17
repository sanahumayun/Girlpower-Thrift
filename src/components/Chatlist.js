import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

const ChatList = ({ user, onSelectChat }) => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdated", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChatRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
       console.error("Index error? Check console link:", error);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Helper to determine user role
  const getRoleLabel = (chat) => {
    // If you are the person who created the listing (the sellerId), you are the Seller
    // Note: We'll update the Feed.js to save the 'sellerId' in the chat doc for this to work
    return user.uid === chat.sellerId ? 'Selling' : 'Buying';
  };

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--secondary)', marginBottom: '5px' }}>Your Inbox</h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>Stay updated on your thrift deals.</p>
      </div>

      <div style={styles.chatGrid}>
        {chatRooms.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No messages yet. Interested in an item? Start a chat!</p>
          </div>
        ) : (
          chatRooms.map(chat => {
            const isSeller = user.uid === chat.sellerId;
            
            return (
              <div 
                key={chat.id} 
                onClick={() => onSelectChat(chat.id)}
                className="card"
                style={styles.chatCard}
              >
                <div style={styles.cardHeader}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: isSeller ? 'var(--accent)' : 'var(--primary)',
                  }}>
                    {isSeller ? 'SELLER' : 'BUYER'}
                  </span>
                  <span style={styles.timeLabel}>
                    {chat.lastUpdated?.toDate().toLocaleDateString() || 'Recently'}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <h3 style={styles.itemTitle}>{chat.itemTitle || "Thrift Item"}</h3>
                  <p style={styles.participantInfo}>
                    {isSeller ? 'Buyer ID: ' : 'Seller: '} 
                    <span style={{ color: '#555' }}>
                      {chat.id.replace(user.uid, "").replace("_", "").substring(0, 8)}...
                    </span>
                  </p>
                </div>

                <div style={styles.cardFooter}>
                  <button className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
                    View Conversation
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  chatGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  chatCard: {
    padding: '20px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid #f0f0f0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  roleBadge: {
    fontSize: '0.7rem',
    color: 'white',
    padding: '3px 10px',
    borderRadius: '12px',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  timeLabel: {
    fontSize: '0.75rem',
    color: '#bbb'
  },
  itemTitle: {
    margin: '5px 0',
    fontSize: '1.1rem',
    color: 'var(--secondary)'
  },
  participantInfo: {
    fontSize: '0.85rem',
    color: '#999',
    margin: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    border: '2px dashed #eee',
    borderRadius: '15px',
    color: '#888'
  }
};

export default ChatList;