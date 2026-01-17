import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

const ChatList = ({ user, onSelectChat }) => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    // 1. Added 'user' check to prevent running if user is null
    if (!user || !user.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdated", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChatRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
       console.error("Index error:", error);
    });

    return () => unsubscribe();
    // FIX: Included 'user.uid' in dependency array
  }, [user, user.uid]); 

  // FIX: Using the label in the UI to remove 'no-unused-vars' error
  const getRoleLabel = (chat) => {
    return user.uid === chat.sellerId ? 'SELLER' : 'BUYER';
  };

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--secondary)' }}>Your Inbox</h2>
      </div>

      <div style={styles.chatGrid}>
        {chatRooms.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          chatRooms.map(chat => {
            const role = getRoleLabel(chat); // Calling the function here
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
                    backgroundColor: role === 'SELLER' ? 'var(--accent)' : 'var(--primary)',
                  }}>
                    {role}
                  </span>
                </div>
                <h3>{chat.itemTitle || "Thrift Item"}</h3>
                <button className="btn-secondary" style={{ width: '100%' }}>View Chat</button>
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