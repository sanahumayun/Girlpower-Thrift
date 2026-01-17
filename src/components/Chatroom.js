import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const ChatRoom = ({ chatId, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // 1. Send the message
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      createdAt: serverTimestamp(),
      senderId: user.uid,
    });

    // 2. Update the parent 'lastUpdated' timestamp for ChatList sorting
    await updateDoc(doc(db, "chats", chatId), {
      lastUpdated: serverTimestamp()
    });

    setNewMessage('');
  };

  return (
    // In ChatRoom.js
<div className="chat-window" style={styles.chatWindow}>
  <div className="message-list" style={styles.messageList}>
    {messages.map(msg => (
      <div key={msg.id} style={{
        ...styles.bubble,
        alignSelf: msg.senderId === user.uid ? 'flex-end' : 'flex-start',
        background: msg.senderId === user.uid ? 'var(--primary)' : '#eee',
        color: msg.senderId === user.uid ? 'white' : '#333',
        borderRadius: msg.senderId === user.uid ? '18px 18px 0 18px' : '18px 18px 18px 0'
      }}>
        {msg.text}
      </div>
    ))}
  </div>
  <form onSubmit={sendMessage} style={styles.chatInputArea}>
    <input 
      className="chat-input" 
      placeholder="Type a message..." 
      style={styles.inputField} 
      value={newMessage} 
      onChange={(e) => setNewMessage(e.target.value)} 
    />
    <button type="submit" className="btn-primary">Send</button>
  </form>
</div>
  );
};

const styles = {
  chatWindow: { background: '#fff', height: '70vh', display: 'flex', flexDirection: 'column', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' },
  messageList: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  bubble: { padding: '10px 15px', maxWidth: '70%', fontSize: '0.95rem', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
  chatInputArea: { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' },
  inputField: { flex: 1, border: '1px solid #ddd', borderRadius: '25px', padding: '0 15px', outline: 'none' }
};

export default ChatRoom;